import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, BriefcaseBusiness, CheckCircle2,
  ClipboardList, DollarSign, Factory, Leaf, PawPrint, RefreshCw, ShieldCheck,
  Sprout, Users, Waves, CalendarDays
} from "lucide-react";

type Metric = { label: string; value: number | string; detail: string; icon: React.ElementType };
type Gap = { id: string; priority: string; position_id: string | null; gap_quantity: number | null; reason: string | null; status: string };
type Action = { id: string; title: string; priority: string; status: string; action_type: string; due_at: string | null };
type Placement = { id: string; position: string; fee_base: number | null; fee_amount: number | null; payment_status: string; placement_date: string | null };
type Candidate = { id: string; full_name: string; recommendation_status: string; verification_status: string; interview_status: string; notes: string | null; updated_at: string };

const units = [
  { key: "cattle", label: "Cattle", icon: PawPrint },
  { key: "goat", label: "Goat", icon: PawPrint },
  { key: "pig", label: "Pig", icon: PawPrint },
  { key: "palm", label: "Palm", icon: Sprout },
  { key: "general", label: "General Farm Operations", icon: Factory },
  { key: "management", label: "Management / Administration", icon: ClipboardList },
  { key: "maintenance", label: "Maintenance / Support", icon: Activity },
];

export default function FarmCommandCenter() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({ workers: 0, gaps: 0, reports: 0, requisitions: 0, placements: 0, actions: 0, exceptions: 0 });
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [reportToday, setReportToday] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [commercial, setCommercial] = useState({ awaiting: 0, approved: 0, active: 0 });

  async function load() {
    setRefreshing(true);
    const today = new Date().toISOString().slice(0, 10);
    const [workers, gapsQ, reports, reqs, placementsQ, actionsQ, exceptions, todayQ, candidatesQ, commercialQ] = await Promise.all([
      supabase.from("farm_workers").select("id", { count: "exact", head: true }),
      supabase.from("farm_workforce_gaps").select("id,priority,position_id,gap_quantity,reason,status").eq("status", "open").order("created_at", { ascending: false }).limit(8),
      supabase.from("farm_daily_reports").select("id", { count: "exact", head: true }),
      supabase.from("farm_requisitions").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("farm_placements").select("id,position,fee_base,fee_amount,payment_status,placement_date").order("created_at", { ascending: false }).limit(8),
      supabase.from("farm_action_queue").select("id,title,priority,status,action_type,due_at").neq("status", "completed").order("created_at", { ascending: false }).limit(8),
      supabase.from("farm_exceptions").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("farm_daily_reports").select("id", { count: "exact", head: true }).eq("report_date", today),
      supabase.from("farm_candidates").select("id,full_name,recommendation_status,verification_status,interview_status,notes,updated_at").order("updated_at", { ascending: false }).limit(100),
      supabase.from("farm_commercial_authorizations").select("status"),
    ]);
    setCounts({
      workers: workers.count ?? 0,
      gaps: gapsQ.data?.length ?? 0,
      reports: reports.count ?? 0,
      requisitions: reqs.count ?? 0,
      placements: placementsQ.data?.length ?? 0,
      actions: actionsQ.data?.length ?? 0,
      exceptions: exceptions.count ?? 0,
    });
    setGaps((gapsQ.data ?? []) as Gap[]);
    setPlacements((placementsQ.data ?? []) as Placement[]);
    setActions((actionsQ.data ?? []) as Action[]);
    setReportToday(todayQ.count ?? 0);
    setCandidates((candidatesQ.data ?? []) as Candidate[]);
    const commercialRows = commercialQ.data ?? [];
    setCommercial({ awaiting: commercialRows.filter((r:any) => r.status === "awaiting_cy_approval").length, approved: commercialRows.filter((r:any) => ["cy_approved","candidate_acceptance","contract_executed","active","payment_output_tracking"].includes(r.status)).length, active: commercialRows.filter((r:any) => ["active","payment_output_tracking"].includes(r.status)).length });
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const channel = supabase.channel("farm-command-center-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "farm_workforce_gaps" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "farm_daily_reports" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "farm_requisitions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "farm_placements" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "farm_action_queue" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "farm_candidates" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const feeTotal = useMemo(() => placements.reduce((s, p) => s + Number(p.fee_amount ?? 0), 0), [placements]);
  const critical = gaps.filter(g => g.priority === "critical").length;
  const candidateState = (notes: string | null) => {
    const n = notes || "";
    if (n.includes("CORE SHORTLIST")) return "core";
    if (n.includes("RESERVE SHORTLIST")) return "reserve";
    if (n.includes("PHASE 2 RELOCATION POOL")) return "phase2";
    if (n.includes("ON HOLD")) return "hold";
    return "waiting";
  };
  const candidateSummary = useMemo(() => {
    const summary = { total: candidates.length, core: 0, reserve: 0, hold: 0, phase2: 0, verified: 0, interviewPending: 0, placed: 0 };
    for (const c of candidates) {
      const s = candidateState(c.notes);
      if (s === "core") summary.core++;
      if (s === "reserve") summary.reserve++;
      if (s === "hold") summary.hold++;
      if (s === "phase2") summary.phase2++;
      if (c.verification_status === "verified") summary.verified++;
      if (c.interview_status !== "completed") summary.interviewPending++;
    }
    return summary;
  }, [candidates]);

  const metrics: Metric[] = [
    { label: "Mapped workforce", value: counts.workers, detail: "Recorded workers only", icon: Users },
    { label: "Open workforce gaps", value: counts.gaps, detail: critical ? `${critical} critical` : "No critical gaps recorded", icon: AlertTriangle },
    { label: "Open requisitions", value: counts.requisitions, detail: "Client requests recorded", icon: BriefcaseBusiness },
    { label: "Daily reports", value: counts.reports, detail: `${reportToday} submitted today`, icon: ClipboardList },
    { label: "Placements", value: counts.placements, detail: "Recorded placements", icon: CheckCircle2 },
    { label: "Placement fees", value: feeTotal ? `₦${feeTotal.toLocaleString()}` : "Not calculated", detail: "9% of recorded fee base", icon: DollarSign },
    { label: "Open exceptions", value: counts.exceptions, detail: "Requires operational attention", icon: AlertTriangle },
    { label: "Action queue", value: counts.actions, detail: "Outstanding actions", icon: Activity },
    { label: "CY waiting list", value: candidateSummary.total, detail: `${candidateSummary.core} core shortlist • ${candidateSummary.phase2} Phase 2`, icon: Users },
    { label: "Commercial approval", value: commercial.awaiting, detail: commercial.awaiting ? "Awaiting CY approval" : "No pending approvals", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <SEO title="Farm Workforce & Productivity Command Center" path="/admin/farm-command-center" description="CEO and operations command center for farm workforce, productivity, recruitment and placement operations" noindex />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070707]/95 backdrop-blur-xl">
        <div className="container flex min-h-16 items-center justify-between gap-4">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-amber-400/30 bg-amber-400/10 flex items-center justify-center"><Factory className="h-5 w-5 text-amber-300" /></div>
            <div><div className="text-[10px] uppercase tracking-[0.28em] text-amber-300">ResoFlex Operations</div><div className="font-display text-sm font-bold tracking-wide">FARM COMMAND CENTER</div></div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[10px] uppercase tracking-widest text-white/40">{user?.email}</span>
            <Button variant="glass" size="sm" onClick={load} disabled={refreshing}><RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></Button>
            <Button variant="glass" size="sm" asChild><Link to="/admin">Admin</Link></Button>
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <section className="relative overflow-hidden rounded-[28px] border border-amber-300/20 bg-gradient-to-br from-amber-500/[0.12] via-white/[0.035] to-transparent p-6 md:p-10 shadow-2xl">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="relative grid lg:grid-cols-[1.5fr_.8fr] gap-8 items-end">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-amber-300"><ShieldCheck className="h-4 w-4" /> CEO / Operations Control</div>
              <h1 className="mt-3 max-w-3xl font-display text-3xl md:text-5xl font-bold leading-tight">Farm Workforce & Productivity Command Center</h1>
              <p className="mt-4 max-w-2xl text-sm md:text-base leading-7 text-white/60">One operating view for workforce mapping, operational gaps, daily productivity, targeted recruitment, placement economics and post-placement performance.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Data integrity</div>
              <div className="mt-2 flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Recorded facts only</div>
              <div className="mt-2 text-xs leading-5 text-white/45">Missing workforce, production and financial values remain unrecorded rather than being inferred.</div>
            </div>
          </div>
        </section>

        <nav className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            ["Workforce","/admin/farm-command-center/workforce",Users],
            ["Gaps","/admin/farm-command-center/gaps",AlertTriangle],
            ["Productivity","/admin/farm-command-center/productivity",BarChart3],
            ["Recruitment","/admin/farm-command-center/recruitment",BriefcaseBusiness],
            ["Placements","/admin/farm-command-center/placements",DollarSign],
            ["Performance","/admin/farm-command-center/performance",Activity],
            ["Reports","/admin/farm-command-center/reports",Waves],
            ["Actions","/admin/farm-command-center/actions",ClipboardList],
          ].map(([label, href, Icon]: any) => <Link key={href} to={href} className="group rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 hover:border-amber-300/30 hover:bg-amber-300/[0.04] transition"><Icon className="h-4 w-4 text-amber-300/80" /><div className="mt-2 text-[10px] uppercase tracking-widest text-white/60 group-hover:text-white">{label}</div></Link>)}
        </nav>

        <section className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m) => <MetricCard key={m.label} metric={m} />)}
        </section>

        <section className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[.035] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-amber-300">CY candidate command view • live database</div>
              <h2 className="mt-1 font-display text-2xl font-bold">22-Candidate Workforce Waiting Matrix</h2>
              <p className="mt-2 text-xs text-white/45">State is derived from the supplied post-mapping evaluation recorded in the candidate notes. Verification and interview fields remain independently visible.</p>
            </div>
            <Link to="/admin/farm-command-center/candidates" className="text-[10px] uppercase tracking-widest text-amber-300">Open candidate pipeline <ArrowRight className="inline h-3 w-3" /></Link>
          </div>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              ["Waiting list", candidateSummary.total, "All recorded"],
              ["Core shortlist", candidateSummary.core, "Final CY consideration"],
              ["Reserve", candidateSummary.reserve, "Conditional"],
              ["On hold", candidateSummary.hold, "Redundant / overlap"],
              ["Phase 2", candidateSummary.phase2, "Relocation standby"],
              ["Verified", candidateSummary.verified, "Primary verification"],
              ["Interview pending", candidateSummary.interviewPending, "CY decision stage"],
            ].map(([label,value,detail]) => <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="font-tactical text-2xl">{value}</div><div className="mt-1 text-[9px] uppercase tracking-widest text-white/55">{label}</div><div className="mt-1 text-[10px] text-white/30">{detail}</div></div>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/5 px-3 py-1 text-emerald-200">9 Core shortlist</span>
            <span className="rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-1 text-amber-200">1 Reserve</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-white/50">4 On hold</span>
            <span className="rounded-full border border-sky-300/20 bg-sky-300/5 px-3 py-1 text-sky-200">8 Phase 2</span>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[.035] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-[10px] uppercase tracking-widest text-amber-300">Commercial governance • CY approval gate</div><h2 className="mt-1 font-display text-xl font-bold">Compensation & Engagement Authorization</h2><p className="mt-2 text-xs text-white/45">Salary, contract, subcontract, output and milestone terms are recorded separately from candidate selection. No compensation is treated as CY-approved until the approval state is explicitly recorded.</p></div><Link to="/admin/farm-command-center/commercial" className="text-[10px] uppercase tracking-widest text-amber-300">Open approval register <ArrowRight className="inline h-3 w-3" /></Link></div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3"><StatusRow label="Awaiting CY approval" value={String(commercial.awaiting)} good={commercial.awaiting === 0} /><StatusRow label="Approved / executing" value={String(commercial.approved)} good={commercial.approved > 0} /><StatusRow label="Active payment/output tracking" value={String(commercial.active)} good={commercial.active > 0} /></div>
        </section>\n
        <section className="mt-8 grid lg:grid-cols-[1.35fr_.65fr] gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:p-6">
            <div className="flex items-center justify-between mb-5"><div><div className="text-[10px] uppercase tracking-widest text-amber-300">Operational units</div><h2 className="mt-1 font-display text-xl font-bold">CY Farm Coverage</h2></div><CalendarDays className="h-5 w-5 text-white/30" /></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {units.map(({key,label,icon:Icon}) => <Link key={key} to={`/admin/farm-command-center/productivity?unit=${key}`} className="rounded-2xl border border-white/10 p-4 hover:border-amber-300/30 transition"><Icon className="h-5 w-5 text-amber-300" /><div className="mt-8 font-semibold">{label}</div><div className="mt-1 text-[10px] uppercase tracking-widest text-white/35">Open unit view <ArrowRight className="inline h-3 w-3" /></div></Link>)}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-widest text-amber-300">Executive posture</div>
            <div className="mt-4 space-y-3">
              <StatusRow label="Workforce data" value={counts.workers ? "Recorded" : "Data required"} good={!!counts.workers} />
              <StatusRow label="Productivity reporting" value={counts.reports ? "Reporting active" : "Awaiting reports"} good={!!counts.reports} />
              <StatusRow label="Recruitment demand" value={counts.requisitions ? "Requests recorded" : "No requests recorded"} good={false} />
              <StatusRow label="Placement economics" value={feeTotal ? "Calculated" : "Not calculable"} good={!!feeTotal} />
              <StatusRow label="CY commercial authorization" value={commercial.awaiting ? `${commercial.awaiting} awaiting approval` : "No pending approvals"} good={!commercial.awaiting} />
            </div>
          </div>
        </section>

        <section className="mt-8 grid lg:grid-cols-2 gap-6">
          <DataPanel title="Priority workforce gaps" subtitle="Only recorded gaps appear here" href="/admin/farm-command-center/gaps">
            {loading ? <Skeleton /> : gaps.length ? gaps.map(g => <div key={g.id} className="flex items-center justify-between gap-4 border-b border-white/8 py-3 last:border-0"><div><div className="text-sm font-medium">{g.position_id ? "Recorded position" : "Position requirement pending"}</div><div className="text-xs text-white/40">{g.reason || "No reason recorded"}</div></div><span className={`rounded-full px-2 py-1 text-[9px] uppercase tracking-widest ${g.priority === "critical" ? "bg-red-400/15 text-red-300" : "bg-amber-300/10 text-amber-200"}`}>{g.priority}</span></div>) : <Empty title="No workforce gaps recorded" text="Enter verified requirements before treating a position as a gap." />}
          </DataPanel>
          <DataPanel title="Action queue" subtitle="CEO / operations follow-through" href="/admin/farm-command-center/actions">
            {loading ? <Skeleton /> : actions.length ? actions.map(a => <div key={a.id} className="flex items-center justify-between gap-4 border-b border-white/8 py-3 last:border-0"><div><div className="text-sm font-medium">{a.title}</div><div className="text-xs text-white/40">{a.action_type}</div></div><span className="text-[9px] uppercase tracking-widest text-white/45">{a.priority}</span></div>) : <Empty title="Action queue is clear" text="New verified exceptions and operational requests will appear here." />}
          </DataPanel>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
          <div className="p-5 md:p-6 border-b border-white/10 flex items-center justify-between"><div><div className="text-[10px] uppercase tracking-widest text-amber-300">Placement economics</div><h2 className="mt-1 font-display text-xl font-bold">9% Placement-Fee Ledger</h2></div><DollarSign className="h-5 w-5 text-white/30" /></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm"><thead><tr className="text-left text-[9px] uppercase tracking-widest text-white/35">{["Position","Fee base","9% fee","Payment","Date"].map(x=><th key={x} className="px-5 py-3">{x}</th>)}</tr></thead><tbody>
              {placements.length ? placements.map(p=><tr key={p.id} className="border-t border-white/8"><td className="px-5 py-3">{p.position}</td><td className="px-5 py-3">{p.fee_base == null ? "Not recorded" : `₦${Number(p.fee_base).toLocaleString()}`}</td><td className="px-5 py-3">{p.fee_amount == null ? "Not calculable" : `₦${Number(p.fee_amount).toLocaleString()}`}</td><td className="px-5 py-3 text-white/55">{p.payment_status}</td><td className="px-5 py-3 text-white/45">{p.placement_date || "—"}</td></tr>) : <tr><td colSpan={5} className="px-5 py-12 text-center text-white/35">No placement records yet.</td></tr>}
            </tbody></table>
          </div>
        </section>

        <footer className="mt-10 flex flex-col md:flex-row gap-3 md:items-center md:justify-between border-t border-white/10 pt-5 text-[10px] uppercase tracking-widest text-white/30">
          <span>ResoFlex™ powered by Resonance Fitness</span><span>Live Supabase data • RLS protected • Realtime enabled • Commercial approval gated</span>
        </footer>
      </main>
    </div>
  );
}

function MetricCard({metric:m}:{metric:Metric}) {
  const Icon=m.icon;
  return <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-amber-300/80" /><span className="h-1.5 w-1.5 rounded-full bg-amber-300/70" /></div><div className="mt-5 font-tactical text-2xl">{m.value}</div><div className="mt-1 text-[10px] uppercase tracking-widest text-white/55">{m.label}</div><div className="mt-2 text-xs text-white/30">{m.detail}</div></div>;
}
function StatusRow({label,value,good}:{label:string;value:string;good:boolean}) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.025] px-3 py-3"><span className="text-xs text-white/50">{label}</span><span className={good ? "text-xs text-emerald-300" : "text-xs text-amber-200"}>{value}</span></div>; }
function DataPanel({title,subtitle,href,children}:{title:string;subtitle:string;href:string;children:React.ReactNode}) { return <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:p-6"><div className="flex items-start justify-between gap-4 mb-4"><div><div className="text-[10px] uppercase tracking-widest text-amber-300">{subtitle}</div><h2 className="mt-1 font-display text-xl font-bold">{title}</h2></div><Link to={href} className="text-[9px] uppercase tracking-widest text-amber-300 hover:text-white">Open <ArrowRight className="inline h-3 w-3" /></Link></div>{children}</div>; }
function Empty({title,text}:{title:string;text:string}) { return <div className="rounded-xl border border-dashed border-white/10 p-8 text-center"><div className="text-sm text-white/65">{title}</div><div className="mt-2 text-xs text-white/35">{text}</div></div>; }
function Skeleton(){return <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>;}
