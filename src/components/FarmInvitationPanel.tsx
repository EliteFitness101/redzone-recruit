import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

type Client = { id: string; name: string; code: string };

export default function FarmInvitationPanel() {
  const [clients,setClients]=useState<Client[]>([]);
  const [clientId,setClientId]=useState("");
  const [email,setEmail]=useState("");
  const [role,setRole]=useState("client");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{(async()=>{const {data,error}=await supabase.from("farm_clients").select("id,name,code").eq("status","active").order("name");if(error)return toast.error(error.message);setClients(data??[]);if(data?.[0])setClientId(data[0].id);})();},[]);

  const send=async(e:React.FormEvent)=>{e.preventDefault();if(!clientId||!email.trim())return toast.error("Select a client tenant and enter the recipient email.");setBusy(true);const {data,error}=await supabase.functions.invoke("cy-farm-invite",{body:{email:email.trim(),client_id:clientId,access_role:role}});setBusy(false);if(error||!data?.ok)return toast.error(data?.error||error?.message||"Invitation could not be sent.");toast.success("Invitation sent. The recipient can now set a password and enter the Command Center.");setEmail("");};

  return <section className="glass rounded-2xl p-5 mb-6"><div className="flex items-center gap-2 font-display text-xl"><Send className="h-4 w-4 text-gold"/> Client Invitation</div><p className="mt-1 text-sm text-muted-foreground">Server-controlled invitation. Tenant and recipient details are selected at runtime.</p><form onSubmit={send} className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1.2fr_.8fr_auto]"><select value={clientId} onChange={e=>setClientId(e.target.value)} className="bg-secondary rounded-md px-3 py-2 text-sm border border-border" required><option value="">Select client tenant</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}</select><Input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Client email" required/><select value={role} onChange={e=>setRole(e.target.value)} className="bg-secondary rounded-md px-3 py-2 text-sm border border-border"><option value="client">Client</option><option value="owner">Owner</option><option value="executive">Executive</option><option value="operations">Operations</option><option value="supervisor">Supervisor</option></select><Button type="submit" disabled={busy}>{busy?<Loader2 className="animate-spin"/>:<Send className="mr-2 h-4 w-4"/>}{busy?"Sending":"Send invitation"}</Button></form></section>;
}