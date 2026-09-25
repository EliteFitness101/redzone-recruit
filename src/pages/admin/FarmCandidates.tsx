import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Plus, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const statuses = [
  "Recommended for Client Consideration",
  "Consider—Additional Information Required",
  "Hold—Further Verification Required",
  "Not Currently Recommended—Role Requirements Not Demonstrated"
];

export default function FarmCandidates() {
  const { user } = useAuth();
  const [rows,setRows]=useState<any[]>([]); const [requisitions,setReqs]=useState<any[]>([]);
  const [form,setForm]=useState<any>({screening_status:"Pending",verification_status:"Pending",interview_status:"Pending",recommendation_status:"Hold—Further Verification Required"});
  const [show,setShow]=useState(false); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);

  async function load(){
    setLoading(true);
    const [{data,error},{data:reqs}] = await Promise.all([
      supabase.from("farm_candidates").select("*,farm_requisitions(position,operational_unit)").order("created_at",{ascending:false}).limit(100),
      supabase.from("farm_requisitions").select("id,position,operational_unit,status").order("created_at",{ascending:false}).limit(100)
    ]);
    if(error) toast.error(error.message); setRows(data??[]); setReqs(reqs??[]); setLoading(false);
  }
  useEffect(()=>{load()},[]);
  const set=(k:string,v:string)=>setForm((x:any)=>({...x,[k]:v}));

  async function save(e:FormEvent){
    e.preventDefault(); setSaving(true);
    const {data:access}=await supabase.from("farm_user_access").select("client_id").eq("user_id",user?.id).eq("active",true).limit(1).maybeSingle();
    if(!access?.client_id){toast.error("No farm client access is assigned to this account.");setSaving(false);return;}
    const payload={...form,client_id:access.client_id,created_by:user?.id};
    const {error}=await supabase.from("farm_candidates").insert(payload);
    setSaving(false); if(error) return toast.error(error.message);
    toast.success("Candidate added to verified pipeline"); setForm({screening_status:"Pending",verification_status:"Pending",interview_status:"Pending",recommendation_status:"Hold—Further Verification Required"}); setShow(false); load();
  }

  return <div className="min-h-screen bg-[#070707] text-white">
    <SEO title="Candidate Pipeline • Farm Command Center" noindex/>
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070707]/95 backdrop-blur-xl"><div className="container flex min-h-16 items-center justify-between"><Link to="/admin/farm-command-center" className="flex items-center gap-2 text-white/70"><ArrowLeft className="h-4 w-4"/> Command Center</Link><Button variant="glass" size="sm" onClick={load}><RefreshCw className={loading?"h-4 w-4 animate-spin":"h-4 w-4"}/></Button></div></header>
    <main className="container py-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] uppercase tracking-[.28em] text-amber-300">Stage 4</div><h1 className="mt-1 font-display text-3xl md:text-4xl font-bold">Candidate Pipeline</h1><p className="mt-2 text-sm text-white/45">Applicant ≠ proposed worker ≠ recommended candidate. Only recorded evidence moves a candidate forward.</p></div><Button variant="gold" onClick={()=>setShow(v=>!v)}><Plus className="mr-2 h-4 w-4"/>{show?"Close":"Add candidate"}</Button></div>
      {show && <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/[.04] p-5 sm:grid-cols-2 lg:grid-cols-3">
        <div><Label>Requisition</Label><select value={form.requisition_id??""} onChange={e=>set("requisition_id",e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-white/10 bg-black px-3 text-sm"><option value="">Select requisition</option>{requisitions.map(r=><option key={r.id} value={r.id}>{r.position} — {r.operational_unit||"Unit not recorded"}</option>)}</select></div>
        {[
          ["full_name","Candidate name"],["qualification","Qualification"],["relevant_experience","Relevant experience"],["location","Location"],["availability","Availability"],["farm_experience","Farm experience"],["key_strengths","Key strengths"]
        ].map(([k,l])=><div key={k}><Label>{l}</Label><Input value={form[k]??""} onChange={e=>set(k,e.target.value)}/></div>)}
        <div><Label>Recommendation</Label><select value={form.recommendation_status} onChange={e=>set("recommendation_status",e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-white/10 bg-black px-3 text-sm">{statuses.map(s=><option key={s}>{s}</option>)}</select></div>
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end"><Button variant="gold" disabled={saving}><Save className="mr-2 h-4 w-4"/>{saving?"Saving…":"Save candidate"}</Button></div>
      </form>}
      <div className="mt-6 grid gap-3">{loading?<div className="p-12 text-center text-white/35">Loading live candidates…</div>:rows.length===0?<div className="rounded-2xl border border-white/10 p-14 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-amber-300/50"/><p className="mt-3 text-white/60">No candidates recorded yet.</p><p className="mt-1 text-xs text-white/30">Empty production data is preserved as empty.</p></div>:rows.map(r=><div key={r.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{r.full_name||"Name not recorded"}</h2><p className="mt-1 text-xs text-white/40">{r.farm_requisitions?.position||"Position not recorded"} · {r.location||"Location not recorded"}</p></div><span className="rounded-full border border-amber-300/20 px-3 py-1 text-[10px] uppercase tracking-wider text-amber-200">{r.recommendation_status||"Pending"}</span></div><div className="mt-4 grid gap-3 text-xs text-white/55 sm:grid-cols-3"><div>Screening: {r.screening_status||"Not recorded"}</div><div>Verification: {r.verification_status||"Not recorded"}</div><div>Interview: {r.interview_status||"Not recorded"}</div></div></div>)}</div>
    </main>
  </div>;
}
