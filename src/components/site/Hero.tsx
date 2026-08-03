import { ArrowRight, MessageCircle, ShieldCheck, BadgeCheck, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-warrior.jpg";
import { waLink } from "@/config/site";
import { track } from "@/lib/analytics";

const badges = [
  { icon: ShieldCheck, label: "Licensed Partner Firms" },
  { icon: BadgeCheck, label: "Certified Curriculum" },
  { icon: Users, label: "850+ Deployed" },
];

export const Hero = () => {
  return (
    <section id="top" className="relative min-h-[92vh] flex items-center pt-28 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 grid-tactical opacity-40" />
      <img
        src={heroImg}
        alt="Martial X security and tactical fitness recruit in training"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-screen"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-primary/30 blur-[140px] animate-float" />
      <div className="absolute bottom-0 -left-32 w-[420px] h-[420px] rounded-full bg-gold/15 blur-[140px] animate-float" />

      <div className="container relative z-10">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Martial X™ · Powered by ResoFit™
            </span>
          </div>

          <h1 className="font-display text-[2.6rem] leading-[1.02] md:text-7xl lg:text-8xl font-bold tracking-tight animate-fade-in">
            Become <span className="text-gradient-gold">Elite</span>.
            <br />
            Train. Certify. <span className="text-gradient-red">Deploy</span>.
          </h1>

          <p className="mt-6 text-base md:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-fade-in [animation-delay:120ms]">
            Join Martial X™ — Nigeria's next generation security, tactical fitness and
            executive protection training platform powered by ResoFit™.
          </p>

          {/* Urgency / cohort */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 animate-fade-in [animation-delay:180ms]">
            <Clock className="h-4 w-4 text-gold shrink-0" />
            <span className="text-xs md:text-sm text-foreground/90">
              <strong className="text-gold">Cohort intake open</strong> — limited to 40 recruits per city (Lagos · Abuja · PH)
            </span>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in [animation-delay:240ms]">
            <Button variant="hero" size="xl" className="w-full sm:w-auto" asChild>
              <Link to="/apply" onClick={() => track("application_start", { source: "hero" })}>
                Apply For Recruitment <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button variant="gold" size="xl" className="w-full sm:w-auto" asChild>
              <a
                href={waLink("Hi Martial X Admissions, I'd like to know more about the security training and recruitment programs.")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp_click", { source: "hero_admissions" })}
              >
                <MessageCircle /> Chat With Admissions
              </a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 animate-fade-in [animation-delay:300ms]">
            {badges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Icon className="h-4 w-4 text-gold" />
                {label}
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-fade-in [animation-delay:360ms]">
            {[
              { v: "2,400+", l: "Recruits Trained" },
              { v: "850+", l: "Guards Deployed" },
              { v: "36", l: "Partner Firms" },
              { v: "4.9★", l: "Trainee Rating" },
            ].map((s) => (
              <div key={s.l} className="glass rounded-xl px-4 py-3 md:px-5 md:py-4">
                <div className="font-tactical text-2xl md:text-4xl text-gradient-gold">{s.v}</div>
                <div className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
