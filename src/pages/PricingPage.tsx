import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Pricing } from "@/components/site/Pricing";
import { SEO } from "@/components/SEO";

export default function PricingPage() {
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Pricing — Training Tiers"
        description="Choose an active Martial X training offer and continue to secure Paystack checkout."
        path="/pricing"
      />
      <Navbar />
      <main className="pt-24">
        <Pricing asH1 />
      </main>
      <Footer />
    </div>
  );
}
