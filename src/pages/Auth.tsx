import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";
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
  const initial = (sp.get("mode") === "register" ? "register" : "login") as "login" | "register";
  const nav = useNavigate();
  const { session } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) nav(next, { replace: true });
  }, [session, nav, next]);

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(fd.get("email"));
    const password = passwordSchema.safeParse(fd.get("password"));
    if (!email.success || !password.success) return toast.error("Check your inputs");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.data, password: password.data,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    track("login");
    toast.success("Welcome back");
    nav(next, { replace: true });
  };

  const onRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(fd.get("email"));
    const password = passwordSchema.safeParse(fd.get("password"));
    const full_name = nameSchema.safeParse(fd.get("full_name"));
    if (!email.success || !password.success || !full_name.success)
      return toast.error("Check name, email and password");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.data,
      password: password.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: full_name.data, referred_by: referred },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    track("signup");
    if (referred) track("referral_signup", { code: referred });
    toast.success("Account created — you're in.");
    nav(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 bg-gradient-hero">
      <SEO title={tab === "login" ? "Login" : "Register"} path={`/${tab}`} noindex />
      <div className="glass-strong rounded-3xl w-full max-w-md p-8">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-red flex items-center justify-center shadow-red">
            <Shield className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="font-display font-bold tracking-wider">
            MARTIAL <span className="text-gradient-gold">X</span>
          </div>
        </Link>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Create Account</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <Label htmlFor="email-l">Email</Label>
                <Input id="email-l" name="email" type="email" required className="mt-1.5" autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="password-l">Password</Label>
                <Input id="password-l" name="password" type="password" required className="mt-1.5" autoComplete="current-password" />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={onRegister} className="space-y-4">
              <div>
                <Label htmlFor="name-r">Full Name</Label>
                <Input id="name-r" name="full_name" required className="mt-1.5" autoComplete="name" />
              </div>
              <div>
                <Label htmlFor="email-r">Email</Label>
                <Input id="email-r" name="email" type="email" required className="mt-1.5" autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="password-r">Password (min 8)</Label>
                <Input id="password-r" name="password" type="password" required minLength={8} className="mt-1.5" autoComplete="new-password" />
              </div>
              {referred && (
                <p className="text-xs text-gold">Referral code applied: {referred}</p>
              )}
              <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
