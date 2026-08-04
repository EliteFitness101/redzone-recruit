// Recruitment Operations Layer — typed API for applications, pipeline,
// activity, interviews, recruiters and notifications.
import { supabase } from "@/integrations/supabase/client";

export const STAGES = [
  "new",
  "contacted",
  "qualified",
  "interview_scheduled",
  "interview_completed",
  "accepted",
  "enrolled",
  "certified",
  "deployed",
  "archived",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  accepted: "Accepted",
  enrolled: "Enrolled",
  certified: "Certified",
  deployed: "Deployed",
  archived: "Archived",
};

export const PROGRAMS = [
  "Security Operative Foundation",
  "Combat Fitness & Conditioning",
  "Tactical Response",
  "Close Protection",
  "Ethics & Compliance",
  "Supervisor Track",
] as const;

export interface Application {
  id: string;
  reference_number: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  location: string;
  age: number;
  education: string;
  fitness_level: string;
  prior_experience: string | null;
  program: string | null;
  cohort: string | null;
  stage: string;
  status: string;
  source: string | null;
  campaign: string | null;
  assigned_recruiter: string | null;
  attribution: Record<string, unknown> | null;
  tags: string[] | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  application_id: string;
  event: string;
  actor: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  interviewer: string | null;
  scheduled_at: string;
  meeting_link: string | null;
  outcome: string;
  score: number | null;
  notes: string | null;
  created_at: string;
}

export interface Recruiter {
  id: string;
  user_id: string;
  display_name: string;
  title: string;
  active: boolean;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ApplicationFilters {
  search?: string;
  stage?: string;
  program?: string;
  cohort?: string;
  source?: string;
  campaign?: string;
  recruiter?: string;
  from?: string;
  to?: string;
}

export interface ListResult<T> {
  rows: T[];
  count: number;
}

export interface RecruitmentStats {
  total: number;
  today: number;
  week: number;
  by_stage: Record<string, number>;
  by_program: Record<string, number>;
  by_cohort: Record<string, number>;
  by_source: Record<string, number>;
  by_campaign: Record<string, number>;
  by_recruiter: Record<string, number>;
  daily: { date: string; count: number }[];
  stage_aging: Record<string, number>;
}

const ALL = "all";

function applyFilters(query: any, f: ApplicationFilters) {
  if (f.search?.trim()) {
    const s = f.search.trim().replace(/[,%]/g, " ");
    query = query.or(
      [
        `full_name.ilike.%${s}%`,
        `email.ilike.%${s}%`,
        `phone.ilike.%${s}%`,
        `reference_number.ilike.%${s}%`,
        `location.ilike.%${s}%`,
      ].join(","),
    );
  }
  if (f.stage && f.stage !== ALL) query = query.eq("stage", f.stage);
  if (f.program && f.program !== ALL) query = query.eq("program", f.program);
  if (f.cohort && f.cohort !== ALL) query = query.eq("cohort", f.cohort);
  if (f.source && f.source !== ALL) query = query.eq("source", f.source);
  if (f.campaign && f.campaign !== ALL) query = query.eq("campaign", f.campaign);
  if (f.recruiter && f.recruiter !== ALL) {
    query =
      f.recruiter === "unassigned"
        ? query.is("assigned_recruiter", null)
        : query.eq("assigned_recruiter", f.recruiter);
  }
  if (f.from) query = query.gte("created_at", new Date(f.from).toISOString());
  if (f.to) {
    const end = new Date(f.to);
    end.setHours(23, 59, 59, 999);
    query = query.lte("created_at", end.toISOString());
  }
  return query;
}

/** List applications with filters + pagination. */
export async function listApplications(
  filters: ApplicationFilters,
  page = 1,
  pageSize = 25,
): Promise<ListResult<Application>> {
  let query = supabase
    .from("applications")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  query = applyFilters(query, filters);
  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as Application[], count: count ?? 0 };
}

/** Fetch every matching application (used by the pipeline board and CSV export). */
export async function listAllApplications(
  filters: ApplicationFilters,
  limit = 1000,
): Promise<Application[]> {
  let query = supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  query = applyFilters(query, filters);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Application[];
}

export async function updateApplication(
  id: string,
  patch: Partial<
    Pick<
      Application,
      "stage" | "status" | "program" | "cohort" | "assigned_recruiter" | "tags" | "notes" | "source" | "campaign"
    >
  >,
): Promise<void> {
  const { error } = await supabase.from("applications").update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function changeStage(id: string, stage: Stage, note?: string): Promise<void> {
  await updateApplication(id, { stage });
  if (note?.trim()) await addNote(id, note.trim(), "stage_note");
}

export async function addNote(
  applicationId: string,
  notes: string,
  event = "note_added",
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("application_activity").insert({
    application_id: applicationId,
    event,
    actor: auth.user?.id ?? null,
    notes,
    metadata: metadata as never,
  });
  if (error) throw error;
}

export async function listActivity(applicationId: string): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from("application_activity")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ActivityEvent[];
}

export async function listInterviews(applicationId: string): Promise<Interview[]> {
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("application_id", applicationId)
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Interview[];
}

export async function scheduleInterview(input: {
  application_id: string;
  scheduled_at: string;
  meeting_link?: string;
  notes?: string;
}): Promise<void> {
  if (!input.scheduled_at) throw new Error("Pick an interview date and time");
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("interviews").insert({
    application_id: input.application_id,
    scheduled_at: new Date(input.scheduled_at).toISOString(),
    meeting_link: input.meeting_link?.trim() || null,
    notes: input.notes?.trim() || null,
    interviewer: auth.user?.id ?? null,
  });
  if (error) throw error;
  await updateApplication(input.application_id, { stage: "interview_scheduled" });
}

export async function listRecruiters(): Promise<Recruiter[]> {
  const { data, error } = await supabase
    .from("recruiters")
    .select("*")
    .order("display_name", { ascending: true });
  if (error) return [];
  return (data ?? []) as unknown as Recruiter[];
}

export async function getStats(): Promise<RecruitmentStats> {
  const { data, error } = await supabase.rpc("recruitment_stats");
  if (error) throw error;
  return data as unknown as RecruitmentStats;
}

export async function listNotifications(limit = 30): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as unknown as AppNotification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

const CSV_COLUMNS: (keyof Application)[] = [
  "reference_number",
  "full_name",
  "email",
  "phone",
  "location",
  "age",
  "program",
  "cohort",
  "stage",
  "status",
  "source",
  "campaign",
  "assigned_recruiter",
  "created_at",
];

export function toCsv(rows: Application[]): string {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = CSV_COLUMNS.join(",");
  const body = rows.map((r) => CSV_COLUMNS.map((c) => esc(r[c])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadCsv(rows: Application[], filename = "applications.csv"): void {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parses the legacy JSON blob stored in applications.notes by the landing form. */
export function parseLegacyNotes(notes: string | null): Record<string, unknown> | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    return typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
