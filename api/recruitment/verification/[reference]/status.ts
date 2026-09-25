import { backendClient, json, requestId } from "../../../_lib/recruitment";

export default async function handler(req: Request) {
  const rid = requestId();
  if (req.method !== "GET") return json({ error: "Method not allowed", request_id: rid }, 405);
  const path = new URL(req.url).pathname.replace(/\/$/, "");
  const marker = "/api/recruitment/verification/";
  const reference = path.startsWith(marker) ? decodeURIComponent(path.slice(marker.length).replace(/\/status$/, "")) : "";
  if (!reference) return json({ error: "Missing application reference", request_id: rid }, 400);

  try {
    const supabase = backendClient();
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id,reference_number")
      .eq("reference_number", reference)
      .maybeSingle();

    if (appError || !application) return json({ error: "Application not found", request_id: rid }, 404);

    const { data, error } = await supabase
      .from("candidate_verifications")
      .select("verification_type,provider,status,match_result,performed_at,expires_at,created_at")
      .eq("application_id", application.id)
      .order("created_at", { ascending: false });

    if (error) return json({ error: "Could not read verification status", request_id: rid }, 500);
    return json({ application_reference: reference, verifications: data || [], request_id: rid });
  } catch (error) {
    console.error("[verification-status]", rid, error);
    return json({ error: "Verification service unavailable", request_id: rid }, 503);
  }
}
