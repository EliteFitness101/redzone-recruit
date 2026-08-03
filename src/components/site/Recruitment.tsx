import { useRef, useState } from "react";
import { Briefcase, CheckCircle2, MessageCircle, Send, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { getAttribution } from "@/lib/attribution";
import { waLink, tgLink } from "@/config/site";

const perks = [
  "Verified placement with licensed firms",
  "₦80k–₦250k starting deployment salary range",
  "Uniform, ID and basic kit provided on assignment",
  "Promotion track to supervisor & close-protection",
];

const AGE_RANGES: Record<string, number> = {
  "18–24": 21,
  "25–34": 29,
  "35–44": 39,
  "45+": 46,
};

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  location: z.string().trim().min(2, "Enter your city").max(80),
  age_range: z.string().min(2, "Select your age range"),
  profession: z.string().trim().min(2, "Enter your current profession").max(80),
  security_experience: z.string().min(2, "Select your security experience"),
  training_interest: z.string().min(2, "Select a training interest"),
  fitness_level: z.string().min(2, "Select your fitness level"),
});

export const Recruitment = () => {
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const started = useRef(false);

  const onFirstInput = () => {
    if (started.current) return;
    started.current = true;
    track("application_start", { source: "recruitment_form" });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return toast.error(first?.message ?? "Check your inputs");
    }
    const d = parsed.data;
    const attribution = getAttribution();
    setBusy(true);
    const { error } = await supabase.from("applications").insert({
      full_name: d.full_name,
      email: d.email,
      phone: d.phone,
      location: d.location,
      age: AGE_RANGES[d.age_range] ?? 21,
      education: d.profession,
      fitness_level: d.fitness_level,
      prior_experience: d.security_experience,
      notes: JSON.stringify({
        age_range: d.age_range,
        profession: d.profession,
        security_experience: d.security_experience,
        training_interest: d.training_interest,
        attribution,
      }),
      user_id: user?.id ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    track("application_submit", {
      location: d.location,
      training_interest: d.training_interest,
      experience: d.security_experience,
      ...attribution,
    });
    toast.success("Application received", {
      description: "Admissions will reach you on WhatsApp within 24 hours.",
    });
    form.reset();
    setTimeout(() => {
      window.open(
        waLink(`Hi Martial X Admissions, I just submitted an application (${d.full_name}, ${d.location} — ${d.training_interest}). Please onboard me.`),
        "_blank",
      );
    }, 600);
  };

  const selectCls =
    "mt-1.5 flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <section id="recruitment" className="relative py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-tactical opacity-60" />
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-block glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
              Recruitment Application
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
              Apply once. <span className="text-gradient-gold">Get deployed</span> for life.
            </h2>
            <p className="mt-5 text-muted-foreground md:text-lg max-w-xl">
              We screen, train and deploy disciplined recruits to Nigeria's most reputable
              security firms. Fully licensed. Fully compliant.
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
                <a href={waLink("Hi Martial X Admissions, I want to start the recruitment onboarding.")}
                   target="_blank" rel="noopener noreferrer"
                   onClick={() => track("whatsapp_click", { source: "recruitment" })}
                   aria-label="WhatsApp onboarding">
                  <MessageCircle /> WhatsApp Onboarding
                </a>
              </Button>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6 md:p-9 shadow-glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-xl bg-gradient-red flex items-center justify-center shadow-red">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Start Your Application</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  <Briefcase className="inline h-3 w-3 mr-1" />
                  Takes under 60 seconds
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} onInput={onFirstInput} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" required maxLength={80} placeholder="Adekunle Bello" className="mt-1.5" autoComplete="name" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required maxLength={255} placeholder="you@email.com" className="mt-1.5" autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone / WhatsApp</Label>
                  <Input id="phone" name="phone" type="tel" required maxLength={20} placeholder="+234 803 000 0000" className="mt-1.5" autoComplete="tel" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">City / Location</Label>
                  <Input id="location" name="location" required maxLength={80} placeholder="Lagos / Abuja / PH" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="age_range">Age Range</Label>
                  <select id="age_range" name="age_range" required className={selectCls} defaultValue="">
                    <option value="">Select…</option>
                    {Object.keys(AGE_RANGES).map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profession">Current Profession</Label>
                  <Input id="profession" name="profession" required maxLength={80} placeholder="Guard / Driver / Student / Coach" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="security_experience">Security Experience</Label>
                  <select id="security_experience" name="security_experience" required className={selectCls} defaultValue="">
                    <option value="">Select…</option>
                    <option>None</option>
                    <option>Under 1 year</option>
                    <option>1–3 years</option>
                    <option>3+ years</option>
                    <option>Military / Police background</option>
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="training_interest">Training Interest</Label>
                  <select id="training_interest" name="training_interest" required className={selectCls} defaultValue="">
                    <option value="">Select…</option>
                    <option>Basic Security Training</option>
                    <option>Elite Security Track</option>
                    <option>VIP Protection</option>
                    <option>Tactical Fitness Coaching</option>
                    <option>Not sure yet</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="fitness_level">Fitness Level</Label>
                  <select id="fitness_level" name="fitness_level" required className={selectCls} defaultValue="">
                    <option value="">Select…</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
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
