import { Dumbbell, Flame, Swords, Target, Timer, Trophy } from "lucide-react";

const programs = [
  { icon: Flame, title: "Combat Conditioning", desc: "High-intensity striking, grappling and tactical cardio built for real-world stamina." },
  { icon: Swords, title: "Martial Discipline", desc: "Boxing, MMA fundamentals, defensive tactics and edged-weapon awareness." },
  { icon: Target, title: "Tactical Drills", desc: "Patrol movement, perimeter control, hostile de-escalation and response timing." },
  { icon: Dumbbell, title: "Strength Forge", desc: "Functional strength, calisthenics and load-bearing endurance." },
  { icon: Timer, title: "Speed & Reflex", desc: "Reaction training, situational awareness, scenario-based decisioning." },
  { icon: Trophy, title: "Certification", desc: "Issued completion certificate recognized across our deployment partners." },
];

export const Training = () => (
  <section id="training" className="relative py-24 md:py-32">
    <div className="container">
      <div className="max-w-3xl mb-16">
        <div className="inline-block glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
          01 — Martial X Academy
        </div>
        <h2 className="font-display text-4xl md:text-6xl font-bold leading-tight">
          Combat fitness designed to <span className="text-gradient-red">forge professionals</span>.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          Six progressive disciplines. One operator-grade outcome. Whether you're chasing
          a security contract or a stronger version of yourself, every drop of sweat compounds.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {programs.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="group relative glass rounded-2xl p-7 hover-lift overflow-hidden"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/15 blur-3xl group-hover:bg-primary/30 transition-colors" />
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-gradient-red flex items-center justify-center shadow-red mb-5">
                <Icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-widest text-gold/80">
                <span className="h-px w-8 bg-gold/40" />
                Module {String(i + 1).padStart(2, "0")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
