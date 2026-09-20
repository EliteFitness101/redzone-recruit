import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function backendClient() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Recruitment backend is not configured");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function json(data: unknown, status = 200, extraHeaders: Record<string,string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

export function method(req: Request, expected: string) {
  return req.method === expected;
}

export function clientHash(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(forwarded).digest("hex");
}

export function requestId() {
  return randomBytes(18).toString("base64url");
}

export function applicationReference(input: string) {
  return input.trim().slice(0, 80);
}
