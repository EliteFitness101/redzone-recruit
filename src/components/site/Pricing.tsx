import { Check, Crown, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const tiers = [
  {
    id: "basic",
    name: "Basic Warrior",
    price: "₦1,000",
    icon: Shield,
    desc: "Foundation combat fitness & discipline.",
    features: ["4-week core program", "Basic combat conditioning", "Telegram community access", "Digital workbook"],
    cta: "Start Basic",
    variant: "glass" as const,
  },
  {
    id: "elite",
    name: "Elite Security Track",
    price: "₦10,000",
    icon: Zap,
    desc: "Full recruitment-ready track with placement priority.",
    features: ["12-week elite program", "Tactical & defensive modules", "RedZone vetting fast pass", "Certificate of completion", "Priority job placement"],
    cta: "Go Elite",
    variant: "hero" as const,
    featured: true,
  },
  {
    id: "vip",
    name: "VIP Fast Track",
    price: "₦30,000",
    icon: Crown,
    desc: "1-on-1 coaching, accelerated deployment.",
    features: ["6-week intensive", "Personal coach & mentor", "Close-protection module", "Guaranteed deployment interview", "Lifetime alumni network"],
    cta: "Claim VIP",
    variant: "gold" as const,
  },
];

export const Pricing = ({ asH1 = false }: { asH1?: boolean } = {}) => {
  const Heading = asH1 ? "h1" : "h2";
  return (
  <section id="pricing" className="relative py-24 md:py-32">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-block glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
          03 — Training Tiers
        </div>
        <Heading className="font-display text-4xl md:text-6xl font-bold leading-tight">
          Pick your <span className="text-gradient-red">arena</span>.
        </Heading>
        <p className="mt-5 text-lg text-muted-foreground">
          Secure payments via Paystack. Lifetime course access. No hidden fees.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={cn(
              "relative rounded-3xl p-8 hover-lift",
              t.featured ? "glass-strong border-gold/40 shadow-gold" : "glass",
            )}
          >
            {t.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-gold text-accent-foreground text-[10px] uppercase tracking-[0.25em] font-bold px-4 py-1.5 rounded-full shadow-gold">
                Most Popular
              </div>
            )}
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-5", t.featured ? "bg-gradient-gold shadow-gold" : "bg-gradient-red shadow-red")}>
              <t.icon className={cn("h-6 w-6", t.featured ? "text-accent-foreground" : "text-primary-foreground")} />
            </div>
            <h3 className="font-display text-2xl font-bold">{t.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-tactical text-5xl text-gradient-gold">{t.price}</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">/ program</span>
            </div>
            <ul className="mt-6 space-y-3">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button variant={t.variant} size="lg" className="w-full mt-8" asChild>
              <Link to={`/checkout?tier=${t.id}`} onClick={() => track("cta_click", { source: `pricing_${t.id}` })}>
                {t.cta}
              </Link>
            </Button>
          </div>
        ))}
      </div>

      {/* Trust badges */}
      <div className="mt-10 flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground uppercase tracking-widest">
        <span className="glass rounded-full px-4 py-1.5">🔒 Secure Paystack</span>
        <span className="glass rounded-full px-4 py-1.5">✓ Licensed Recruiter</span>
        <span className="glass rounded-full px-4 py-1.5">₦ NGN Only</span>
        <span className="glass rounded-full px-4 py-1.5">📱 Mobile Optimized</span>
      </div>
    </div>
  </section>
);
