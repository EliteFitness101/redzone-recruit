import { useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Send, Sprout, Stethoscope, Tractor, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { getAttribution } from "@/lib/attribution";
import { submitRecruitmentApplication } from "@/lib/recruitmentApi";
import { Link } from "react-router-dom";

const POSITIONS = [
  { id: "veterinary", label: "Graduate Veterinary Officer", icon: Stethoscope },
  { id: "animal_science", label: "Graduate Animal Husbandry / Livestock Production Officer", icon: Sprout },
  { id: "farm_management", label: "Graduate Farm Management / Agricultural Management Officer", icon: Tractor },
  { id: "assistant", label: "Farm Assistant / Labourer", icon: Users },
] as const;

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255).or(z.literal("")),
  phone: z.string().trim().min(7, "Enter a valid phone/WhatsApp number").max(30),
  location: z.string().trim().min(2, "Enter your current location").max(100),
  position: z.string().min(2, "Select a position"),
  qualification: z.string().trim().max(160),
  institution: z.string().trim().max(160),
  registration: z.string().trim().max(160),
  graduation_year: z.string().trim().max(4),
  experience_years: z.string().trim().max(30),
  farm_experience: z.string().trim().min(10, "Briefly describe your practical farm/livestock experience").max(1200),
  field_ready: z.literal("yes", { errorMap: () => ({ message: "Confirm that you are willing to work on-site" }) }),
  consent: z.literal("yes", { errorMap: () => ({ message: "Confirm the application declaration" }) }),
}).superRefine((d, ctx) => {
  const professional = d.position !== "Farm Assistant / Labourer";
  if (professional && !d.qualification) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["qualification"], message: "Enter your qualification" });
  if (professional && !d.institution) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["institution"], message: "Enter your institution" });
  if (professional && !d.experience_years) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["experience_years"], message: "Enter your relevant experience" });
});

export const FarmRecruitment = ({ asH1 = false }: { asH1?: boolean } = {}) => {
  const Heading = asH1 ? "h1" : "h2";
  const [busy, setBusy] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const { user } = useAuth();
  const started = useRef(false);

  const onFirstInput = () => {
    if (started.current) return;
    started.current = true;
    track("application_start", { source: "cy-nwankwo-farm-recruitment" });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your application");
      return;
    }
    const d = parsed.data;
    setBusy(true);
    const attribution = getAttribution();

    const notes = [
      "RECRUITMENT: CY NWANKWO FARM OPERATIONS",
      "POSITION: " + d.position,
      "INSTITUTION: " + d.institution,
      "GRADUATION YEAR: " + (d.graduation_year || "Not provided"),
      "PROFESSIONAL REGISTRATION: " + (d.registration || "Not provided"),
      "EXPERIENCE: " + d.experience_years,
      "PRACTICAL FARM EXPERIENCE: " + d.farm_experience,
      "ON-SITE: Yes",
      "ATTRIBUTION: " + JSON.stringify(attribution),
    ].join("\n");

    let application: { id: string; reference_number: string | null };
    try {
      const result = await submitRecruitmentApplication({
        full_name: d.full_name,
        email: d.email,
        phone: d.phone,
        location: d.location,
        education: d.qualification,
        prior_experience: d.farm_experience,
        program: d.position,
        source: "cy-nwankwo-farm-recruitment",
        campaign: "CY-NWANKWO-FARM-OPERATIONS",
        attribution: attribution as never,
        notes,
        user_id: user?.id ?? null,
      });
      application = result.application;
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "We could not submit your application. Please try again.");
      console.error("[farm-application]", error);
      return;
    }

    setBusy(false);
    if (error) {
      toast.error("We could not submit your application. Please try again.");
      console.error("[farm-application]", error);
      return;
    }

    const reference = application.reference_number || application.id;
    track("application_submit", {
      source: "cy-nwankwo-farm-recruitment",
      position: d.position,
      location: d.location,
      application_reference: reference,
    });

    toast.success("Application received", {
      description: "Your application reference is " + reference,
    });
    form.reset();

  };

  const selectCls = "mt-1.5 flex h-11 w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <section id="farm-recruitment" className="relative py-16 md:py-24">
      <div className="absolute inset-0 bg-gradient-tactical opacity-40" />
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-5 text-xs uppercase tracking-[0.2em] text-gold">
              <Sprout className="h-4 w-4" /> Immediate Farm Recruitment
            </div>
            <Heading className="font-display text-3xl md:text-5xl font-bold leading-tight">
              Build a <span className="text-gradient-gold">professional farm team.</span>
            </Heading>
            <p className="mt-5 text-muted-foreground md:text-lg max-w-xl">
              CY Nwankwo Farm Operations is recruiting a seven-person team for cattle, goat and palm plantation operations at Ahiaba Ubi Autonomous Community, Isiala Ngwa North, Abia State.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-3">
              {POSITIONS.map(({ id, label, icon: Icon }) => (
                <div key={id} className="glass rounded-2xl p-4 flex gap-3 items-start">
                  <Icon className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{id === "assistant" ? "4 vacancies" : "1 vacancy"}</p>
                  </div>
                </div>
              ))}
            </div>

            <ul className="mt-8 space-y-3">
              {["Hands-on field work", "Structured records and reporting", "Cattle, goat and palm operations", "Interview and practical assessment for shortlisted applicants"].map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button variant="gold" size="lg" asChild>
                <a href="mailto:recruit@resofit.fit" onClick={() => track("email_click", { source: "farm-recruitment_primary" })}>
                  <Send /> Email Recruitment
                </a>
              </Button>
              <Button variant="tactical" size="lg" asChild>
                <a href="mailto:recruit@resofit.fit" onClick={() => track("email_click", { source: "farm-recruitment_secondary" })}>
                  recruit@resofit.fit
                </a>
              </Button>
            </div>

            <div className="mt-8 glass rounded-2xl p-5">
              <p className="text-sm font-semibold">Application checklist</p>
              <p className="text-sm text-muted-foreground mt-2">
                Have your CV ready for follow-up. Graduate applicants should provide qualification and professional registration details where applicable. Credentials and references may be verified.
              </p>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-5 md:p-8 shadow-glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-xl bg-gradient-red flex items-center justify-center shadow-red">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Start Your Application</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Farm recruitment • Ahiaba Ubi</p>
              </div>
            </div>

            <form onSubmit={onSubmit} onInput={onFirstInput} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" required maxLength={100} placeholder="Full name" autoComplete="name" className="mt-1.5" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" maxLength={255} placeholder="you@email.com" autoComplete="email" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone / WhatsApp</Label>
                  <Input id="phone" name="phone" type="tel" required maxLength={30} placeholder="+234..." autoComplete="tel" className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Current Location / Community</Label>
                <Input id="location" name="location" required maxLength={100} placeholder="Aba / Umuahia / Ahiaba Ubi..." />
              </div>

              <div>
                <Label htmlFor="position">Position Applied For</Label>
                <select id="position" name="position" required value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)} className={selectCls}>
                  <option value="">Select a position…</option>
                  {POSITIONS.map(({ id, label }) => <option key={id} value={label}>{label}</option>)}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="qualification">Highest Qualification {selectedPosition !== "Farm Assistant / Labourer" && <span className="text-gold">*</span>}</Label>
                  <Input id="qualification" name="qualification" required={selectedPosition !== "Farm Assistant / Labourer"} maxLength={160} placeholder="B.Sc / B.Agric / DVM / HND..." />
                </div>
                <div>
                  <Label htmlFor="institution">Institution {selectedPosition !== "Farm Assistant / Labourer" && <span className="text-gold">*</span>}</Label>
                  <Input id="institution" name="institution" required={selectedPosition !== "Farm Assistant / Labourer"} maxLength={160} placeholder="University / Polytechnic..." />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="graduation_year">Graduation Year</Label>
                  <Input id="graduation_year" name="graduation_year" inputMode="numeric" maxLength={4} placeholder="2024" />
                </div>
                <div>
                  <Label htmlFor="experience_years">Relevant Experience {selectedPosition !== "Farm Assistant / Labourer" && <span className="text-gold">*</span>}</Label>
                  <Input id="experience_years" name="experience_years" required={selectedPosition !== "Farm Assistant / Labourer"} maxLength={30} placeholder="Fresh graduate / 2 years..." />
                </div>
              </div>

              {selectedPosition !== "Farm Assistant / Labourer" && (
                <div>
                  <Label htmlFor="registration">Professional Registration / Licence <span className="text-muted-foreground">(if applicable)</span></Label>
                  <Input id="registration" name="registration" maxLength={160} placeholder="Professional body / registration number" />
                </div>
              )}

              <div>
                <Label htmlFor="farm_experience">Practical Farm / Livestock Experience</Label>
                <textarea id="farm_experience" name="farm_experience" required maxLength={1200} rows={5} placeholder="Briefly describe your practical experience with livestock, crops, plantations, farm management or farm labour." className="mt-1.5 flex w-full rounded-md border border-input bg-input px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <label className="flex gap-3 items-start text-sm">
                <input type="checkbox" name="field_ready" value="yes" required className="mt-1 h-4 w-4" />
                <span>I am willing to work on-site at Ahiaba Ubi Autonomous Community, Isiala Ngwa North, Abia State.</span>
              </label>

              <label className="flex gap-3 items-start text-sm">
                <input type="checkbox" name="consent" value="yes" required className="mt-1 h-4 w-4" />
                <span>I confirm that the information submitted is accurate and understand that qualifications, professional credentials and references may be verified.</span>
              </label>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : "Submit Farm Application"}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                By applying, you agree to the applicable recruitment and privacy terms. See <Link to="/legal/privacy-policy" className="text-gold underline underline-offset-2">Privacy Policy</Link>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
