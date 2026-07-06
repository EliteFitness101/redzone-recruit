import { useState } from "react";
import { Briefcase, CheckCircle2, MessageCircle, Send, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { CONTACT, waLink, tgLink } from "@/config/site";

const perks = [
  "Verified placement with licensed firms",
  "₦80k–₦250k starting deployment salary range",
  "Uniform, ID and basic kit provided on assignment",
  "Promotion track to supervisor & close-protection",
];

const schema = z.object({
  full_name: z.string().trim().min(2).max(80),
  age: z.coerce.number().int().min(18).max(60),
  phone: z.string().trim().min(7).max(20),
  location: z.string().trim().min(2).max(80),
  education: z.string().min(2),
  fitness_level: z.string().min(2),
  prior_experience: z.string().max(120).optional(),
});

export const Recruitment = () => {
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return toast.error(first?.message ?? "Check your inputs");
    }
    setBusy(true);
    const { error } = await supabase.from("applications").insert({
      ...parsed.data,
      user_id: user?.id ?? null,
      email: user?.email ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    track("application_submit", { location: parsed.data.location, fitness: parsed.data.fitness_level });
    toast.success("Application received", {
      description: "We'll continue onboarding on WhatsApp.",
    });
    (e.currentTarget as HTMLFormElement).reset();
    // Auto-open WhatsApp for onboarding continuation
    setTimeout(() => {
      window.open(waLink(`Hi RedZone, I just submitted an application (${parsed.data.full_name}, ${parsed.data.location}). Please onboard me.`), "_blank");
    }, 600);
  };

  return (
    <section id="recruitment" className="relative py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-tactical opacity-60" />
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-block glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
              02 — RedZone Security Recruitment
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold leading-tight">
              Apply once. <span className="text-gradient-gold">Get deployed</span> for life.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              We screen, train and deploy disciplined recruits to Nigeria's most reputable security firms. Fully licensed. Fully compliant.
            </p>

            <ul className="mt-8 space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{p}</span>
                </li>
              ))}
            </ul>

            <div id="telegram" className="mt-10 grid sm:grid-cols-2 gap-3">
              <Button variant="tactical" size="lg" asChild>
                <a href={tgLink()} target="_blank" rel="noopener noreferrer"
                   onClick={() => track("telegram_click", { source: "recruitment" })}
                   aria-label="Telegram bot">
                  <Send /> Telegram Bot
                </a>
              </Button>
              <Button variant="gold" size="lg" asChild>
                <a href={waLink("Hi RedZone, I want to start the recruitment onboarding.")} target="_blank" rel="noopener noreferrer"
                   onClick={() => track("whatsapp_click", { source: "recruitment" })}
                   aria-label="WhatsApp onboarding">
                  <MessageCircle /> WhatsApp Onboarding
                </a>
              </Button>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-7 md:p-9 shadow-glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-xl bg-gradient-red flex items-center justify-center shadow-red">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Recruitment Application</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  <Briefcase className="inline h-3 w-3 mr-1" />
                  Step 1 of 2 — Qualification
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" name="full_name" required maxLength={80} placeholder="Adekunle Bello" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" name="age" type="number" min={18} max={60} required placeholder="24" className="mt-1.5" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" required placeholder="+234 803 000 0000" className="mt-1.5" maxLength={20} />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" required placeholder="Lagos / Abuja / PH" className="mt-1.5" maxLength={80} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="education">Education</Label>
                  <select id="education" name="education" required
                    className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select…</option>
                    <option>SSCE / WAEC</option>
                    <option>OND / NCE</option>
                    <option>HND / BSc</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="fitness_level">Fitness Level</Label>
                  <select id="fitness_level" name="fitness_level" required
                    className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select…</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="prior_experience">Prior Experience (optional)</Label>
                <Input id="prior_experience" name="prior_experience" placeholder="Military / Police / Guard / None" className="mt-1.5" maxLength={120} />
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : "Submit Application"}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                By applying you agree to RedZone Security's vetting and licensing policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
