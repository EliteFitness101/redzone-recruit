import { z } from "zod";
import { json, requestId } from "../../../_lib/recruitment.js";

export default async function handler(req: Request) {
  const rid = requestId();
  if (req.method !== "POST") return json({ error: "Method not allowed", request_id: rid }, 405);
  if (!process.env.PHONE_OTP_PROVIDER) {
    return json({ error: "Phone OTP provider is not configured", code: "PHONE_OTP_NOT_CONFIGURED", request_id: rid }, 503);
  }
  const parsed = z.object({ application_reference: z.string().trim().min(3).max(80), phone: z.string().trim().min(7).max(30) }).safeParse(await req.json());
  if (!parsed.success) return json({ error: "Invalid phone verification request", request_id: rid }, 400);
  return json({ error: "Configured phone provider adapter is required before activation", code: "PHONE_OTP_ADAPTER_PENDING", request_id: rid }, 501);
}
