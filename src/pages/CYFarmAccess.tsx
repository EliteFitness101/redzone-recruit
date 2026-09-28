import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

export default function CYFarmAccess() {
  const { session, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get("next") || "/admin/farm-command-center";
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const inviteFlow = useMemo(() => new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type") === "invite", []);

  useEffect(() => {
    if (!session || inviteFlow) return;
    (async () => {
      setBusy(true);
      const { data: access, error } = await supabase.from("farm_user_access").select("access_role,client_id").eq("user_id", session.user.id).eq("active", true).limit(1);
      if (error || !access?.length) {
        setBusy(false);
        toast.error("This account is authenticated but has no active farm tenant access.");
        return;
      }
      nav(next.startsWith("/admin/farm-command-center") ? next : "/admin/farm-command-center", { replace: true });
    })();
  }, [session?.user.id, inviteFlow, next, nav]);

  const setPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Use a password of at least 8 characters.");
    setBusy(true);
    const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
    if (passwordError) { setBusy(false); return toast.error(passwordError.message); }

    const { data, error: claimError } = await supabase.functions.invoke("cy-farm-owner-claim", { body: {} });
    if (claimError || !data?.ok) {
      setBusy(false);
      return toast.error(data?.error || claimError?.message || "Farm invitation could not be activated.");
    }

    toast.success("Password set. Farm access is now active.");
    nav("/admin/farm-command-center", { replace: true });
  };

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    if (!email || password.length < 8) return toast.error("Enter your farm account email and password.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); return toast.error(error.message); }
  };

  if (authLoading || (session && busy && !inviteFlow)) return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white"><Loader2 className="animate-spin text-amber-300" /></div>;

  if (session && inviteFlow) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-5">
    <SEO title="Accept Farm Invitation" path="/cy-farm" noindex />
    <div className="w-full max-w-lg rounded-[2rem] border border-amber-200/15 bg-white/[.035] p-7 shadow-2xl md:p-9">
      <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10"><Crown className="h-5 w-5 text-amber-200" /></div><div><div className="text-[10px] uppercase tracking-[.25em] text-amber-200/60">Invitation accepted</div><div className="font-display text-xl">Farm Command Center</div></div></div>
      <h1 className="mt-8 font-display text-3xl">Set your private password</h1>
      <p className="mt-3 text-sm leading-6 text-white/45">Your invitation has been verified. Set a private password to complete account setup.</p>
      <form onSubmit={setPassword} className="mt-7 space-y-4"><div><Label htmlFor="farm-new-password">Password</Label><Input id="farm-new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" minLength={8} required className="mt-1.5 border-white/10 bg-white/[.04]" /></div><Button type="submit" disabled={busy} className="w-full bg-amber-300 text-black hover:bg-amber-200">{busy ? <Loader2 className="animate-spin" /> : "Set Password & Enter Command Center"}</Button></form>
    </div>
  </div>;

  return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-5">
    <SEO title="Farm Command Center — Secure Access" path="/cy-farm" noindex />
    <div className="w-full max-w-lg rounded-[2rem] border border-amber-200/15 bg-white/[.035] p-7 shadow-2xl md:p-9">
      <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10"><Crown className="h-5 w-5 text-amber-200" /></div><div><div className="text-[10px] uppercase tracking-[.25em] text-amber-200/60">Private client surface</div><div className="font-display text-xl">Farm Command Center</div></div></div>
      <div className="mt-8"><div className="text-xs uppercase tracking-[.22em] text-white/35">Secure farm governance access</div><h1 className="mt-2 font-display text-3xl">Recruitment · Workforce · Operations</h1><p className="mt-3 text-sm leading-6 text-white/45">Farm access is invitation-only. Existing clients sign in here; new clients use the invitation email to establish their password.</p></div>
      <form onSubmit={signIn} className="mt-7 space-y-4"><div><Label htmlFor="farm-email">Account Email</Label><Input id="farm-email" name="email" type="email" required className="mt-1.5 border-white/10 bg-white/[.04]" /></div><div><Label htmlFor="farm-password">Password</Label><Input id="farm-password" name="password" type="password" minLength={8} required className="mt-1.5 border-white/10 bg-white/[.04]" /></div><Button type="submit" disabled={busy} className="w-full bg-amber-300 text-black hover:bg-amber-200">{busy ? <Loader2 className="animate-spin" /> : "Enter Farm Command Center"}</Button></form>
      <div className="mt-5 flex items-center justify-between text-xs text-white/35"><span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Tenant-bound access</span><span>Invitation required for new users</span></div>
    </div>
  </div>;
}