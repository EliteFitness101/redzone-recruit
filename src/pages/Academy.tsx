import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Lock, PlayCircle, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Course { id: string; slug: string; title: string; description: string | null; required_tier: string; duration_weeks: number | null; }

const TIER_ORDER = { basic: 1, elite: 2, vip: 3 } as const;

export default function Academy() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userTier, setUserTier] = useState<keyof typeof TIER_ORDER | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    supabase.from("courses").select("*").eq("published", true).order("order_index")
      .then(({ data }) => setCourses((data ?? []) as Course[]));
    if (user) {
      supabase.from("enrollments").select("tier").eq("user_id", user.id).eq("active", true)
        .then(({ data }) => {
          const highest = (data ?? []).reduce<keyof typeof TIER_ORDER | null>((acc, e) => {
            const t = e.tier as keyof typeof TIER_ORDER;
            if (!acc || TIER_ORDER[t] > TIER_ORDER[acc]) return t;
            return acc;
          }, null);
          setUserTier(highest);
        });
    }
  }, [user]);

  const hasAccess = (required: string) =>
    userTier ? TIER_ORDER[userTier] >= TIER_ORDER[required as keyof typeof TIER_ORDER] : false;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Academy — Combat Fitness Courses" path="/academy"
        description="Access Martial X Academy courses: foundation conditioning, tactical defense, close protection and security licensing prep." />
      <Navbar />
      <main className="pt-28 pb-24">
        <section className="container">
          <div className="max-w-2xl mb-12">
            <div className="inline-block glass rounded-full px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.3em] text-gold">
              <GraduationCap className="inline h-3.5 w-3.5 mr-1" /> Academy
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
              Your <span className="text-gradient-red">curriculum</span>.
            </h1>
            <p className="mt-4 text-muted-foreground">
              {user
                ? userTier
                  ? `Access level: ${userTier.toUpperCase()}. Unlock more by upgrading your tier.`
                  : "Enroll in a training tier to unlock modules."
                : "Sign in and enroll to unlock modules."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {courses.map((c) => {
              const unlocked = hasAccess(c.required_tier);
              return (
                <div key={c.id} className={`glass rounded-2xl p-7 relative overflow-hidden ${unlocked ? "hover-lift" : "opacity-80"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs uppercase tracking-widest text-gold">{c.required_tier}</span>
                    {unlocked ? <PlayCircle className="text-gold" /> : <Lock className="text-muted-foreground" />}
                  </div>
                  <h3 className="font-display text-xl font-bold">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{c.description}</p>
                  {c.duration_weeks && <p className="text-xs uppercase tracking-widest text-muted-foreground mt-3">{c.duration_weeks} weeks</p>}
                  <div className="mt-5">
                    {unlocked ? (
                      <Button variant="hero" size="sm" asChild>
                        <Link to={`/academy/${c.slug}`}>Start module</Link>
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="glass" size="sm" asChild>
                          <Link to={`/academy/${c.slug}`}>Preview</Link>
                        </Button>
                        <Button variant="gold" size="sm" asChild>
                          <Link to={`/checkout?tier=${c.required_tier}`}>Unlock</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
