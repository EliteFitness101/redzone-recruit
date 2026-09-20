import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FarmRecruitment } from "@/components/site/FarmRecruitment";
import { SEO } from "@/components/SEO";

export default function Apply() {
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Farm Recruitment — CY Nwankwo Farm Operations"
        path="/apply"
        description="Immediate recruitment for a 7-person farm management and operations team covering cattle, goats and palm plantation operations in Ahiaba Ubi, Isiala Ngwa North, Abia State."
      />
      <Navbar />
      <main className="pt-24">
        <FarmRecruitment asH1 />
      </main>
      <Footer />
    </div>
  );
}
