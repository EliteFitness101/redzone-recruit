import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { SEO } from "@/components/SEO";
import { track } from "@/lib/analytics";
import { z } from "zod";
import { useAuth } from "@/lib/auth";

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(8, "Min 8 characters").max(72);
const nameSchema = z.string().trim().min(2).max(80);

export default function Auth() {
  const [sp] = useSearchParams();
  const next = sp.get("next") ?? "/dashboard";
  const referred = sp.get("ref") ?? undefined;
  const recoveryMode = sp.get("mode") === "recovery";
  const initial = (sp.get("mode") === "register" ? "register" : "login") as "login" | "register";
  const nav = useNavigate();
  const { session } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(initial);
  const [busy, setBusy] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [recovery, setRecovery] = useState(recoveryMode);
  const [recoveryCooldown, setRecoveryCooldown] = useState(() => Math.max(0, Math.ceil((Number(localStorage.getItem("martialx_recovery_cooldown_until")) - Date.now()) / 1000)));
  const [recoveryNotice, setRecoveryNotice] = useState("");
  const [remember, setRemember] = useState(localStorage.getItem("martialx_remember") !== "false");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") setRecovery(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((Number(localStorage.getItem("martialx_recovery_cooldown_until")) - Date.now()) / 1000));
      setRecoveryCooldown((current) => current === remaining ? current : remaining);
      if (remaining === 0) localStorage.removeItem("martialx_recovery_cooldown_until");
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => { if (session && !recovery) nav(next, { replace: true }); }, [session, nav, next, recovery]);

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(fd.get("email"));
    const password = passwordSchema.safeParse(fd.get("password"));
    if (!email.success || !password.success) return toast.error("Check your inputs");
    localStorage.setItem("martialx_remember", remember ? "true" : "false");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    track("login"); toast.success("Welcome back"); nav(next, { replace: true });
  };

  const onRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(fd.get("email"));
    const password = passwordSchema.safeParse(fd.get("password"));
    const full_name = nameSchema.safeParse(fd.get("full_name"));
    if (!email.success || !password.success || !full_name.success) return toast.error("Check name, email and password");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: email.data, password: password.data, options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: full_name.data, referred_by: referred } } });
    setBusy(false);
    if (error) return toast.error(error.message);
    track("signup"); if (referred) track("referral_signup", { code: referred });
    if (data.session) {
      toast.success("Account created successfully.");
      nav(next, { replace: true });
    } else {
      toast.success("Account created. Check your email to confirm your address, then sign in.");
      setTab("login");
    }
  };

  const onForgot = async () => {
    if (busy) return;
    const storedUntil = Number(localStorage.getItem("martialx_recovery_cooldown_until"));
    const remaining = Math.max(0, Math.ceil((storedUntil - Date.now()) / 1000));
    if (remaining > 0) {
      setRecoveryCooldown(remaining);
      setRecoveryNotice(`Please wait ${remaining} seconds before requesting another email. If email delivery is still limited, wait a few minutes longer.`);
      return;
    }
    const email = emailSchema.safeParse((document.getElementById("email-l") as HTMLInputElement)?.value);
    if (!email.success) return toast.error("Enter a valid email first");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${window.location.origin}/login?mode=recovery` });
    setBusy(false);
    if (error) {
      const message = `${error.message ?? ""} ${("code" in error && error.code) || ""}`;
      if (/429|rate.?limit|over_email_send_rate_limit|too many/i.test(message)) {
        const until = Date.now() + 5 * 60 * 1000;
        localStorage.setItem("martialx_recovery_cooldown_until", String(until));
        setRecoveryCooldown(300);
        setRecoveryNotice("Email sending is temporarily rate-limited. Please wait five minutes before trying again; the provider may require a longer cooldown.");
        return toast.error("Email rate limit reached. Please wait before retrying.");
      }
      setRecoveryNotice("We couldn't submit the reset request. Check your connection and try again later.");
      return toast.error(error.message);
    }
    const until = Date.now() + 30 * 1000;
    localStorage.setItem("martialx_recovery_cooldown_until", String(until));
    setRecoveryCooldown(30);
    setRecoveryNotice("If an account matches that email, reset instructions are on the way. Check your inbox and spam folder; avoid requesting another email while you wait.");
    toast.success("If an account matches that email, reset instructions are on the way.");
  };

  const onRecovery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = passwordSchema.safeParse(new FormData(e.currentTarget).get("password"));
    if (!password.success) return toast.error(password.error.issues[0]?.message ?? "Use a valid password");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: password.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated successfully."); setRecovery(false); nav(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 bg-gradient-hero">
      <SEO title={recovery ? "Reset Password" : tab === "login" ? "Login" : "Register"} path="/login" noindex />
      <div className="glass-strong rounded-3xl w-full max-w-md p-5 sm:p-8">
        <Link to="/" className="flex items-center gap-2 mb-6"><div className="h-10 w-10 rounded-lg bg-gradient-red flex items-center justify-center shadow-red"><Shield className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} /></div><div className="font-display font-bold tracking-wider">MARTIAL <span className="text-gradient-gold">X</span></div></Link>
        {recovery ? (
          <form onSubmit={onRecovery} className="space-y-4">
            <div><div className="text-xs uppercase tracking-widest text-gold">Secure recovery</div><h1 className="font-display text-2xl font-bold mt-1">Set a new password</h1></div>
            <div><Label htmlFor="recovery-password">New password</Label><div className="relative mt-1.5"><Input id="recovery-password" name="password" type={showRecoveryPassword ? "text" : "password"} minLength={8} maxLength={72} required className="pr-11" autoComplete="new-password" aria-describedby="recovery-password-help" /><button type="button" onClick={() => setShowRecoveryPassword((value) => !value)} aria-label={showRecoveryPassword ? "Hide password" : "Show password"} aria-pressed={showRecoveryPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="sr-only">{showRecoveryPassword ? "Hide password" : "Show password"}</span>{showRecoveryPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div><p id="recovery-password-help" className="mt-1.5 text-xs text-muted-foreground">Use 8–72 characters. Avoid reusing a password from another site.</p></div>
            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : "Update Password"}</Button>
          </form>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid grid-cols-2 w-full mb-6"><TabsTrigger value="login">Sign In</TabsTrigger><TabsTrigger value="register">Create Account</TabsTrigger></TabsList>
            <TabsContent value="login"><form onSubmit={onLogin} className="space-y-4">
              <div><Label htmlFor="email-l">Email</Label><Input id="email-l" name="email" type="email" required className="mt-1.5" autoComplete="email" /></div>
              <div><Label htmlFor="password-l">Password</Label><div className="relative mt-1.5"><Input id="password-l" name="password" type={showLoginPassword ? "text" : "password"} required minLength={8} maxLength={72} className="pr-11" autoComplete="current-password" /><button type="button" onClick={() => setShowLoginPassword((value) => !value)} aria-label={showLoginPassword ? "Hide password" : "Show password"} aria-pressed={showLoginPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="sr-only">{showLoginPassword ? "Hide password" : "Show password"}</span>{showLoginPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div></div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me on this device</label>
              <div className="flex items-center justify-between text-xs"><button type="button" onClick={onForgot} disabled={busy || recoveryCooldown > 0} className="text-gold hover:underline inline-flex items-center gap-1 disabled:opacity-50 disabled:no-underline"><KeyRound className="h-3 w-3" /> {recoveryCooldown > 0 ? `Try again in ${recoveryCooldown}s` : "Forgot password?"}</button><span className="text-muted-foreground">Secure Supabase Auth</span></div>
              {recoveryNotice && <p role="status" aria-live="polite" className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{recoveryNotice}</p>}
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : "Sign In"}</Button>
            </form></TabsContent>
            <TabsContent value="register"><form onSubmit={onRegister} className="space-y-4">
              <div><Label htmlFor="name-r">Full Name</Label><Input id="name-r" name="full_name" required className="mt-1.5" autoComplete="name" /></div>
              <div><Label htmlFor="email-r">Email</Label><Input id="email-r" name="email" type="email" required className="mt-1.5" autoComplete="email" /></div>
              <div><Label htmlFor="password-r">Password</Label><div className="relative mt-1.5"><Input id="password-r" name="password" type={showRegisterPassword ? "text" : "password"} required minLength={8} maxLength={72} className="pr-11" autoComplete="new-password" aria-describedby="register-password-help" /><button type="button" onClick={() => setShowRegisterPassword((value) => !value)} aria-label={showRegisterPassword ? "Hide password" : "Show password"} aria-pressed={showRegisterPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="sr-only">{showRegisterPassword ? "Hide password" : "Show password"}</span>{showRegisterPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div><p id="register-password-help" className="mt-1.5 text-xs text-muted-foreground">Use 8–72 characters. A unique password helps protect your account.</p></div>
              {referred && <p className="text-xs text-gold">Referral code applied: {referred}</p>}
              <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : "Create Account"}</Button>
              <p className="text-[11px] text-muted-foreground text-center">By creating an account you agree to the <Link to="/legal/terms-and-conditions" className="text-gold underline underline-offset-2">Terms &amp; Conditions</Link>, <Link to="/legal/privacy-policy" className="text-gold underline underline-offset-2">Privacy Policy</Link> and <Link to="/legal/cookie-policy" className="text-gold underline underline-offset-2">Cookie Policy</Link>.</p>
            </form></TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
