import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Is RedZone Security a licensed recruiter?", a: "Yes. We operate in compliance with Nigeria's private security regulations and partner only with licensed firms registered under the relevant authorities." },
  { q: "Do I need prior military or police experience?", a: "No. Our programs are built for civilians. Many of our top deployed guards came in with zero combat or security background." },
  { q: "What ages do you accept?", a: "Recruits must be between 18 and 45 years old, in good general health, and willing to commit to the full training schedule." },
  { q: "How long until I get deployed?", a: "Elite Security Track graduates are typically interviewed within 2–4 weeks of certification. VIP Fast Track guarantees an interview." },
  { q: "What does the salary look like?", a: "Starting deployments range ₦80,000–₦250,000 monthly depending on the firm, location, and protection class. Supervisor and CP roles earn significantly more." },
  { q: "Are payments secure?", a: "All payments are processed through Paystack with full encryption and instant receipt confirmation." },
];

export const Faq = () => (
  <section id="faq" className="relative py-24 md:py-32">
    <div className="container max-w-3xl">
      <div className="text-center mb-14">
        <div className="inline-block glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
          05 — FAQ
        </div>
        <h2 className="font-display text-4xl md:text-6xl font-bold leading-tight">
          Questions, <span className="text-gradient-gold">answered</span>.
        </h2>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((f, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="glass rounded-xl px-6 border-none data-[state=open]:border-gold/30"
          >
            <AccordionTrigger className="text-left font-display font-semibold hover:no-underline hover:text-gold py-5">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
