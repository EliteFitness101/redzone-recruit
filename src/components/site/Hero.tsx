import { ArrowRight, Send, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-warrior.jpg";
import { tgLink } from "@/config/site";
import { track } from "@/lib/analytics";

export const Hero = () => {
  return (
    <section id="top" className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 grid-tactical opacity-40" />
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen"
        style={{ backgroundImage: `url(${heroImg})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Floating glows */}
      <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-primary/30 blur-[140px] animate-float" />
      <div className="absolute bottom-0 -left-32 w-[420px] h-[420px] rounded-full bg-gold/15 blur-[140px] animate-float" />

      <div className="container relative z-10">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Now Recruiting · Lagos · Abuja · PH
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight animate-fade-in">
            Train Like A <span className="text-gradient-red">Warrior</span>.
            <br />
            Get Paid Like A <span className="text-gradient-gold">Professional</span>.
          </h1>

          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-fade-in [animation-delay:120ms]">
            Nigeria's premier combat fitness academy and licensed security recruitment
            pipeline. Build elite discipline. Earn certified deployment. Get placed.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 animate-fade-in [animation-delay:240ms]">
            <Button variant="hero" size="xl" asChild>
              <Link to="/pricing" onClick={() => track("cta_click", { source: "hero_train" })}>
                Start Training <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button variant="gold" size="xl" asChild>
              <Link to="/apply" onClick={() => track("cta_click", { source: "hero_apply" })}>
                <Shield /> Apply for Security Jobs
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <a href={tgLink()} target="_blank" rel="noopener noreferrer"
                onClick={() => track("telegram_click", { source: "hero" })}>
                <Send /> Join Telegram
              </a>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in [animation-delay:360ms]">
            {[
              { v: "2,400+", l: "Recruits Trained" },
              { v: "850+", l: "Guards Deployed" },
              { v: "36", l: "Partner Firms" },
              { v: "4.9★", l: "Trainee Rating" },
            ].map((s) => (
              <div key={s.l} className="glass rounded-xl px-5 py-4">
                <div className="font-tactical text-3xl md:text-4xl text-gradient-gold">
                  {s.v}
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-muted-foreground animate-float">
        <Sparkles className="h-4 w-4 text-gold" />
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
      </div>
    </section>
  );
};
