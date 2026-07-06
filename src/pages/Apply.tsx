import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Recruitment } from "@/components/site/Recruitment";
import { SEO } from "@/components/SEO";

export default function Apply() {
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Apply for Security Deployment" path="/apply" description="Submit your recruitment application to RedZone Security. Get vetted, trained and deployed to licensed firms in Nigeria." />
      <Navbar />
      <main className="pt-24">
        <Recruitment />
      </main>
      <Footer />
    </div>
  );
}
