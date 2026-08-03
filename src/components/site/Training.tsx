import { Crown, Handshake, Radio, Shield, Siren, Swords } from "lucide-react";

const programs = [
  { icon: Shield, title: "Basic Security Training", desc: "Guarding doctrine, access control, patrol discipline and reporting fundamentals." },
  { icon: Swords, title: "Elite Security Track", desc: "Advanced defensive tactics, threat assessment and recruitment-ready certification." },
  { icon: Crown, title: "VIP Protection", desc: "Close protection craft: advance work, formations, embus/debus and route planning." },
  { icon: Radio, title: "Tactical Communication", desc: "Radio procedure, incident escalation, command handover and clear field reporting." },
  { icon: Siren, title: "Emergency Response", desc: "First aid, fire response, evacuation control and crisis decision-making under pressure." },
  { icon: Handshake, title: "Conflict Management", desc: "De-escalation, lawful use of force, crowd handling and professional conduct." },
];

export const Training = () => (
  <section id="training" className="relative py-24 md:py-32">
    <div className="container">
      <div className="max-w-3xl mb-16">
        <div className="inline-block glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
          Training Academy
        </div>
        <h2 className="font-display text-4xl md:text-6xl font-bold leading-tight">
          Six programs that <span className="text-gradient-red">forge professionals</span>.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          From first-day guarding fundamentals to executive protection. Every program is
          certified, assessed and mapped to a paid deployment pathway.
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
