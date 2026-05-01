import { Instagram, MessageCircle, Send, Shield, Music2 } from "lucide-react";

export const Footer = () => (
  <footer className="relative border-t border-border/50 mt-10">
    <div className="container py-16">
      <div className="grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-red flex items-center justify-center shadow-red">
              <Shield className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display font-bold tracking-wider">
                MARTIAL <span className="text-gradient-gold">X</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                × RedZone Security
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Combat fitness, tactical discipline and licensed security recruitment.
            Nigeria's pipeline from training mat to professional deployment.
          </p>
          <div className="flex items-center gap-3 mt-6">
            {[
              { Icon: Instagram, label: "Instagram" },
              { Icon: Music2, label: "TikTok" },
              { Icon: Send, label: "Telegram" },
              { Icon: MessageCircle, label: "WhatsApp" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="h-10 w-10 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display font-bold uppercase tracking-widest text-sm mb-4">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#training" className="hover:text-gold">Training Academy</a></li>
            <li><a href="#recruitment" className="hover:text-gold">Recruitment Portal</a></li>
            <li><a href="#pricing" className="hover:text-gold">Pricing</a></li>
            <li><a href="#" className="hover:text-gold">Admin Dashboard</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold uppercase tracking-widest text-sm mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-gold">Terms of Service</a></li>
            <li><a href="#" className="hover:text-gold">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-gold">Recruitment Policy</a></li>
            <li><a href="#" className="hover:text-gold">Refund Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-border/50 flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Martial X × RedZone Security. All rights reserved.</p>
        <p className="uppercase tracking-widest">resofit.fit/martial-x</p>
      </div>
    </div>
  </footer>
);
