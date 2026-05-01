import { Quote, Star } from "lucide-react";

const stories = [
  {
    name: "Ibrahim Musa",
    role: "Now: Estate Guard, Lekki",
    text: "I came in unfit and broke. Twelve weeks later I had a uniform, an ID, and ₦120k monthly. Martial X is the real deal.",
  },
  {
    name: "Chinedu Okafor",
    role: "Now: Close Protection, Abuja",
    text: "The discipline they teach goes beyond fitness. RedZone placed me with a top firm in two weeks after graduation.",
  },
  {
    name: "Halima Yusuf",
    role: "Now: Corporate Security, VI",
    text: "First female in my batch. They held the standard high and pushed me to clear it. Forever grateful.",
  },
];

export const Testimonials = () => (
  <section id="testimonials" className="relative py-24 md:py-32">
    <div className="container">
      <div className="max-w-2xl mb-16">
        <div className="inline-block glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
          04 — Success Stories
        </div>
        <h2 className="font-display text-4xl md:text-6xl font-bold leading-tight">
          Real recruits. <span className="text-gradient-red">Real deployments</span>.
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {stories.map((s, i) => (
          <article
            key={s.name}
            className="glass rounded-2xl p-7 hover-lift relative"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <Quote className="h-8 w-8 text-primary/40 mb-4" />
            <p className="text-foreground/90 leading-relaxed">"{s.text}"</p>
            <div className="mt-6 pt-5 border-t border-border/50 flex items-center justify-between">
              <div>
                <div className="font-display font-bold">{s.name}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {s.role}
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-gold text-gold" />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Social embeds placeholder */}
      <div className="mt-16 grid md:grid-cols-2 gap-5">
        {["TikTok Reel Embed", "Instagram Reel Embed"].map((label) => (
          <div
            key={label}
            className="glass aspect-video rounded-2xl flex items-center justify-center text-muted-foreground"
          >
            <div className="text-center">
              <div className="font-tactical text-2xl text-gradient-gold">{label}</div>
              <div className="text-xs uppercase tracking-widest mt-2">Placeholder</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
