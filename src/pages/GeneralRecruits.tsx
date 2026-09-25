import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, ChevronRight, Shield, Sprout, Users } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";

const categories = [
  ["Administration & Business", "Office, operations, sales, customer service and support roles."],
  ["Hospitality & Facilities", "Hospitality, housekeeping, facility operations and service roles."],
  ["Wellness & Fitness", "Fitness, wellness, spa and client-service opportunities."],
  ["Technical & Skilled Trades", "Technicians, maintenance, fabrication and skilled field roles."],
  ["Logistics & Transport", "Drivers, dispatch, field logistics and support operations."],
  ["Digital & Creative", "Content, media, digital operations and creative roles."],
] as const;

export default function GeneralRecruits() {
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="General Recruitment"
        path="/general-recruits"
        description="General recruitment hub for future non-security and non-specialist recruitment opportunities."
      />
      <Navbar />
      <main className="pt-24">
        <section className="relative py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-tactical opacity-40" />
          <div className="container relative max-w-6xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-5 text-xs uppercase tracking-[0.2em] text-gold">
                <BriefcaseBusiness className="h-4 w-4" /> General Recruitment
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
                Find the right <span className="text-gradient-gold">opportunity.</span>
              </h1>
              <p className="mt-5 text-muted-foreground md:text-lg">
                A central intake point for future vacancies that do not belong to the specialist security or farm recruitment pipelines.
              </p>
            </div>

            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(([name, description]) => (
                <div key={name} className="glass rounded-2xl p-5">
                  <Users className="h-5 w-5 text-gold" />
                  <h2 className="mt-4 font-display text-lg font-semibold">{name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid md:grid-cols-2 gap-4">
              <div className="glass-strong rounded-2xl p-6">
                <Shield className="h-6 w-6 text-gold" />
                <h2 className="mt-3 font-display text-xl font-bold">Security recruitment</h2>
                <p className="mt-2 text-sm text-muted-foreground">Security candidates should use the dedicated security application pipeline.</p>
                <Button variant="hero" className="mt-5" asChild>
                  <Link to="/apply">Open Security Application <ChevronRight /></Link>
                </Button>
              </div>
              <div className="glass-strong rounded-2xl p-6">
                <Sprout className="h-6 w-6 text-gold" />
                <h2 className="mt-3 font-display text-xl font-bold">Farm recruitment</h2>
                <p className="mt-2 text-sm text-muted-foreground">Agricultural candidates should use the specialist farm recruitment pipeline.</p>
                <Button variant="gold" className="mt-5" asChild>
                  <Link to="/recruit">Open Farm Recruitment <ChevronRight /></Link>
                </Button>
              </div>
            </div>

            <div className="mt-8 glass rounded-2xl p-5 text-sm text-muted-foreground">
              General recruitment vacancies will be published here as they are formally opened. No salary, employer, vacancy count or placement claim is published unless verified.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
