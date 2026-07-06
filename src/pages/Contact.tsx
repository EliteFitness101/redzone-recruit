import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { CONTACT, waLink, tgLink } from "@/config/site";
import { Mail, Phone, MessageCircle, Send } from "lucide-react";
import { track } from "@/lib/analytics";

export default function Contact() {
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Contact" path="/contact" description="Reach Martial X × RedZone Security via WhatsApp, Telegram, phone or email." />
      <Navbar />
      <main className="pt-28 pb-24 container max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Talk to us.</h1>
        <p className="text-muted-foreground mb-10">Fastest response on WhatsApp. Recruitment questions welcome.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Channel icon={MessageCircle} label="WhatsApp" href={waLink("Hi Martial X!")} onClick={() => track("whatsapp_click", { source: "contact" })} value={`+${CONTACT.whatsappNumber}`} />
          <Channel icon={Send} label="Telegram" href={tgLink()} onClick={() => track("telegram_click", { source: "contact" })} value={`@${CONTACT.telegramHandle}`} />
          <Channel icon={Phone} label="Phone" href={`tel:${CONTACT.phone}`} onClick={() => track("phone_click", { source: "contact" })} value={CONTACT.phone} />
          <Channel icon={Mail} label="Email" href={`mailto:${CONTACT.email}`} onClick={() => track("email_click", { source: "contact" })} value={CONTACT.email} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

const Channel = ({ icon: Icon, label, value, href, onClick }: any) => (
  <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}
     className="glass rounded-2xl p-6 hover-lift block">
    <Icon className="h-6 w-6 text-gold mb-3" />
    <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className="font-display text-lg font-bold mt-1">{value}</div>
  </a>
);
