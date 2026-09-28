import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FarmRecruitment } from "@/components/site/FarmRecruitment";
import { SEO } from "@/components/SEO";

export default function FarmRecruit() {
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Farm Recruitment"
        path="/recruit"
        description="Recruit qualified professionals and farm assistants for verified agricultural workforce opportunities."
      />
      <Navbar />
      <main className="pt-24">
        <FarmRecruitment asH1 />
      </main>
      <Footer />
    </div>
  );
}
