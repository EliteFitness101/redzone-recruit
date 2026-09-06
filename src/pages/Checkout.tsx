import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Check, ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchMartialOffer, type MartialOfferId } from "@/lib/martialOffers";
import { getAttribution } from "@/lib/attribution";
import { track } from "@/lib/analytics";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(255);
const nameSchema = z.string().trim().min(2).max(120);
const phoneSchema = z.string().trim().min(7).max(32);

export default function Checkout() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const requestedTier = sp.get("tier") as MartialOfferId | null;
  const validIds = ["basic", "elite", "vip"] as const;
  const tierId = requestedTier && validIds.includes(requestedTier) ? requestedTier : null;
  const [tier, setTier] = useState<Awaited<ReturnType<typeof fetchMartialOffer>>>(null);
  const [loadingOffer, setLoadingOffer] = useState(Boolean(tierId));
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const referral = sp.get("ref") ?? localStorage.getItem("mx_ref") ?? undefined;

  useEffect(() => {
    if (!tierId) {
      setLoadingOffer(false);
      return;
    }
    fetchMartialOffer(tierId).then(setTier).catch(() => setTier(null)).finally(() => setLoadingOffer(false));
  }, [tierId]);

  if (!tierId || (!loadingOffer && !tier)) {
    return (
      <div className="min-h-screen bg-background text-foreground bg-gradient-hero flex items-center justify-center p-6">
        <SEO title="Checkout — Offer Not Found" path="/checkout" noindex />
        <div className="glass-strong rounded-3xl p-10 max-w-md text-center">
          <h1 className="font-display text-2xl font-bold mb-3">Offer not found</h1>
          <p className="text-muted-foreground mb-6">This checkout offer is unavailable. Choose an active training offer to continue.</p>
          <Button variant="hero" size="lg" onClick={() => nav("/pricing")}>View training offers</Button>
        </div>
      </div>
    );
  }

  if (loadingOffer || !tier) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>;
  }

  const start = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const parsedEmail = emailSchema.safeParse(email);
    const parsedName = nameSchema.safeParse(fullName);
    const parsedPhone = phoneSchema.safeParse(phone);
    if (!parsedEmail.success) return toast.error("Enter a valid email");
    if (!parsedName.success) return toast.error("Enter your full name");
    if (!parsedPhone.success) return toast.error("Enter a valid phone number");

    setBusy(true);
    const attribution = getAttribution();
    track("checkout_start", {
      tier: tier.id,
      sku: tier.sku,
      value: tier.price,
      amount: tier.price,
      currency: "NGN",
      ...attribution,
    });

    const { data, error } = await supabase.functions.invoke("paystack-init", {
      body: {
        sku: tier.sku,
        name: parsedName.data,
        email: parsedEmail.data,
        phone: parsedPhone.data,
        rsid: attribution.rsid,
        ttclid: attribution.ttclid,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_term: attribution.utm_term,
        utm_content: attribution.utm_content,
        funnel_origin: attribution.funnel_origin ?? "martial_x",
        campaign: "tiktok",
      },
    });
    setBusy(false);
    if (error || !data?.authorization_url) {
      track("payment_failed", { tier: tier.id, sku: tier.sku, reason: error?.message ?? "no_url" });
      return toast.error(error?.message ?? "Could not start checkout");
    }
    window.location.href = data.authorization_url;
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-gradient-hero">
      <SEO title={`Checkout — ${tier.name}`} path="/checkout" noindex />
      <div className="container py-16 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => nav(-1)} className="mb-6"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <div className="glass-strong rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold"><Shield className="h-5 w-5 text-accent-foreground" /></div>
            <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Secure checkout</div><h1 className="font-display text-2xl font-bold">{tier.name}</h1></div>
          </div>
          <div className="text-5xl font-tactical text-gradient-gold mb-6">₦{tier.price.toLocaleString()}</div>
          <ul className="space-y-2 text-sm mb-8">{["Lifetime access", "Digital certificate", "Priority job placement queue", "Instant Telegram invite"].map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-gold mt-0.5" />{f}</li>)}</ul>
          <form onSubmit={start} className="space-y-4">
            <div><Label htmlFor="ck-name">Full name</Label><Input id="ck-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className="mt-1.5" /></div>
            <div><Label htmlFor="ck-email">Email for receipt</Label><Input id="ck-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-1.5" /></div>
            <div><Label htmlFor="ck-phone">Phone / WhatsApp</Label><Input id="ck-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="mt-1.5" /></div>
            {referral && <p className="text-xs text-gold">Referral applied: {referral}</p>}
            <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : `Pay ₦${tier.price.toLocaleString()} via Paystack`}</Button>
            <p className="text-[11px] text-muted-foreground text-center">Secured by Paystack · Cards, Transfer, USSD supported. By paying you accept the <Link to="/legal/academy-terms" className="text-gold underline underline-offset-2">Academy Terms</Link> and <Link to="/legal/refund-policy" className="text-gold underline underline-offset-2">Refund Policy</Link>.</p>
            {!user && <p className="text-xs text-center text-muted-foreground">Have an account? <Link className="text-gold underline" to={`/login?next=${encodeURIComponent(`/checkout?tier=${tier.id}`)}`}>Sign in</Link> for faster checkout.</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
