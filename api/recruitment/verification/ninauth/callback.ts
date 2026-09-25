import { createHash } from "node:crypto";
import { backendClient, json, requestId } from "../../../_lib/recruitment";

export default async function handler(req: Request) {
  const rid = requestId();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorCode = url.searchParams.get("error");

  if (errorCode) return json({ error: "NINAuth authorization was not completed", code: errorCode, request_id: rid }, 400);
  if (!code || !state) return json({ error: "Missing NINAuth callback parameters", request_id: rid }, 400);

  const clientId = process.env.NINAUTH_CLIENT_ID;
  const clientSecret = process.env.NINAUTH_CLIENT_SECRET;
  const appId = process.env.NINAUTH_APP_ID;
  const redirectUri = process.env.NINAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !appId || !redirectUri) return json({ error: "NINAuth is not configured", code: "NINAUTH_NOT_CONFIGURED", request_id: rid }, 503);

  try {
    const supabase = backendClient();
    const { data: session, error: sessionError } = await supabase
      .from("verification_sessions")
      .select("id,application_id,pkce_verifier,redirect_uri,expires_at")
      .eq("state", state)
      .eq("provider", "nimc_ninauth")
      .maybeSingle();

    if (sessionError || !session) return json({ error: "Verification session not found", request_id: rid }, 400);
    if (new Date(session.expires_at).getTime() < Date.now()) return json({ error: "Verification session expired", request_id: rid }, 400);

    const tokenResponse = await fetch(process.env.NINAUTH_TOKEN_URL || "https://sso.ninauth.nimc.gov.ng/api/v1/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/json", "client-id": clientId, "client-secret": clientSecret, "client-type": "enterprise" },
      body: JSON.stringify({
        client_id: clientId,
        app_id: appId,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code,
        code_verifier: session.pkce_verifier,
        state,
        rc_number: "",
      }),
    });

    if (!tokenResponse.ok) {
      const details = await tokenResponse.text();
      console.error("[ninauth-token]", rid, tokenResponse.status, details.slice(0, 500));
      await supabase.from("verification_sessions").delete().eq("id", session.id);
      return json({ error: "NINAuth token exchange failed", request_id: rid }, 502);
    }

    const token = await tokenResponse.json();
    const userInfoResponse = await fetch(process.env.NINAUTH_USERINFO_URL || "https://sso.ninauth.nimc.gov.ng/api/v1/oauth/userinfo", {
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    if (!userInfoResponse.ok) {
      await supabase.from("verification_sessions").delete().eq("id", session.id);
      return json({ error: "NINAuth identity retrieval failed", request_id: rid }, 502);
    }

    const userInfo = await userInfoResponse.json();
    const identityReference = userInfo?.data?.id || userInfo?.id || null;
    const reference = identityReference ? createHash("sha256").update(String(identityReference)).digest("hex") : null;

    const { data: verification, error: verificationError } = await supabase
      .from("candidate_verifications")
      .insert({
        application_id: session.application_id,
        verification_type: "nin",
        provider: "nimc_ninauth",
        status: reference ? "verified" : "manual_review",
        match_result: reference ? "match" : "not_checked",
        provider_reference: reference ? String(reference).slice(0, 200) : null,
        performed_at: new Date().toISOString(),
        metadata: { scope: token.scope || [], verified_fields: Object.keys(userInfo?.data || userInfo || {}) },
      })
      .select("id,status")
      .single();

    await supabase.from("verification_events").insert({
      verification_id: verification?.id,
      event: "ninauth_verified",
      provider_request_id: rid,
      metadata: { application_id: session.application_id },
    });

    await supabase.from("verification_sessions").delete().eq("id", session.id);
    return json({ ok: true, status: verification?.status || "manual_review", request_id: rid });
  } catch (error) {
    console.error("[ninauth-callback]", rid, error);
    return json({ error: "Identity verification unavailable", request_id: rid }, 503);
  }
}
