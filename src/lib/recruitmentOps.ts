// Recruitment Operations extensions: interviews v2, documents, audit log,
// recruiter tasks and extended analytics. Additive to src/lib/recruitment.ts.
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/* Interviews                                                          */
/* ------------------------------------------------------------------ */

export const INTERVIEW_TYPES = ["virtual", "physical", "telephone"] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
  rescheduled: "Rescheduled",
};

export const TIMEZONES = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Johannesburg",
  "Europe/London",
  "America/New_York",
  "Asia/Dubai",
] as const;

export interface InterviewRecord {
  id: string;
  application_id: string;
  interviewer: string | null;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  interview_type: InterviewType;
  location: string | null;
  meeting_link: string | null;
  round: number;
  status: InterviewStatus;
  outcome: string;
  score: number | null;
  scorecard: Record<string, number | string> | null;
  notes: string | null;
  reminder_sent_at: string | null;
  rescheduled_from: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleInterviewInput {
  application_id: string;
  scheduled_at: string;
  timezone?: string;
  interview_type?: InterviewType;
  location?: string;
  meeting_link?: string;
  duration_minutes?: number;
  round?: number;
  notes?: string;
  rescheduled_from?: string;
}

export async function listInterviewRounds(applicationId: string): Promise<InterviewRecord[]> {
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("application_id", applicationId)
    .order("round", { ascending: true })
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as InterviewRecord[];
}

export async function createInterview(input: ScheduleInterviewInput): Promise<InterviewRecord> {
  if (!input.scheduled_at) throw new Error("Pick an interview date and time");
  const type = input.interview_type ?? "virtual";
  if (type === "virtual" && !input.meeting_link?.trim())
    throw new Error("A meeting link is required for virtual interviews");
  if (type === "physical" && !input.location?.trim())
    throw new Error("A location is required for in-person interviews");

  const existing = await listInterviewRounds(input.application_id);
  const round = input.round ?? Math.max(0, ...existing.map((i) => i.round)) + 1;

  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("interviews")
    .insert({
      application_id: input.application_id,
      scheduled_at: new Date(input.scheduled_at).toISOString(),
      timezone: input.timezone ?? "Africa/Lagos",
      interview_type: type,
      location: input.location?.trim() || null,
      meeting_link: input.meeting_link?.trim() || null,
      duration_minutes: input.duration_minutes ?? 45,
      round,
      status: "scheduled",
      notes: input.notes?.trim() || null,
      interviewer: auth.user?.id ?? null,
      rescheduled_from: input.rescheduled_from ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;

  await logAudit({
    action: "interview_scheduled",
    entity_type: "interview",
    entity_id: (data as { id: string }).id,
    new_value: { scheduled_at: input.scheduled_at, round, type },
  });
  await queueInterviewReminders((data as unknown as InterviewRecord));
  return data as unknown as InterviewRecord;
}

export async function updateInterview(
  id: string,
  patch: Partial<
    Pick<
      InterviewRecord,
      | "scheduled_at"
      | "status"
      | "outcome"
      | "score"
      | "scorecard"
      | "notes"
      | "meeting_link"
      | "location"
      | "interview_type"
      | "timezone"
      | "duration_minutes"
    >
  >,
  reason?: string,
): Promise<void> {
  const { data: before } = await supabase.from("interviews").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("interviews").update(patch as never).eq("id", id);
  if (error) throw error;
  await logAudit({
    action: "interview_updated",
    entity_type: "interview",
    entity_id: id,
    previous_value: (before as Record<string, unknown>) ?? null,
    new_value: patch as Record<string, unknown>,
    reason,
  });
}

export async function cancelInterview(id: string, reason: string): Promise<void> {
  await updateInterview(id, { status: "cancelled", notes: reason }, reason);
}

/** Cancels the old round and books a new one, keeping the link between them. */
export async function rescheduleInterview(
  interview: InterviewRecord,
  scheduled_at: string,
  reason?: string,
): Promise<void> {
  await updateInterview(interview.id, { status: "rescheduled" }, reason);
  await createInterview({
    application_id: interview.application_id,
    scheduled_at,
    timezone: interview.timezone,
    interview_type: interview.interview_type,
    location: interview.location ?? undefined,
    meeting_link: interview.meeting_link ?? undefined,
    duration_minutes: interview.duration_minutes,
    round: interview.round,
    notes: reason,
    rescheduled_from: interview.id,
  });
}

export async function saveScorecard(
  id: string,
  scorecard: Record<string, number | string>,
  score: number,
  notes?: string,
): Promise<void> {
  await updateInterview(id, { scorecard, score, notes, status: "completed", outcome: score >= 60 ? "passed" : "failed" });
}

/** Fires reminder automations for applicant and recruiter (best effort). */
export async function queueInterviewReminders(interview: InterviewRecord): Promise<void> {
  try {
    await supabase.from("notifications").insert({
      audience: "admin",
      type: "interview_reminder",
      title: "Interview reminder scheduled",
      body: `Round ${interview.round} on ${new Date(interview.scheduled_at).toLocaleString()}`,
      link: `/admin/applications?app=${interview.application_id}`,
      metadata: { interview_id: interview.id, application_id: interview.application_id } as never,
    } as never);
  } catch {
    /* reminders are best-effort */
  }
}

/* ------------------------------------------------------------------ */
/* Calendar (.ics)                                                     */
/* ------------------------------------------------------------------ */

function icsDate(value: string | Date): string {
  return new Date(value).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildIcs(interview: InterviewRecord, applicantName: string): string {
  const end = new Date(new Date(interview.scheduled_at).getTime() + interview.duration_minutes * 60000);
  const where = interview.interview_type === "physical" ? interview.location ?? "" : interview.meeting_link ?? "";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Martial X//Recruitment//EN",
    "BEGIN:VEVENT",
    `UID:${interview.id}@martialx`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(interview.scheduled_at)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:Martial X interview (Round ${interview.round}) — ${applicantName}`,
    `LOCATION:${where.replace(/,/g, "\\,")}`,
    `DESCRIPTION:${(interview.notes ?? "Martial X recruitment interview").replace(/,/g, "\\,")}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Interview reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(interview: InterviewRecord, applicantName: string): void {
  const blob = new Blob([buildIcs(interview, applicantName)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `interview-round-${interview.round}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export const DOC_TYPES = [
  "CV / Resume",
  "Cover Letter",
  "Government ID",
  "Passport Photograph",
  "Certificate",
  "Training Certificate",
  "Professional Licence",
  "Other Supporting Document",
] as const;

export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const DOC_BUCKET = "applicant-documents";

export interface ApplicantDocument {
  id: string;
  application_id: string;
  uploaded_by: string | null;
  doc_type: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  version: number;
  status: string;
  scan_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export async function listDocuments(applicationId: string): Promise<ApplicantDocument[]> {
  const { data, error } = await supabase
    .from("application_documents")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ApplicantDocument[];
}

export async function uploadDocument(input: {
  applicationId: string;
  docType: string;
  file: File;
  onProgress?: (pct: number) => void;
}): Promise<ApplicantDocument> {
  const { file, docType, applicationId, onProgress } = input;
  if (file.size > MAX_DOC_BYTES) throw new Error("File is larger than the 10MB limit");
  if (!ALLOWED_MIME.includes(file.type))
    throw new Error("Unsupported file type. Upload a PDF, Word document or image.");

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("You must be signed in to upload documents");

  const existing = await listDocuments(applicationId);
  const version = existing.filter((d) => d.doc_type === docType).length + 1;

  const safeName = file.name.replace(/[^\w.\-]/g, "_").slice(-80);
  const path = `${uid}/${applicationId}/${Date.now()}-v${version}-${safeName}`;

  onProgress?.(15);
  const { error: upErr } = await supabase.storage.from(DOC_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (upErr) throw upErr;
  onProgress?.(75);

  const { data, error } = await supabase
    .from("application_documents")
    .insert({
      application_id: applicationId,
      uploaded_by: uid,
      doc_type: docType,
      file_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      version,
      status: "pending",
      // Placeholder for an antivirus scanning hook; storage webhook flips this to "clean".
      scan_status: "pending_scan",
    } as never)
    .select()
    .single();
  if (error) throw error;
  onProgress?.(100);

  await logAudit({
    action: "document_uploaded",
    entity_type: "document",
    entity_id: (data as { id: string }).id,
    new_value: { doc_type: docType, file_name: file.name, version },
  });
  return data as unknown as ApplicantDocument;
}

export async function getDocumentUrl(path: string, seconds = 120): Promise<string> {
  const { data, error } = await supabase.storage.from(DOC_BUCKET).createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function reviewDocument(
  id: string,
  status: "approved" | "rejected",
  notes?: string,
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("application_documents")
    .update({
      status,
      review_notes: notes ?? null,
      reviewed_by: auth.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq("id", id);
  if (error) throw error;
  await logAudit({
    action: "document_reviewed",
    entity_type: "document",
    entity_id: id,
    new_value: { status },
    reason: notes,
  });
}

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

export interface AuditEntry {
  id: string;
  actor: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  request_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function logAudit(entry: {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  previous_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("audit_logs").insert({
      actor: auth.user.id,
      actor_email: auth.user.email ?? null,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      previous_value: (entry.previous_value ?? null) as never,
      new_value: (entry.new_value ?? null) as never,
      reason: entry.reason ?? null,
      request_id: crypto.randomUUID(),
      metadata: (entry.metadata ?? {}) as never,
    } as never);
  } catch {
    /* auditing must never break the user action */
  }
}

export async function listAuditLogs(filter?: {
  entity_id?: string;
  entity_type?: string;
  limit?: number;
}): Promise<AuditEntry[]> {
  let q = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filter?.limit ?? 100);
  if (filter?.entity_id) q = q.eq("entity_id", filter.entity_id);
  if (filter?.entity_type) q = q.eq("entity_type", filter.entity_type);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AuditEntry[];
}

/* ------------------------------------------------------------------ */
/* Recruiter tasks                                                     */
/* ------------------------------------------------------------------ */

export interface RecruiterTask {
  id: string;
  application_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  title: string;
  details: string | null;
  due_at: string | null;
  completed_at: string | null;
  priority: string;
  created_at: string;
}

export async function listTasks(applicationId?: string): Promise<RecruiterTask[]> {
  let q = supabase.from("recruiter_tasks").select("*").order("due_at", { ascending: true });
  if (applicationId) q = q.eq("application_id", applicationId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as RecruiterTask[];
}

export async function createTask(input: {
  application_id?: string;
  title: string;
  details?: string;
  due_at?: string;
  assigned_to?: string | null;
  priority?: string;
}): Promise<void> {
  if (!input.title.trim()) throw new Error("Task title is required");
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("recruiter_tasks").insert({
    application_id: input.application_id ?? null,
    title: input.title.trim(),
    details: input.details?.trim() || null,
    due_at: input.due_at ? new Date(input.due_at).toISOString() : null,
    assigned_to: input.assigned_to ?? auth.user?.id ?? null,
    created_by: auth.user?.id ?? null,
    priority: input.priority ?? "normal",
  } as never);
  if (error) throw error;
  await logAudit({ action: "task_created", entity_type: "task", new_value: { title: input.title } });
}

export async function completeTask(id: string): Promise<void> {
  const { error } = await supabase
    .from("recruiter_tasks")
    .update({ completed_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
  await logAudit({ action: "task_completed", entity_type: "task", entity_id: id });
}

/* ------------------------------------------------------------------ */
/* Bulk actions + automation                                           */
/* ------------------------------------------------------------------ */

export async function bulkChangeStage(ids: string[], stage: string, reason?: string): Promise<number> {
  if (!ids.length) throw new Error("Select at least one applicant");
  const { error } = await supabase.from("applications").update({ stage } as never).in("id", ids);
  if (error) throw error;
  await logAudit({
    action: "bulk_stage_change",
    entity_type: "application",
    new_value: { stage, count: ids.length, ids },
    reason,
  });
  return ids.length;
}

/** Runs (or safely retries) the post-submission automation workflow. */
export async function runApplicationAutomation(
  applicationId: string,
  retryFailed = false,
): Promise<Record<string, string>> {
  const { data, error } = await supabase.functions.invoke("recruitment-automation", {
    body: { application_id: applicationId, retry_failed: retryFailed },
  });
  if (error) throw error;
  return (data?.results ?? {}) as Record<string, string>;
}

export interface AutomationRun {
  id: string;
  application_id: string | null;
  workflow: string;
  channel: string;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export async function listAutomationRuns(applicationId: string): Promise<AutomationRun[]> {
  const { data, error } = await supabase
    .from("automation_runs")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as unknown as AutomationRun[];
}

/* ------------------------------------------------------------------ */
/* Extended analytics                                                  */
/* ------------------------------------------------------------------ */

export interface OpsStats {
  interviews_total: number;
  interviews_by_status: Record<string, number>;
  interview_pass_rate: number;
  avg_time_to_offer_days: number;
  avg_hiring_days: number;
  automation_by_status: Record<string, number>;
  automation_failures: { workflow: string; error: string | null; attempts: number; at: string }[];
  documents_by_status: Record<string, number>;
  recruiter_productivity: { recruiter: string; assigned: number; advanced: number; actions: number }[];
  tasks_open: number;
  tasks_overdue: number;
}

export async function getOpsStats(): Promise<OpsStats> {
  const { data, error } = await supabase.rpc("recruitment_ops_stats" as never);
  if (error) throw error;
  return data as unknown as OpsStats;
}
