import { Copy, Gift, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Referral = () => {
  const code = "WARRIOR-X9F2";
  return (
    <section className="relative py-24">
      <div className="container">
        <div className="relative glass-strong rounded-3xl overflow-hidden p-8 md:p-14">
          <div className="absolute -top-32 -right-20 w-96 h-96 rounded-full bg-primary/30 blur-[120px]" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gold/20 blur-[120px]" />

          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
                <Gift className="h-3.5 w-3.5" /> Referral & Rewards
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
                Recruit a brother. <span className="text-gradient-gold">Earn ₦2,500</span>.
              </h2>
              <p className="mt-4 text-muted-foreground max-w-md">
                Every paid signup through your code earns instant rewards. Top recruiters
                get free VIP upgrades and dedicated deployment slots.
              </p>
              <div className="mt-6 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 text-gold" /> 1,200+ active recruiters
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Your code</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="font-tactical text-3xl md:text-4xl text-gradient-gold tracking-wider">
                  {code}
                </span>
                <Button
                  variant="tactical"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    toast.success("Code copied to clipboard");
                  }}
                >
                  <Copy className="h-4 w-4" /> Copy
                </Button>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { v: "₦2.5k", l: "per referral" },
                  { v: "10%", l: "tier bonus" },
                  { v: "VIP", l: "milestone" },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl bg-secondary/50 p-3">
                    <div className="font-tactical text-xl text-gold">{s.v}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
