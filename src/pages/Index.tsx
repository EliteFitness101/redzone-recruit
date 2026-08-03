import { lazy, Suspense, useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Footer } from "@/components/site/Footer";
import { StickyMobileCTA } from "@/components/site/StickyMobileCTA";
import { SEO } from "@/components/SEO";
import { SITE } from "@/config/site";
import { track } from "@/lib/analytics";

// Lazy-load below-the-fold sections for faster first paint.
const WhyMartialX = lazy(() => import("@/components/site/WhyMartialX").then(m => ({ default: m.WhyMartialX })));
const Careers = lazy(() => import("@/components/site/Careers").then(m => ({ default: m.Careers })));
const Training = lazy(() => import("@/components/site/Training").then(m => ({ default: m.Training })));
const WhoShouldApply = lazy(() => import("@/components/site/WhoShouldApply").then(m => ({ default: m.WhoShouldApply })));
const Recruitment = lazy(() => import("@/components/site/Recruitment").then(m => ({ default: m.Recruitment })));
const Testimonials = lazy(() => import("@/components/site/Testimonials").then(m => ({ default: m.Testimonials })));
const Pricing = lazy(() => import("@/components/site/Pricing").then(m => ({ default: m.Pricing })));
const Faq = lazy(() => import("@/components/site/Faq").then(m => ({ default: m.Faq })));
const FinalCta = lazy(() => import("@/components/site/FinalCta").then(m => ({ default: m.FinalCta })));

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.domain,
  logo: `${SITE.domain}/favicon.ico`,
  areaServed: "NG",
  sameAs: ["https://instagram.com/martialx", "https://tiktok.com/@martialx"],
};

const Index = () => {
  useEffect(() => {
    track("view_content", { page: "landing" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Security Training & Recruitment in Nigeria"
        description="Martial X™ trains, certifies and deploys security officers, executive protection specialists and tactical fitness coaches across Nigeria. Apply for the next cohort."
        path="/"
        jsonLd={orgJsonLd}
      />
      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={<div className="h-40" />}>
          <WhyMartialX />
          <Careers />
          <Training />
          <WhoShouldApply />
          <Recruitment />
          <Testimonials />
          <Pricing />
          <Faq />
          <FinalCta />
        </Suspense>
      </main>
      <Footer />
      <StickyMobileCTA />
    </div>
  );
};

export default Index;
