import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import {
  ClipboardCheck,
  FileSearch,
  Filter,
  GitBranch,
  MapPinned,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  Target,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ApplicantDrawer } from "@/components/admin/ApplicantDrawer";
import {
  listAllApplications,
  listRecruiters,
  type Application,
  type Recruiter,
  type Stage,
} from "@/lib/recruitment";
import { supabase } from "@/integrations/supabase/client";

const CAMPAIGN = "CY-NWANKWO-FARM-OPERATIONS";
const MANDATE = [
  { label: "Graduate Veterinary Officer", qty: 1 },
  { label: "Graduate Animal Husbandry / Livestock Production Officer", qty: 1 },
  { label: "Graduate Farm Management / Agricultural Management Officer", qty: 1 },
  { label: "Farm Assistant / Labourer", qty: 4 },
] as const;

const PIPELINE = [
  ["CY Objectives", Target],
  ["Workforce Mapping", Users],
  ["Operational Gap Analysis", FileSearch],
  ["Priority Roles", ClipboardCheck],
  ["Targeted Sourcing", Sprout],
  ["Screen", Search],
  ["Verify", ShieldCheck],
  ["Shortlist", UserCheck],
  ["CY Interview", Users],
  ["Select", ClipboardCheck],
  ["Place", MapPinned],
  ["Measure", Target],
  ["Report", GitBranch],
] as const;

const stageLabel: Record<string, string> = {
  new: "Intake",
  contacted: "Screening",
  qualified: "Shortlisted",
  interview_scheduled: "CY Interview",
  interview_completed: "Interview Complete",
  accepted: "Selected",
  enrolled: "Selected / Onboarding",
  certified: "Verified / Ready",
  deployed: "Placed",
  archived: "Archived",
};

type VerificationRow = {
  application_id: string;
  verification_type: string;
  provider: string;
  status: string;
  match_result: string | null;
};

export default function CYRecruitmentMatrix() {
  const [rows, setRows] = useState<Application[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [verifications, setVerifications] = useState<VerificationRow[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [tab, setTab] = useState("executive");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apps, recs] = await Promise.all([
        listAllApplications({ campaign: CAMPAIGN }),
        listRecruiters(),
      ]);
      setRows(apps);
      setRecruiters(recs);

      if (apps.length) {
        const ids = apps.map((a) => a.id);
        const { data, error } = await supabase
          .from("candidate_verifications")
          .select("application_id,verification_type,provider,status,match_result")
          .in("application_id", ids)
          .order("created_at", { ascending: false });
        if (!error) setVerifications((data ?? []) as VerificationRow[]);
      } else {
        setVerifications([]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load CY recruitment data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email, r.phone, r.location, r.program, r.reference_number]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const byStage = useMemo(() => {
    const result: Record<string, number> = {};
    for (const row of rows) result[row.stage] = (result[row.stage] ?? 0) + 1;
    return result;
  }, [rows]);

  const verifiedIds = useMemo(
    () =>
      new Set(
        verifications
          .filter((v) => v.status === "verified")
          .map((v) => v.application_id),
      ),
    [verifications],
  );

  const recruiterName = (id: string | null) =>
    (id && recruiters.find((r) => r.user_id === id)?.display_name) || "Unassigned";

  const positionCount = (label: string) => rows.filter((r) => r.program === label).length;
  const placed = rows.filter((r) => r.stage === "deployed").length;
  const selectedCount = rows.filter((r) => ["accepted", "enrolled", "certified", "deployed"].includes(r.stage)).length;
  const interviewCount = rows.filter((r) => ["interview_scheduled", "interview_completed"].includes(r.stage)).length;
  const screened = rows.filter((r) => ["contacted", "qualified", "interview_scheduled", "interview_completed", "accepted", "enrolled", "certified", "deployed"].includes(r.stage)).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="CY Farm Recruitment Matrix" path="/admin/cy-recruitment" description="CY Nwankwo farm workforce and recruitment command center" noindex />
      <main className="pt-10 pb-24 container max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-gold">CY Nwankwo · Ahiaba Ubi Farm</div>
            <h1 className="font-display text-3xl md:text-5xl font-bold mt-1">Recruitment Matrix</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
              Workforce → gap → candidate → verification → CY decision → placement → performance.
              Only records returned by the existing recruitment system are displayed.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="glass" size="sm" onClick={load} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} /> Refresh</Button>
            <Button variant="glass" size="sm" asChild><Link to="/admin/applications">Full Applicant Console</Link></Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
              <Metric label="Mandate" value="7" />
              <Metric label="Applications" value={rows.length} />
              <Metric label="Screened" value={screened} />
              <Metric label="Verified" value={verifiedIds.size} />
              <Metric label="Interview" value={interviewCount} />
              <Metric label="Selected" value={selectedCount} />
              <Metric label="Placed" value={placed} />
              <Metric label="Fee Rate" value="9%" />
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="glass mb-6 flex-wrap h-auto">
                <TabsTrigger value="executive">Executive</TabsTrigger>
                <TabsTrigger value="matrix">Recruitment Matrix</TabsTrigger>
                <TabsTrigger value="workforce">Workforce Mapping</TabsTrigger>
                <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
                <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              </TabsList>

              <TabsContent value="executive" className="space-y-6">
                <section className="glass-strong rounded-3xl p-5 md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.22em] text-gold">CEO / Client Executive Summary</div>
                      <h2 className="font-display text-2xl md:text-3xl font-bold mt-1">CY Farm Mandate</h2>
                    </div>
                    <Badge variant="outline" className="text-gold border-gold/40">LIVE DATA</Badge>
                  </div>
                  <div className="mt-6 grid md:grid-cols-3 gap-3">
                    <SummaryCard title="Objective" text="Establish the workforce structure required to improve accountability and measurable farm output." />
                    <SummaryCard title="Current recruitment" text={rows.length ? `${rows.length} farm application record(s) in the CY campaign.` : "No CY candidate records currently returned."} />
                    <SummaryCard title="Placement economics" text="Placement fee = 9% × recorded annual agreed salary. No fee amount is calculated until the salary basis is recorded." />
                  </div>
                </section>

                <section className="glass rounded-3xl p-5 md:p-7">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Management Alignment</div>
                  <h2 className="font-display text-xl font-bold mt-1">Decision points for CY</h2>
                  <div className="mt-5 grid md:grid-cols-2 gap-3">
                    {[
                      "1. Single most important operational result for the next 3–6 months.",
                      "2. Actual workforce headcount by Cattle · Goat · Pig · Palm · General.",
                      "3. Existing supervisors, reporting lines and accountability.",
                      "4. Current operational pain points affecting output.",
                      "5. Confirm the seven-position mandate and priority order.",
                      "6. Define role → responsibility → daily/weekly output → report → measure.",
                      "7. Map and measure existing workers before retention/reassignment/retraining/redundancy decisions.",
                      "8. Confirm qualification, experience, salary, location, accommodation, availability, hours, farm conditions and reporting expectations.",
                    ].map((x) => <div key={x} className="glass rounded-2xl p-4 text-sm">{x}</div>)}
                  </div>
                </section>

                <section className="glass rounded-3xl p-5 md:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.22em] text-gold">CY Farm Mandate</div>
                      <h2 className="font-display text-xl font-bold mt-1">Seven positions</h2>
                    </div>
                    <WalletCards className="text-gold" />
                  </div>
                  <div className="mt-5 grid md:grid-cols-4 gap-3">
                    {MANDATE.map((m) => (
                      <div key={m.label} className="glass rounded-2xl p-4">
                        <div className="text-2xl font-tactical text-gradient-gold">{m.qty}</div>
                        <div className="text-xs font-semibold mt-1">{m.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-2">{positionCount(m.label)} application(s)</div>
                      </div>
                    ))}
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="matrix">
                <section className="glass-strong rounded-3xl overflow-hidden">
                  <div className="p-4 md:p-5 border-b border-border/40 flex flex-wrap gap-3 items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-gold">CY Farm Workforce & Recruitment Matrix</div>
                      <p className="text-sm text-muted-foreground mt-1">Position → Candidate → Qualification → Experience → Location → Availability → Screening → Verification → Interview → Client Decision → Placement</p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidate / position / location" className="md:w-72" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <caption className="sr-only">CY farm recruitment matrix</caption>
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                          {["Position", "Candidate", "Qualification", "Experience", "Location", "Screening", "Verification", "Interview", "Client Decision", "Placement"].map((h) => <th key={h} scope="col" className="px-4 py-3 whitespace-nowrap">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr><td colSpan={10} className="py-14 text-center text-muted-foreground">No CY candidates returned from the recruitment database.</td></tr>
                        ) : filtered.map((r) => {
                          const verification = verifications.find((v) => v.application_id === r.id && v.status === "verified");
                          const interview = ["interview_scheduled", "interview_completed"].includes(r.stage);
                          const decision = ["accepted", "enrolled", "certified", "deployed"].includes(r.stage);
                          return (
                            <tr key={r.id} onClick={() => setSelected(r)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelected(r)} className="border-t border-border/40 hover:bg-secondary/30 cursor-pointer focus:outline-none focus:bg-secondary/30">
                              <td className="px-4 py-3 min-w-64"><div className="font-medium">{r.program || "Not assigned"}</div><div className="text-[10px] text-muted-foreground">{r.reference_number || r.id.slice(0, 8)}</div></td>
                              <td className="px-4 py-3 whitespace-nowrap"><div className="font-medium">{r.full_name}</div><div className="text-xs text-muted-foreground">{r.phone}</div></td>
                              <td className="px-4 py-3">{r.education || "Not recorded"}</td>
                              <td className="px-4 py-3 max-w-64">{r.prior_experience || "Not recorded"}</td>
                              <td className="px-4 py-3">{r.location || "Not recorded"}</td>
                              <td className="px-4 py-3"><Status value={stageLabel[r.stage] || r.stage} /></td>
                              <td className="px-4 py-3"><Status value={verification ? "Verified" : "Not recorded"} /></td>
                              <td className="px-4 py-3"><Status value={interview ? stageLabel[r.stage] : "Pending"} /></td>
                              <td className="px-4 py-3"><Status value={decision ? (r.stage === "deployed" ? "Placed" : "Selected") : "Pending"} /></td>
                              <td className="px-4 py-3"><Status value={r.stage === "deployed" ? "Placed" : "Pending"} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="workforce" className="space-y-4">
                <section className="glass rounded-3xl p-5 md:p-7">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Workforce Mapping</div>
                  <h2 className="font-display text-xl font-bold mt-1">Who → does what → where → reports to whom → produces what → measured how</h2>
                  <p className="text-sm text-muted-foreground mt-2">Existing worker records are intentionally not invented. Populate this module from CY's confirmed workforce register.</p>
                  <div className="mt-5 grid md:grid-cols-5 gap-3">
                    {["Cattle", "Goat", "Pig", "Palm", "General"].map((unit) => <div key={unit} className="glass-strong rounded-2xl p-5"><Sprout className="h-5 w-5 text-gold" /><div className="font-display font-semibold mt-3">{unit}</div><div className="text-xs text-muted-foreground mt-1">Headcount: Not recorded</div><div className="text-xs text-muted-foreground">Supervisor: Not recorded</div><div className="text-xs text-muted-foreground">Output: Not recorded</div></div>)}
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="gaps" className="space-y-4">
                <section className="glass rounded-3xl p-5 md:p-7">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Operational Gap Analysis</div>
                  <h2 className="font-display text-xl font-bold mt-1">Capacity → Gap → Priority → Recruitment Need</h2>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">{["Unit","Required Function","Current Capacity","Gap","Priority","Recruitment Need"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
                      <tbody>{["Cattle","Goat","Pig","Palm","General"].map((unit) => <tr key={unit} className="border-t border-border/40"><td className="px-4 py-3 font-medium">{unit}</td><td className="px-4 py-3">Not yet defined</td><td className="px-4 py-3">Not recorded</td><td className="px-4 py-3">Not assessed</td><td className="px-4 py-3">Pending CY confirmation</td><td className="px-4 py-3">Pending gap analysis</td></tr>)}</tbody>
                    </table>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="pipeline" className="space-y-4">
                <section className="glass-strong rounded-3xl p-5 md:p-7">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-gold">End-to-End Recruitment Pipeline</div>
                  <h2 className="font-display text-xl font-bold mt-1">CY Objectives → Report</h2>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {PIPELINE.map(([label, Icon], i) => (
                      <div key={label} className="flex items-center gap-2">
                        <button type="button" onClick={() => setTab(label === "CY Objectives" ? "executive" : label === "Workforce Mapping" ? "workforce" : label === "Operational Gap Analysis" ? "gaps" : label === "Report" ? "matrix" : "matrix")} className="glass rounded-xl px-3 py-3 text-left hover:border-gold/40 transition-colors">
                          <Icon className="h-4 w-4 text-gold" />
                          <div className="text-[10px] uppercase tracking-wider mt-2 whitespace-nowrap">{label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{pipelineCount(label, { rows, screened, verified: verifiedIds.size, interviewCount, selectedCount, placed })}</div>
                        </button>
                        {i < PIPELINE.length - 1 && <span className="text-muted-foreground hidden lg:inline">→</span>}
                      </div>
                    ))}
                  </div>
                </section>
                <section className="grid md:grid-cols-4 gap-3">
                  <Metric label="New / Intake" value={byStage.new ?? 0} />
                  <Metric label="Screening" value={(byStage.contacted ?? 0) + (byStage.qualified ?? 0)} />
                  <Metric label="Interview" value={interviewCount} />
                  <Metric label="Placed" value={placed} />
                </section>
              </TabsContent>
            </Tabs>
          </>
        )}

        <ApplicantDrawer
          application={selected}
          recruiters={recruiters}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      </main>
    </div>
  );
}

function pipelineCount(label: string, x: { rows: Application[]; screened: number; verified: number; interviewCount: number; selectedCount: number; placed: number }) {
  if (label === "CY Objectives") return "Decision";
  if (label === "Workforce Mapping") return "5 units";
  if (label === "Operational Gap Analysis") return "5 units";
  if (label === "Priority Roles") return "7 slots";
  if (label === "Targeted Sourcing" || label === "Screen") return String(label === "Screen" ? x.screened : x.rows.length);
  if (label === "Verify") return String(x.verified);
  if (label === "Shortlist") return String(x.rows.filter((r) => ["qualified", "interview_scheduled", "interview_completed", "accepted", "enrolled", "certified", "deployed"].includes(r.stage)).length);
  if (label === "CY Interview") return String(x.interviewCount);
  if (label === "Select") return String(x.selectedCount);
  if (label === "Place") return String(x.placed);
  if (label === "Measure") return x.placed ? "Active" : "Pending";
  return "Live";
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="glass rounded-2xl p-4"><div className="font-tactical text-2xl text-gradient-gold">{value}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div></div>;
}

function Status({ value }: { value: string }) {
  return <Badge variant={value === "Verified" || value === "Placed" || value === "Selected" ? "default" : "secondary"} className="text-[10px] uppercase whitespace-nowrap">{value}</Badge>;
}

function SummaryCard({ title, text }: { title: string; text: string }) {
  return <div className="glass rounded-2xl p-4"><div className="text-[10px] uppercase tracking-widest text-gold">{title}</div><p className="text-sm mt-2 text-muted-foreground">{text}</p></div>;
}
