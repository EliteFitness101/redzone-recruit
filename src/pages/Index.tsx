import { lazy, Suspense } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Footer } from "@/components/site/Footer";
import { StickyMobileCTA } from "@/components/site/StickyMobileCTA";
import { SEO } from "@/components/SEO";
import { SITE } from "@/config/site";

// Lazy-load below-the-fold sections for faster first paint.
const Training = lazy(() => import("@/components/site/Training").then(m => ({ default: m.Training })));
const Recruitment = lazy(() => import("@/components/site/Recruitment").then(m => ({ default: m.Recruitment })));
const Pricing = lazy(() => import("@/components/site/Pricing").then(m => ({ default: m.Pricing })));
const Referral = lazy(() => import("@/components/site/Referral").then(m => ({ default: m.Referral })));
const Testimonials = lazy(() => import("@/components/site/Testimonials").then(m => ({ default: m.Testimonials })));
const Faq = lazy(() => import("@/components/site/Faq").then(m => ({ default: m.Faq })));

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.domain,
  logo: `${SITE.domain}/favicon.ico`,
  sameAs: [
    "https://instagram.com/martialx",
    "https://tiktok.com/@martialx",
  ],
};

const Index = () => (
  <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
    <SEO title={SITE.tagline} description={SITE.description} path="/" jsonLd={orgJsonLd} />
    <Navbar />
    <main>
      <Hero />
      <Suspense fallback={<div className="h-40" />}>
        <Training />
        <Recruitment />
        <Pricing />
        <Referral />
        <Testimonials />
        <Faq />
      </Suspense>
    </main>
    <Footer />
    <StickyMobileCTA />
  </div>
);

export default Index;
