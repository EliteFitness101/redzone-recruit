import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Factory, RefreshCw, ShieldCheck, Sparkles, Users } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type Model = {
  id: string; model_key: string; title: string; category: string; activation_status: string;
  description: string; worker_relationship: string | null; client_relationship: string | null;
  regulator: string | null; license_requirement: string | null; pricing_rule: string | null;
};
type Match = Model & { match_score: number; matched: boolean; reasons: string[]; alerts: { severity: string; message: string; blocking: boolean }[] };

const contextFields = [
  ["service_type","Primary service type (e.g. recruitment_placement)"],
  ["worker_supply","Workers supplied to a third party"],
  ["employer_of_record","ResoFlex/EOR becomes formal employer"],
  ["factory","Factory/site workforce"],
  ["security_guarding","Manned guarding/security personnel"],
  ["event","Event management/operations"],
  ["access_control","Physical or digital access-control system"],
  ["drone","Commercial drone/RPAS operation"],
  ["training","Training or certification required"],
  ["deployment","Deployment/site assignment required"],
];

const boolKeys = new Set(contextFields.slice(1).map(([k]) => k));

export default function WorkforceModels() {
  const { user } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [context, setContext] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [engagementName, setEngagementName] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("resofit_service_models")
      .select("id,model_key,title,category,activation_status,description,worker_relationship,client_relationship,regulator,license_requirement,pricing_rule")
      .order("category").order("title");
    if (error) toast.error(error.message);
    setModels((data ?? []) as Model[]);
    setLoading(false);
  }

  async function match() {
    setMatching(true);
    const { data, error } = await supabase.rpc("resofit_match_service_models", { p_context: context });
    if (error) toast.error(error.message);
    setMatches((data ?? []) as Match[]);
    setMatching(false);
  }

  async function createEngagement(model: Match) {
    const { data: auth } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("resofit_engagements").insert({
      model_id: model.id,
      model_key: model.model_key,
      status: "intake",
      worker_relationship: model.worker_relationship,
      employer_entity: model.model_key === "recruitment_placement" ? "client" : null,
      payer_entity: model.model_key === "recruitment_placement" ? "client" : null,
      service_scope: engagementName || model.title,
      context_snapshot: context,
      model_match_reason: model.reasons,
      scope_alerts: model.alerts,
      compliance_status: model.activation_status === "production_ready" ? "review_required" : model.activation_status,
      ceo_status: "pending",
      created_by: auth.user?.id,
    });
    if (error) return toast.error(error.message);
    if (data?.[0]?.id) {
      const gates = ["client_mandate","identity_verification","qualification_reference_verification","internal_screening","client_selection","salary_or_commercial_approval","scope_and_licence_review","contract_execution","deployment_activation"];
      await supabase.from("resofit_ceo_approvals").insert(gates.map(gate_key => ({ engagement_id: data[0].id, gate_key, status: "pending", required: true })));
    }
    toast.success("Engagement created in CEO approval queue");
  }

  useEffect(() => { load(); }, []);
  const ready = useMemo(() => matches.filter(m => m.matched), [matches]);

  return <div className="min-h-screen bg-[#070707] text-white">
    <SEO title="Workforce & Service Model Control Center" path="/admin/workforce-models" description="Dynamic recruitment, workforce, security, access, drone, training and deployment model selector" noindex />
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070707]/95 backdrop-blur-xl">
      <div className="container flex min-h-16 items-center justify-between gap-4">
        <Link to="/admin" className="flex items-center gap-2 text-white/70 hover:text-white"><ShieldCheck className="h-5 w-5 text-amber-300" /> Admin</Link>
        <Button variant="glass" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>
    </header>
    <main className="container py-8 md:py-12">
      <section className="rounded-[28px] border border-amber-300/20 bg-amber-300/[.04] p-6 md:p-9">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.28em] text-amber-300"><Sparkles className="h-4 w-4" /> CEO scope intelligence</div>
        <h1 className="mt-3 font-display text-3xl md:text-5xl font-bold">Workforce & Service Model Control Center</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">One rules-driven model registry for applications, training, certification, recruitment, placement, deployment, factory workforce, security, events, access control, digital access control, RPAS and future EOR/worker-supply structures. The engine recommends scope; CEO approval and applicable licences remain explicit gates.</p>
      </section>

      <section className="mt-6 grid lg:grid-cols-[.9fr_1.1fr] gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
          <div className="text-[10px] uppercase tracking-widest text-amber-300">1 • Describe engagement</div>
          <div className="mt-4">
            <Label className="text-[10px] uppercase tracking-widest text-white/45">Engagement label</Label>
            <Input value={engagementName} onChange={e => setEngagementName(e.target.value)} className="mt-1.5 bg-black/30 border-white/10" placeholder="e.g. CY Farm Recruitment / Factory Security" />
          </div>
          <div className="mt-4 grid gap-3">
            {contextFields.map(([key,label]) => <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <div><div className="text-sm">{label}</div><div className="text-[10px] text-white/30">{key}</div></div>
              {boolKeys.has(key) ? <button type="button" aria-pressed={!!context[key]} onClick={() => setContext(c => ({...c,[key]:!c[key]}))} className={`rounded-full px-3 py-1 text-[9px] uppercase tracking-widest border ${context[key] ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-white/35"}`}>{context[key] ? "Yes" : "No"}</button> : <Input value={context[key] ?? ""} onChange={e => setContext(c => ({...c,[key]:e.target.value}))} className="w-48 bg-black/30 border-white/10" placeholder="not recorded" />}
            </div>)}
          </div>
          <Button variant="gold" className="mt-5 w-full" onClick={match} disabled={matching}>{matching ? "Matching…" : "Auto-select applicable models"}</Button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
          <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] uppercase tracking-widest text-amber-300">2 • Engine result</div><h2 className="mt-1 font-display text-2xl font-bold">Applicable models</h2></div><div className="text-xs text-white/35">{ready.length} matched</div></div>
          {!matches.length ? <div className="mt-8 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">Enter engagement facts and run the selector. No model is silently assumed.</div> :
            <div className="mt-5 space-y-3">{matches.filter(m => m.matched).map(m => <div key={m.model_key} className="rounded-2xl border border-amber-300/20 bg-amber-300/[.035] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[9px] uppercase tracking-widest text-amber-300">{m.category} • {m.activation_status}</div><div className="mt-1 font-semibold">{m.title}</div></div><div className="text-[9px] uppercase tracking-widest text-white/35">Score {m.match_score}</div></div>
              <p className="mt-2 text-xs leading-5 text-white/45">{m.description}</p>
              <div className="mt-3 grid sm:grid-cols-2 gap-2 text-[10px] text-white/45"><div><b className="text-white/65">Employer:</b> {m.worker_relationship || "Not recorded"}</div><div><b className="text-white/65">Regulator:</b> {m.regulator || "Not recorded"}</div><div className="sm:col-span-2"><b className="text-white/65">Commercial:</b> {m.pricing_rule || "Not recorded"}</div></div>
              {m.alerts?.length > 0 && <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[.04] p-3"><div className="flex gap-2 text-[10px] uppercase tracking-widest text-amber-200"><AlertTriangle className="h-3.5 w-3.5" /> Scope / compliance alert</div>{m.alerts.map((a,i)=><div key={i} className="mt-1 text-xs text-white/50">{a.message}</div>)}</div>}
              <Button variant="glass" size="sm" className="mt-3" onClick={() => createEngagement(m)}>Create CEO approval record <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button>
            </div>)}</div>}
        </div>
      </section>

      <section className="mt-6">
        <div className="text-[10px] uppercase tracking-widest text-amber-300">3 • Canonical model registry</div>
        <div className="mt-3 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {loading ? <div className="text-white/35">Loading…</div> : models.map(m => <div key={m.model_key} className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <div className="flex items-center gap-2"><Factory className="h-4 w-4 text-amber-300/80" /><span className="text-[9px] uppercase tracking-widest text-white/35">{m.category}</span></div>
            <div className="mt-2 font-semibold">{m.title}</div><div className="mt-1 text-xs leading-5 text-white/40">{m.description}</div>
            <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-white/10 px-2 py-1 text-[8px] uppercase tracking-widest text-white/45">{m.activation_status}</span>{m.regulator && <span className="rounded-full border border-white/10 px-2 py-1 text-[8px] uppercase tracking-widest text-white/35">{m.regulator}</span>}</div>
          </div>)}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-300"><Users className="h-4 w-4" /> CEO approval architecture</div>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{["Client mandate","Identity verification","Qualification/reference verification","Internal screening","Client selection","Salary/commercial approval","Scope & licence review","Contract execution","Deployment activation"].map((g,i)=><div key={g} className="rounded-xl border border-white/10 p-3"><div className="font-tactical text-lg">{String(i+1).padStart(2,"0")}</div><div className="mt-1 text-xs text-white/60">{g}</div></div>)}</div>
        <div className="mt-4 text-xs leading-6 text-white/40">A matched model never authorizes operation by itself. Licence, accreditation, insurance, employer status, contract and CEO gates are stored independently so a scope change can stop deployment rather than silently changing the business model.</div>
      </section>
    </main>
  </div>;
}
