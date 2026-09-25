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
        title="Farm Recruitment — CY Nwankwo Farm Operations"
        path="/recruit"
        description="Immediate recruitment for a seven-person farm operations team covering cattle, goats and palm plantation operations at Ahiaba Ubi Autonomous Community, Isiala Ngwa North, Abia State."
      />
      <Navbar />
      <main className="pt-24">
        <FarmRecruitment asH1 />
      </main>
      <Footer />
    </div>
  );
}
