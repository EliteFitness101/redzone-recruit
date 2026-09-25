import { z } from "zod";
import { randomBytes, createHash } from "node:crypto";
import { backendClient, json, requestId } from "../../../_lib/recruitment.js";

const schema = z.object({ application_reference: z.string().trim().min(3).max(80) });

function base64url(input: Buffer) {
  return input.toString("base64url");
}

function pkceVerifier() {
  return base64url(randomBytes(48));
}

function pkceChallenge(verifier: string) {
  return base64url(createHash("sha256").update(verifier).digest());
}

export default async function handler(req: Request) {
  const rid = requestId();
  if (req.method !== "POST") return json({ error: "Method not allowed", request_id: rid }, 405);

  const clientId = process.env.NINAUTH_CLIENT_ID;
  const appId = process.env.NINAUTH_APP_ID;
  const redirectUri = process.env.NINAUTH_REDIRECT_URI;
  if (!clientId || !appId || !redirectUri) {
    return json({
      error: "NINAuth is not yet provisioned for this recruitment deployment",
      code: "NINAUTH_NOT_CONFIGURED",
      request_id: rid,
    }, 503);
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return json({ error: "Invalid application reference", request_id: rid }, 400);

  try {
    const supabase = backendClient();
    const { data: application, error } = await supabase
      .from("applications")
      .select("id,reference_number")
      .eq("reference_number", parsed.data.application_reference)
      .maybeSingle();

    if (error || !application) return json({ error: "Application not found", request_id: rid }, 404);

    const state = base64url(randomBytes(32));
    const verifier = pkceVerifier();
    const challenge = pkceChallenge(verifier);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase.from("verification_sessions").insert({
      application_id: application.id,
      provider: "nimc_ninauth",
      state,
      pkce_verifier: verifier,
      redirect_uri: redirectUri,
      expires_at: expiresAt,
    });
    if (sessionError) {
      console.error("[ninauth-start]", rid, sessionError);
      return json({ error: "Could not start identity verification", request_id: rid }, 500);
    }

    const params = new URLSearchParams({
      client_id: clientId,
      app_id: appId,
      redirect_uri: redirectUri,
      response_type: "code",
      code_challenge_method: "S256",
      code_challenge: challenge,
      state,
      scope: process.env.NINAUTH_SCOPE || "openid profile",
    });

    const authorizationBase = process.env.NINAUTH_AUTHORIZATION_URL;
    if (!authorizationBase) return json({ error: "NINAuth authorization endpoint is not configured", code: "NINAUTH_NOT_CONFIGURED", request_id: rid }, 503);

    return json({ authorization_url: `${authorizationBase}?${params.toString()}`, request_id: rid });
  } catch (error) {
    console.error("[ninauth-start]", rid, error);
    return json({ error: "Identity verification unavailable", request_id: rid }, 503);
  }
}
