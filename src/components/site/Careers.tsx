import { Link } from "react-router-dom";
import { Dumbbell, ShieldCheck, UserCheck, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

const careers = [
  {
    icon: ShieldCheck,
    title: "Security Officer",
    salary: "₦80,000 – ₦150,000 / month",
    desc: "Static and mobile guarding for corporate, residential and industrial sites.",
  },
  {
    icon: UserCheck,
    title: "Executive Protection Specialist",
    salary: "₦250,000 – ₦600,000 / month",
    desc: "Close protection for executives, expatriates and high-profile principals.",
  },
  {
    icon: Dumbbell,
    title: "Tactical Fitness Coach",
    salary: "₦150,000 – ₦400,000 / month",
    desc: "Condition security teams, athletes and private clients to operator standard.",
  },
  {
    icon: Building2,
    title: "Corporate Security Professional",
    salary: "₦200,000 – ₦500,000 / month",
    desc: "Risk assessment, access control and security supervision inside organisations.",
  },
];

export const Careers = () => (
  <section id="careers" className="relative py-20 md:py-28">
    <div className="absolute inset-0 bg-gradient-tactical opacity-60" />
    <div className="container relative">
      <div className="max-w-3xl mb-12">
        <div className="inline-block glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
          Career Opportunities
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
          Four roles. One <span className="text-gradient-red">entry point</span>.
        </h2>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Salary ranges reflect current deployments across our licensed partner firms.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
        {careers.map(({ icon: Icon, title, salary, desc }) => (
          <div key={title} className="glass rounded-2xl p-6 md:p-7 hover-lift">
            <div className="h-11 w-11 rounded-xl bg-gradient-red flex items-center justify-center shadow-red mb-5">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-display text-xl font-bold">{title}</h3>
            <div className="mt-1 text-sm text-gold font-medium">{salary}</div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <Button variant="hero" size="lg" asChild>
          <Link to="/apply" onClick={() => track("application_start", { source: "careers" })}>
            Apply For Recruitment <ArrowRight className="ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);
