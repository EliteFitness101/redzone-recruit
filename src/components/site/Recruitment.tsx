import { useRef, useState } from "react";
import { Briefcase, CheckCircle2, MessageCircle, Send, ShieldCheck, Loader2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { getAttribution } from "@/lib/attribution";
import { Link } from "react-router-dom";
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

const PROGRAM_BY_INTEREST: Record<string, string> = {
  "Basic Security Training": "Basic Warrior",
  "Elite Security Track": "Elite Security Track",
  "VIP Protection": "VIP Fast Track",
  "Tactical Fitness Coaching": "Tactical Fitness Coaching",
  "Not sure yet": "Unassigned",
};

const CY_FARM_POSITIONS = ["Graduate Veterinary Officer","Graduate Animal Husbandry / Livestock Production Officer","Graduate Farm Management / Agricultural Management Officer","Farm Assistant / Labourer"];
const CY_FARM_UNITS = ["Cattle","Goat","Pig","Palm","General Farm Operations","Management / Administration","Maintenance / Support"];

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  location: z.string().trim().min(2, "Enter your city").max(80),
  age_range: z.string().min(2, "Select your age range"),
  application_track: z.enum(["Security", "CY Farm Operations"]),
  profession: z.string().trim().min(2, "Enter your current profession").max(80),
  security_experience: z.string().min(2, "Select your security experience"),
  training_interest: z.string().min(2, "Select a training interest"),
  fitness_level: z.string().min(2, "Select your fitness level"),
  farm_position: z.string().trim(),
  farm_unit: z.string().trim(),
  farm_qualification: z.string().trim().max(160),
  farm_experience_years: z.string().trim().max(30),
  farm_experience: z.string().trim().max(1200),
  farm_availability: z.string().trim().max(80),
  farm_salary_expectation: z.string().trim().max(80),
}).superRefine((d, ctx) => {
  if (d.application_track === "CY Farm Operations") {
    if (!d.farm_position) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["farm_position"], message: "Select the CY Farm position" });
    if (!d.farm_unit) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["farm_unit"], message: "Select the preferred farm unit" });
    if (!d.farm_qualification) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["farm_qualification"], message: "Enter your qualification" });
    if (!d.farm_experience) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["farm_experience"], message: "Describe your practical farm experience" });
    if (!d.farm_availability) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["farm_availability"], message: "Enter your availability" });
  }
});

export const Recruitment = ({ asH1 = false }: { asH1?: boolean } = {}) => {
  const Heading = asH1 ? "h1" : "h2";
  const [busy, setBusy] = useState(false);
  const [applicationTrack, setApplicationTrack] = useState<"Security" | "CY Farm Operations">("Security");
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
    const program = d.application_track === "CY Farm Operations" ? `CY Farm Operations — ${d.farm_position}` : (PROGRAM_BY_INTEREST[d.training_interest] ?? d.training_interest);
    setBusy(true);
    const { data: application, error } = await supabase.from("applications").insert({
      full_name: d.full_name,
      email: d.email,
      phone: d.phone,
      location: d.location,
      age: AGE_RANGES[d.age_range] ?? 21,
      education: d.profession,
      fitness_level: d.fitness_level,
      prior_experience: d.application_track === "CY Farm Operations" ? d.farm_experience : d.security_experience,
      program,
      source: d.application_track === "CY Farm Operations" ? "cy-nwankwo-farm-recruitment" : "martial-x-web",
      campaign: d.application_track === "CY Farm Operations" ? "CY-NWANKWO-FARM-OPERATIONS" : null,
      notes: JSON.stringify({
        application_track: d.application_track,
        age_range: d.age_range,
        profession: d.profession,
        security_experience: d.security_experience,
        training_interest: d.training_interest,
        ...(d.application_track === "CY Farm Operations" ? { farm_position: d.farm_position, farm_unit: d.farm_unit, farm_qualification: d.farm_qualification, farm_experience_years: d.farm_experience_years, farm_experience: d.farm_experience, farm_availability: d.farm_availability, farm_salary_expectation: d.farm_salary_expectation } : {}),
        attribution,
      }),
      user_id: user?.id ?? null,
    }).select("id,reference_number").single();
    setBusy(false);
    if (error) return toast.error(error.message);

    // Persist the application as a canonical onboarding event. The event is
    // idempotent by application ID; delivery remains disabled until the
    // verified Meta/WhatsApp adapter is configured in production.
    const { error: eventError } = await supabase.functions.invoke("resofit-event-ingest", {
      body: {
        event_name: "application.submitted",
        contract_version: "1.0",
        source_system: "redzone-recruit",
        idempotency_key: `application.submitted:${application.id}`,
        rsid: null,
        user_id: user?.id ?? null,
        payload: {
          application_id: application.id,
          application_reference: application.reference_number,
          full_name: d.full_name,
          phone: d.phone,
          email: d.email,
          programme: program,
          training_interest: d.training_interest,
          application_track: d.application_track,
          location: d.location,
          source: d.application_track === "CY Farm Operations" ? "cy-nwankwo-farm-recruitment" : "martial-x-web",
          farm_position: d.application_track === "CY Farm Operations" ? d.farm_position : null,
          farm_unit: d.application_track === "CY Farm Operations" ? d.farm_unit : null,
        },
        adapters: ["martial-whatsapp"],
      },
    });
    if (eventError) console.error("[application.submitted] event failed", eventError);

    track("application_submit", {
      location: d.location,
      training_interest: d.training_interest,
      program,
      experience: d.application_track === "CY Farm Operations" ? d.farm_experience_years : d.security_experience,
      ...attribution,
    });
    toast.success("Application received", {
      description: d.application_track === "CY Farm Operations" ? "Your CY Farm application has been received for verification." : "Admissions will reach you on WhatsApp within 24 hours.",
    });
    form.reset();
    setTimeout(() => {
      window.open(
        waLink(d.application_track === "CY Farm Operations" ? `Hi CY Farm Recruitment, I just submitted a farm application (${d.full_name}, ${d.location} — ${d.farm_position}). Please confirm next steps.` : `Hi Martial X Admissions, I just submitted an application (${d.full_name}, ${d.location} — ${d.training_interest}). Please onboard me.`),
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
            <Heading className="font-display text-3xl md:text-5xl font-bold leading-tight">
              Apply once. <span className="text-gradient-gold">Get deployed</span> for life.
            </Heading>
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
              <div>
                <Label htmlFor="application_track">Application Track</Label>
                <select id="application_track" name="application_track" required value={applicationTrack} onChange={(e) => setApplicationTrack(e.target.value as "Security" | "CY Farm Operations")} className={selectCls}>
                  <option value="Security">Security / Martial X</option>
                  <option value="CY Farm Operations">CY Farm Operations</option>
                </select>
              </div>

              {applicationTrack === "CY Farm Operations" && (
                <div className="rounded-2xl border border-gold/20 bg-gold/[.04] p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gold"><Sprout className="h-4 w-4" /> CY Farm Application Details</div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label htmlFor="farm_position">Position</Label><select id="farm_position" name="farm_position" required className={selectCls} defaultValue=""><option value="">Select position…</option>{CY_FARM_POSITIONS.map((p) => <option key={p}>{p}</option>)}</select></div>
                    <div><Label htmlFor="farm_unit">Preferred Farm Unit</Label><select id="farm_unit" name="farm_unit" required className={selectCls} defaultValue=""><option value="">Select unit…</option>{CY_FARM_UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label htmlFor="farm_qualification">Qualification</Label><Input id="farm_qualification" name="farm_qualification" maxLength={160} placeholder="B.Sc / DVM / HND / experience..." /></div>
                    <div><Label htmlFor="farm_experience_years">Relevant Farm Experience</Label><Input id="farm_experience_years" name="farm_experience_years" maxLength={30} placeholder="Fresh graduate / 3 years..." /></div>
                  </div>
                  <div><Label htmlFor="farm_experience">Practical Farm / Livestock Experience</Label><textarea id="farm_experience" name="farm_experience" maxLength={1200} rows={4} placeholder="Describe relevant livestock, crop, plantation, farm management or labour experience." className="mt-1.5 flex w-full rounded-md border border-input bg-input px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label htmlFor="farm_availability">Availability</Label><Input id="farm_availability" name="farm_availability" maxLength={80} placeholder="Immediate / 2 weeks / specific date" /></div>
                    <div><Label htmlFor="farm_salary_expectation">Salary Expectation</Label><Input id="farm_salary_expectation" name="farm_salary_expectation" maxLength={80} placeholder="Optional — state expectation" /></div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Farm applications remain subject to workforce-gap confirmation, verification and CY interview/consideration.</p>
                </div>
              )}

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
                By applying you agree to the{" "}
                <Link to="/legal/candidate-terms" className="text-gold underline underline-offset-2">Candidate Terms</Link>,{" "}
                <Link to="/legal/recruitment-policy" className="text-gold underline underline-offset-2">Recruitment Policy</Link> and{" "}
                <Link to="/legal/privacy-policy" className="text-gold underline underline-offset-2">Privacy Policy</Link>,
                including RedZone Security's vetting and licensing checks.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
