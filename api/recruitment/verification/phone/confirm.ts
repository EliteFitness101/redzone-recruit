import { json, requestId } from "../../../_lib/recruitment.js";

export default async function handler(req: Request) {
  const rid = requestId();
  if (req.method !== "POST") return json({ error: "Method not allowed", request_id: rid }, 405);
  return json({ error: "Phone verification adapter is not active", code: "PHONE_OTP_NOT_ACTIVE", request_id: rid }, 501);
}
