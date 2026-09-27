import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

const CLAIM_KEY = "cy_farm_claim_token";
const CY_CLIENT_ID = "8f1a95ef-8052-403b-8119-3765e8a8eaeb";

export default function CYFarmAccess() {
  const { session, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const claim = sp.get("claim") || sessionStorage.getItem(CLAIM_KEY) || "";
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => { if (claim) sessionStorage.setItem(CLAIM_KEY, claim); }, [claim]);

  useEffect(() => {
    if (!session) return;
    const run = async () => {
      setBusy(true);
      const { data: access } = await supabase.from("farm_user_access").select("access_role").eq("user_id", session.user.id).eq("client_id", CY_CLIENT_ID).eq("active", true).limit(1);
      if (access?.length) { sessionStorage.removeItem(CLAIM_KEY); nav("/admin/farm-command-center", { replace: true }); return; }
      if (!claim) { setBusy(false); return; }
      const { data, error } = await supabase.functions.invoke("cy-farm-owner-claim", { body: { claim_token: claim } });
      if (error || !data?.ok) { setBusy(false); toast.error(error?.message || data?.error || "This CY Farm access link cannot be activated."); return; }
      sessionStorage.removeItem(CLAIM_KEY);
      toast.success("CY Farm owner access activated.");
      nav("/admin/farm-command-center", { replace: true });
    };
    run();
  }, [session?.user.id]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const full_name = String(fd.get("full_name") || "").trim();
    if (!email || password.length < 8 || (mode === "register" && full_name.length < 2)) return toast.error("Enter valid account details.");
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setBusy(false); return toast.error(error.message); }
      return;
    }
    const redirectTo = window.location.origin + "/cy-farm" + (claim ? "?claim=" + encodeURIComponent(claim) : "");
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name }, emailRedirectTo: redirectTo } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) return;
    toast.success("Check the dedicated CY Farm email address to confirm the account, then return here.");
  };

  if (authLoading || (session && busy)) return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white"><Loader2 className="animate-spin text-amber-300" /></div>;

  return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-5">
    <SEO title="CY Farms Command Center — Secure Access" path="/cy-farm" noindex />
    <div className="w-full max-w-lg rounded-[2rem] border border-amber-200/15 bg-white/[.035] p-7 shadow-[0_30px_120px_rgba(0,0,0,.65)] md:p-9">
      <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10"><Crown className="h-5 w-5 text-amber-200" /></div><div><div className="text-[10px] uppercase tracking-[.25em] text-amber-200/60">Private client surface</div><div className="font-display text-xl">CY Farms Command Center</div></div></div>
      <div className="mt-8"><div className="text-xs uppercase tracking-[.22em] text-white/35">Secure farm governance access</div><h1 className="mt-2 font-display text-3xl">Recruitment · Workforce · Operations</h1><p className="mt-3 text-sm leading-6 text-white/45">This entry point is dedicated to CY Farms. It does not onboard the account into the general Martial X dashboard.</p></div>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {mode === "register" && <div><Label htmlFor="cy-name">Full Name</Label><Input id="cy-name" name="full_name" required className="mt-1.5 border-white/10 bg-white/[.04]" /></div>}
        <div><Label htmlFor="cy-email">Dedicated CY Farms Email</Label><Input id="cy-email" name="email" type="email" required className="mt-1.5 border-white/10 bg-white/[.04]" /></div>
        <div><Label htmlFor="cy-password">Password</Label><Input id="cy-password" name="password" type="password" minLength={8} required className="mt-1.5 border-white/10 bg-white/[.04]" /></div>
        <Button type="submit" disabled={busy} className="w-full bg-amber-300 text-black hover:bg-amber-200">{busy ? <Loader2 className="animate-spin" /> : mode === "login" ? "Enter CY Farm Command Center" : "Create CY Farm Governance Account"}</Button>
      </form>
      <div className="mt-5 flex items-center justify-between text-xs text-white/35"><button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-amber-200/80 underline underline-offset-4">{mode === "login" ? "Create the dedicated CY account" : "Use an existing CY account"}</button><span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Protected access</span></div>
    </div>
  </div>;
}
