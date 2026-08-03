import { Briefcase, Dumbbell, Medal, Rocket } from "lucide-react";

const audience = [
  { icon: Briefcase, title: "Security Professionals", desc: "Working guards and supervisors who want certification, better firms and higher pay." },
  { icon: Dumbbell, title: "Fitness Professionals", desc: "Coaches and trainers adding tactical conditioning and protection work to their income." },
  { icon: Medal, title: "Military & Police Background", desc: "Ex-service applicants converting field experience into licensed private-sector roles." },
  { icon: Rocket, title: "Young Professionals", desc: "18–45, disciplined and coachable, looking for a real career path with structure." },
];

export const WhoShouldApply = () => (
  <section id="who" className="relative py-20 md:py-28">
    <div className="container">
      <div className="max-w-3xl mb-12">
        <div className="inline-block glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
          Who Should Apply
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
          Built for people who <span className="text-gradient-gold">show up</span>.
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {audience.map(({ icon: Icon, title, desc }) => (
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
