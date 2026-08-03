import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACT, waLink } from "@/config/site";
import { track } from "@/lib/analytics";

export const FinalCta = () => (
  <section id="apply-cta" className="relative py-20 md:py-28">
    <div className="absolute inset-0 bg-gradient-tactical opacity-70" />
    <div className="container relative">
      <div className="glass-strong rounded-3xl px-6 py-12 md:px-14 md:py-16 text-center shadow-glass">
        <h2 className="font-display text-3xl md:text-6xl font-bold leading-tight">
          Your Security Career <span className="text-gradient-gold">Starts Here</span>.
        </h2>
        <p className="mt-5 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Cohort places are limited. Submit your application and our admissions team will
          reach you on WhatsApp within 24 hours.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="hero" size="xl" className="w-full sm:w-auto" asChild>
            <Link to="/apply" onClick={() => track("application_start", { source: "final_cta" })}>
              Submit Application <ArrowRight className="ml-1" />
            </Link>
          </Button>
          <Button variant="gold" size="xl" className="w-full sm:w-auto" asChild>
            <a href={waLink("Hi Martial X Admissions, I'd like to apply for the next cohort.")}
               target="_blank" rel="noopener noreferrer"
               onClick={() => track("whatsapp_click", { source: "final_cta" })}>
              <MessageCircle /> Chat With Admissions
            </a>
          </Button>
          <Button variant="glass" size="xl" className="w-full sm:w-auto" asChild>
            <a href={`tel:${CONTACT.phone}`} onClick={() => track("call_click", { source: "final_cta" })}>
              <Phone /> Call Us
            </a>
          </Button>
        </div>
      </div>
    </div>
  </section>
);
