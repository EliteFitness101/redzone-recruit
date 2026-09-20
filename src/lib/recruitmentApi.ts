export interface RecruitmentApplicationPayload {
  full_name: string;
  email?: string;
  phone: string;
  location?: string;
  age?: number | null;
  education?: string;
  fitness_level?: string;
  prior_experience?: string;
  program?: string;
  cohort?: string;
  source?: string;
  campaign?: string;
  attribution?: Record<string, unknown>;
  notes?: string;
  user_id?: string | null;
}

export async function submitRecruitmentApplication(payload: RecruitmentApplicationPayload) {
  const response = await fetch("/api/recruitment/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "Application submission failed");
  return body as { application: { id: string; reference_number: string | null } };
}

export async function startNINAuthVerification(applicationReference: string) {
  const response = await fetch("/api/recruitment/verification/ninauth/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ application_reference: applicationReference }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "Identity verification is not available");
  return body as { authorization_url: string };
}

export async function getVerificationStatus(applicationReference: string) {
  const response = await fetch(
    `/api/recruitment/verification/${encodeURIComponent(applicationReference)}/status`,
    { headers: { Accept: "application/json" } },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "Could not retrieve verification status");
  return body;
}
