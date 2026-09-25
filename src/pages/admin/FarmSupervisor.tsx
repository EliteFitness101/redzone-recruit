import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function FarmSupervisor() {
  const { user } = useAuth();
  const [units,setUnits]=useState<any[]>([]);
  const [unitId,setUnitId]=useState("");
  const [form,setForm]=useState<any>({report_date:new Date().toISOString().slice(0,10)});
  const [saving,setSaving]=useState(false);
  useEffect(()=>{supabase.from("farm_units").select("id,name,code").order("name").then(({data})=>setUnits(data??[]));},[]);
  const set=(k:string,v:string)=>setForm((x:any)=>({...x,[k]:v}));
  async function save(e:FormEvent){e.preventDefault();setSaving(true);
    const {data:access}=await supabase.from("farm_user_access").select("client_id,unit_id").eq("user_id",user?.id).eq("active",true).limit(1).maybeSingle();
    const client_id=access?.client_id, assignedUnit=access?.unit_id||unitId;
    if(!client_id||!assignedUnit){toast.error("No supervisor client/unit assignment is recorded for this account.");setSaving(false);return;}
    const payload={...form,client_id,unit_id:assignedUnit,supervisor_user_id:user?.id,workers_present:Number(form.workers_present||0),workers_absent:Number(form.workers_absent||0),tasks_planned:Number(form.tasks_planned||0),tasks_completed:Number(form.tasks_completed||0),tasks_delayed:Number(form.tasks_delayed||0),submitted_at:new Date().toISOString()};
    const {error}=await supabase.from("farm_daily_reports").insert(payload);
    setSaving(false); if(error) toast.error(error.message); else toast.success("Daily report submitted");
  }
  const numeric=[["workers_present","Workers present"],["workers_absent","Workers absent"],["tasks_planned","Tasks planned"],["tasks_completed","Tasks completed"],["tasks_delayed","Tasks delayed"]];
  const textFields=[["operational_issues","Operational issues"],["observations","Animal / plant observations"],["health_safety_issues","Health / safety issues"],["inputs_used","Inputs used"],["outputs_recorded","Outputs recorded"],["supervisor_notes","Supervisor notes"]];
  return <div className="min-h-screen bg-[#070707] text-white"><SEO title="Supervisor Console • Farm Command Center" noindex/><header className="sticky top-0 border-b border-white/10 bg-[#070707]/95"><div className="container flex min-h-16 items-center justify-between"><Link to="/admin/farm-command-center" className="flex items-center gap-2 text-white/70"><ArrowLeft className="h-4 w-4"/> Command Center</Link><span className="text-xs text-white/40">{user?.email}</span></div></header><main className="container max-w-3xl py-8"><div className="text-[10px] uppercase tracking-[.28em] text-amber-300">Supervisor workflow</div><h1 className="mt-2 font-display text-3xl font-bold">Today → My Unit → Submit Report</h1><p className="mt-2 text-sm text-white/50">Recorded operational facts only.</p><form onSubmit={save} className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="col-span-2"><Label>Operational unit</Label><select value={unitId} onChange={e=>setUnitId(e.target.value)} className="mt-2 h-10 w-full rounded-md border border-white/10 bg-black px-3 text-sm">{units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div><div><Label>Date</Label><Input type="date" value={form.report_date} onChange={e=>set("report_date",e.target.value)}/></div>{numeric.map(([k,l])=><div key={k}><Label>{l}</Label><Input type="number" min="0" value={form[k]??""} onChange={e=>set(k,e.target.value)}/></div>)}{textFields.map(([k,l])=><div key={k} className="col-span-2"><Label>{l}</Label><Input value={form[k]??""} onChange={e=>set(k,e.target.value)}/></div>)}<div className="col-span-2 flex justify-end"><Button variant="gold" disabled={saving}><Save className="mr-2 h-4 w-4"/>{saving?"Submitting…":"Submit daily report"}</Button></div></form></main></div>;
}