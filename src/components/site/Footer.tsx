import { Link } from "react-router-dom";
import { Instagram, MessageCircle, Send, Shield, Music2 } from "lucide-react";
import { CONTACT, waLink, tgLink } from "@/config/site";
import { track } from "@/lib/analytics";

const socials = [
  { Icon: Instagram, label: "Instagram", href: CONTACT.instagram, event: "cta_click" as const },
  { Icon: Music2, label: "TikTok", href: CONTACT.tiktok, event: "cta_click" as const },
  { Icon: Send, label: "Telegram", href: tgLink(), event: "telegram_click" as const },
  { Icon: MessageCircle, label: "WhatsApp", href: waLink("Hi Martial X!"), event: "whatsapp_click" as const },
];

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
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">× RedZone Security</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Combat fitness, tactical discipline and licensed security recruitment.
            Nigeria's pipeline from training mat to professional deployment.
          </p>
          <div className="flex items-center gap-3 mt-6">
            {socials.map(({ Icon, label, href, event }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                onClick={() => track(event, { source: "footer" })}
                className="h-10 w-10 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display font-bold uppercase tracking-widest text-sm mb-4">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/academy" className="hover:text-gold">Training Academy</Link></li>
            <li><Link to="/apply" className="hover:text-gold">Recruitment Portal</Link></li>
            <li><Link to="/pricing" className="hover:text-gold">Pricing</Link></li>
            <li><Link to="/dashboard" className="hover:text-gold">Dashboard</Link></li>
            <li><Link to="/referrals" className="hover:text-gold">Referrals</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold uppercase tracking-widest text-sm mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/legal/terms-and-conditions" className="hover:text-gold">Terms &amp; Conditions</Link></li>
            <li><Link to="/legal/privacy-policy" className="hover:text-gold">Privacy Policy</Link></li>
            <li><Link to="/legal/recruitment-policy" className="hover:text-gold">Recruitment Policy</Link></li>
            <li><Link to="/legal/refund-policy" className="hover:text-gold">Refund Policy</Link></li>
            <li><Link to="/legal/cookie-policy" className="hover:text-gold">Cookie Policy</Link></li>
            <li><Link to="/legal/safeguarding" className="hover:text-gold">Safeguarding</Link></li>
            <li><Link to="/legal/certificate-verification" className="hover:text-gold">Certificate Verification</Link></li>
            <li><Link to="/legal" className="hover:text-gold">All Policies</Link></li>
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
