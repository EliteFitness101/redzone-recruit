import { Award, Briefcase, GraduationCap, Route, ShieldCheck, Users } from "lucide-react";

const reasons = [
  { icon: GraduationCap, title: "Structured Curriculum", desc: "Progressive modules covering security doctrine, tactical fitness and protection craft." },
  { icon: Award, title: "Recognised Certification", desc: "Digital certificate issued on completion and accepted across our partner firm network." },
  { icon: Route, title: "Clear Career Pathway", desc: "Guard → Supervisor → Close Protection Officer, with salary bands mapped at every stage." },
  { icon: Briefcase, title: "Employer Pipeline", desc: "36 licensed firms hire directly from our graduating cohorts every quarter." },
  { icon: ShieldCheck, title: "Compliance First", desc: "Vetting, documentation and licensing handled to Nigerian private-security standards." },
  { icon: Users, title: "Cohort Accountability", desc: "Small city cohorts, real instructors, and a community that keeps you training." },
];

export const WhyMartialX = () => (
  <section id="why" className="relative py-20 md:py-28">
    <div className="container">
      <div className="max-w-3xl mb-12">
        <div className="inline-block glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
          Why Martial X™
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
          Not a gym. A <span className="text-gradient-gold">career system</span>.
        </h2>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Every module is built backwards from what licensed security employers actually hire for.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {reasons.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass rounded-2xl p-6 hover-lift">
            <Icon className="h-6 w-6 text-gold mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
