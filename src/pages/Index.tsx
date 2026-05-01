import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Training } from "@/components/site/Training";
import { Recruitment } from "@/components/site/Recruitment";
import { Pricing } from "@/components/site/Pricing";
import { Referral } from "@/components/site/Referral";
import { Testimonials } from "@/components/site/Testimonials";
import { Faq } from "@/components/site/Faq";
import { Footer } from "@/components/site/Footer";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "Martial X × RedZone Security — Train Like A Warrior. Get Paid Like A Pro.";
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      "Nigeria's premier combat fitness academy and licensed security recruitment pipeline. Train, certify and get deployed.",
    );
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Training />
        <Recruitment />
        <Pricing />
        <Referral />
        <Testimonials />
        <Faq />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
