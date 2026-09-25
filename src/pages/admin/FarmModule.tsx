import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Plus, RefreshCw, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const config: Record<string,{title:string;eyebrow:string;table:string;fields:string[]}> = {
  workforce:{title:"Workforce Mapping",eyebrow:"Stage 1",table:"farm_workers",fields:["full_name","location","employment_status","qualification","relevant_experience","farm_experience","primary_responsibilities","availability"]},
  gaps:{title:"Operational Gap Analysis",eyebrow:"Stage 2",table:"farm_workforce_gaps",fields:["priority","reason","evidence_source","status"]},
  productivity:{title:"Daily & Weekly Productivity",eyebrow:"Stage 3",table:"farm_daily_reports",fields:["report_date","workers_present","workers_absent","tasks_planned","tasks_completed","tasks_delayed","operational_issues","observations","health_safety_issues","inputs_used","outputs_recorded","supervisor_notes"]},
  recruitment:{title:"Targeted Recruitment",eyebrow:"Stage 4",table:"farm_requisitions",fields:["position","required_quantity","location","required_qualification","required_experience","farm_experience","availability_requirement","priority","reason","status"]},
  placements:{title:"Placement Fee Ledger",eyebrow:"Stage 4",table:"farm_placements",fields:["position","placement_date","fee_rate","fee_base","payment_status","invoice_status","replacement_eligibility","notes"]},
  performance:{title:"Post-Placement Performance",eyebrow:"Stage 5",table:"farm_performance_reviews",fields:["review_period","attendance","task_completion","technical_performance","supervisor_feedback","client_feedback","issues","corrective_action","training_requirement","retention_status","replacement_status","review_date"]},
  reports:{title:"Executive Reports",eyebrow:"Executive",table:"farm_daily_reports",fields:[]},
  actions:{title:"Operations Action Queue",eyebrow:"Control",table:"farm_action_queue",fields:["action_type","title","description","priority","status","due_at"]},
  commercial:{title:"Compensation & Engagement Authorization",eyebrow:"CY Commercial Governance",table:"farm_commercial_authorizations",fields:["position","engagement_type","compensation_basis","proposed_amount","currency","output_definition","measurement_unit","payment_frequency","allowances","deductions","contract_start","contract_end","probation_or_trial","replacement_terms","status","approval_reference","evidence_url","notes"]}
};

export default function FarmModule(){
  const key=useLocation().pathname.split("/").pop() || "workforce";
  const c=config[key] ?? config.workforce;
  const [rows,setRows]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [query,setQuery]=useState("");
  const [form,setForm]=useState<Record<string,string>>({});
  const [showForm,setShowForm]=useState(false);

  async function load(){
    setLoading(true);
    const {data,error}=await supabase.from(c.table).select("*").order("created_at",{ascending:false}).limit(100);
    if(error) toast.error(error.message);
    setRows(data??[]); setLoading(false);
  }
  useEffect(()=>{load();},[c.table]);

  const save=async(e:FormEvent)=>{
    e.preventDefault(); setSaving(true);
    const clean:any={};
    c.fields.forEach(f=>{if(form[f]!==undefined && form[f]!=="") clean[f]=form[f];});
    if(c.table==="farm_performance_reviews") { toast.error("Create a placement first; then attach a 7/30/60/90-day review."); setSaving(false); return; }
    if(["required_quantity","workers_present","workers_absent","tasks_planned","tasks_completed","tasks_delayed","fee_base","proposed_amount"].some(f=>f in clean)) {
      for(const f of ["required_quantity","workers_present","workers_absent","tasks_planned","tasks_completed","tasks_delayed","fee_base","proposed_amount"]) if(f in clean) clean[f]=Number(clean[f]);
    }
    const {data:access}=await supabase.from("farm_user_access").select("client_id,unit_id").eq("user_id",(await supabase.auth.getUser()).data.user?.id).eq("active",true).limit(1).maybeSingle();
    if(access?.client_id) clean.client_id=access.client_id;
    if(access?.unit_id && !clean.unit_id) clean.unit_id=access.unit_id;
    if(c.table==="farm_placements") clean.fee_rate=Number(clean.fee_rate||9);
    if(c.table==="farm_commercial_authorizations") {
      clean.proposed_amount = clean.proposed_amount === undefined ? null : Number(clean.proposed_amount);
      if(!clean.status) clean.status="awaiting_cy_approval";
    }
    const {error}=await supabase.from(c.table).insert(clean);
    setSaving(false);
    if(error) return toast.error(error.message);
    toast.success("Record saved"); setForm({}); setShowForm(false); load();
  };

  const filtered=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));
  const columns=c.fields.slice(0,5);

  return <div className="min-h-screen bg-[#070707] text-white">
    <SEO title={`${c.title} • Farm Command Center`} path={`/admin/farm-command-center/${key}`} noindex />
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070707]/95 backdrop-blur-xl"><div className="container flex min-h-16 items-center justify-between"><Link to="/admin/farm-command-center" className="flex items-center gap-2 text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4"/> Command Center</Link><Button variant="glass" size="sm" onClick={load}><RefreshCw className={loading?"h-4 w-4 animate-spin":"h-4 w-4"}/></Button></div></header>
    <main className="container py-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] uppercase tracking-[0.28em] text-amber-300">{c.eyebrow}</div><h1 className="mt-1 font-display text-3xl md:text-4xl font-bold">{c.title}</h1><p className="mt-2 text-sm text-white/45">Live production records. Missing values remain unrecorded.</p></div>{c.fields.length>0 && <Button variant="gold" onClick={()=>setShowForm(v=>!v)}><Plus className="h-4 w-4 mr-2"/>{showForm?"Close":"Add record"}</Button>}</div>
      {showForm && <form onSubmit={save} className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {c.fields.map(f=><div key={f}><Label className="text-[10px] uppercase tracking-widest text-white/50">{f.replaceAll("_"," ")}</Label><Input value={form[f]??""} onChange={e=>setForm({...form,[f]:e.target.value})} className="mt-1.5 bg-black/30 border-white/10" placeholder={f==="priority"?"critical / high / medium / low":""} /></div>)}
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end"><Button type="submit" variant="gold" disabled={saving}><Save className="h-4 w-4 mr-2"/>{saving?"Saving…":"Save verified record"}</Button></div>
      </form>}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-3"><Search className="h-4 w-4 text-white/30"/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search live records…" className="border-0 bg-transparent focus-visible:ring-0"/></div>
        {loading?<div className="p-12 text-center text-white/35">Loading live records…</div>:filtered.length===0?<div className="p-14 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-amber-300/50"/><div className="mt-3 text-sm text-white/60">No records yet</div><div className="mt-1 text-xs text-white/30">This is an empty production dataset, not an invented metric. For commercial terms, absence means CY approval is still required.</div></div>:
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[9px] uppercase tracking-widest text-white/35">{columns.map(x=><th key={x} className="px-4 py-3">{x.replaceAll("_"," ")}</th>)}<th className="px-4 py-3">Created</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id} className="border-t border-white/8">{columns.map(x=><td key={x} className="px-4 py-3 max-w-[260px] truncate">{r[x] == null || r[x]==="" ? "Not recorded" : String(r[x])}</td>)}<td className="px-4 py-3 text-white/35">{r.created_at?new Date(r.created_at).toLocaleString():"—"}</td></tr>)}</tbody></table></div>}
      </div>
    </main>
  </div>;
}
