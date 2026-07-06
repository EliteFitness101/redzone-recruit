import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Pricing } from "@/components/site/Pricing";
import { SEO } from "@/components/SEO";
import { SITE } from "@/config/site";

export default function PricingPage() {
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Pricing — Training Tiers"
        description="Basic Warrior ₦1,000, Elite Security Track ₦10,000, VIP Fast Track ₦30,000. Secure Paystack checkout."
        path="/pricing"
      />
      <Navbar />
      <main className="pt-24">
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
