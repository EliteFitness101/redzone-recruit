import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Check, ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { TIERS, type TierId } from "@/config/site";
import { track } from "@/lib/analytics";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(255);

export default function Checkout() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const tierId = (sp.get("tier") as TierId) || "elite";
  const tier = TIERS[tierId] ?? TIERS.elite;
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const referral = sp.get("ref") ?? localStorage.getItem("mx_ref") ?? undefined;

  const start = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return toast.error("Enter a valid email");
    setBusy(true);
    track("checkout_start", { tier: tier.id, amount: tier.price });
    const { data, error } = await supabase.functions.invoke("paystack", {
      body: { action: "init", tier: tier.id, email: parsed.data, referral_code: referral },
    });
    setBusy(false);
    if (error || !data?.authorization_url) {
      track("payment_failed", { tier: tier.id, reason: error?.message ?? "no_url" });
      return toast.error(error?.message ?? "Could not start checkout");
    }
    window.location.href = data.authorization_url;
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-gradient-hero">
      <SEO title={`Checkout — ${tier.name}`} path="/checkout" noindex />
      <div className="container py-16 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => nav(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="glass-strong rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <Shield className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Secure checkout</div>
              <h1 className="font-display text-2xl font-bold">{tier.name}</h1>
            </div>
          </div>

          <div className="text-5xl font-tactical text-gradient-gold mb-6">₦{tier.price.toLocaleString()}</div>

          <ul className="space-y-2 text-sm mb-8">
            {["Lifetime access", "Digital certificate", "Priority job placement queue", "Instant Telegram invite"].map((f) => (
              <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-gold mt-0.5" />{f}</li>
            ))}
          </ul>

          <form onSubmit={start} className="space-y-4">
            <div>
              <Label htmlFor="ck-email">Email for receipt</Label>
              <Input id="ck-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </div>
            {referral && <p className="text-xs text-gold">Referral applied: {referral}</p>}
            <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : `Pay ₦${tier.price.toLocaleString()} via Paystack`}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Secured by Paystack · Cards, Transfer, USSD supported
            </p>
            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                Have an account? <Link className="text-gold underline" to={`/login?next=/checkout?tier=${tier.id}`}>Sign in</Link> for faster checkout.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
