import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, Lock, PlayCircle, Clock, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Course = { id: string; slug: string; title: string; description: string | null; required_tier: string; objectives: string[]; completion_criteria: string | null; duration_weeks: number | null; };
type Lesson = { id: string; slug: string; title: string; summary: string | null; order_index: number; estimated_minutes: number; is_preview: boolean; };
type Progress = { lesson_id: string; completed_at: string | null };

export default function CoursePage() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [hasAccess, setHasAccess] = useState(false);
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("courses").select("*").eq("slug", slug).eq("published", true).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCourse(c as any);
      const { data: mods } = await supabase.from("modules").select("id").eq("course_id", c.id).order("order_index");
      const modIds = (mods ?? []).map((m) => m.id);
      const { data: ls } = await supabase.from("lessons").select("id, slug, title, summary, order_index, estimated_minutes, is_preview").in("module_id", modIds.length ? modIds : ["00000000-0000-0000-0000-000000000000"]).order("order_index");
      setLessons((ls ?? []) as any);
      if (user) {
        const { data: acc } = await supabase.rpc("has_course_access", { _user: user.id, _course: c.id });
        setHasAccess(!!acc);
        const { data: pr } = await supabase.from("lesson_progress").select("lesson_id, completed_at").eq("user_id", user.id).eq("course_id", c.id);
        const map: Record<string, boolean> = {};
        (pr ?? []).forEach((p: Progress) => { if (p.completed_at) map[p.lesson_id] = true; });
        setProgress(map);
        const { data: cr } = await supabase.from("certificates").select("*").eq("user_id", user.id).eq("course_id", c.id).is("revoked_at", null).maybeSingle();
        setCert(cr);
      }
      setLoading(false);
    })();
  }, [slug, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-gold" /></div>;
  if (!course) return <Navigate to="/academy" replace />;

  const completedCount = lessons.filter((l) => progress[l.id]).length;
  const pct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  const nextLesson = lessons.find((l) => !progress[l.id]) ?? lessons[0];
  const allDone = lessons.length > 0 && completedCount === lessons.length;

  const issueCert = async () => {
    if (issuing) return;
    setIssuing(true);
    const { data, error } = await supabase.rpc("issue_certificate", { _course: course.id });
    setIssuing(false);
    if (error) return toast.error(error.message);
    setCert(data);
    toast.success("Certificate issued");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={`${course.title} — Academy`} path={`/academy/${slug}`} description={course.description ?? undefined} />
      <Navbar />
      <main className="pt-28 pb-24 container max-w-5xl">
        <Link to="/academy" className="text-xs uppercase tracking-widest text-gold">← All courses</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-gold">{course.required_tier} tier</div>
            <h1 className="font-display text-3xl md:text-5xl font-bold mt-2">{course.title}</h1>
            <p className="mt-3 text-muted-foreground">{course.description}</p>
          </div>
          {hasAccess ? (
            <Button variant="hero" size="lg" asChild>
              <Link to={`/academy/${slug}/${nextLesson?.slug}`}>
                <PlayCircle className="h-4 w-4" /> {completedCount > 0 ? "Resume" : "Start course"}
              </Link>
            </Button>
          ) : (
            <Button variant="gold" size="lg" asChild>
              <Link to={`/checkout?tier=${course.required_tier}`}>Unlock — enroll</Link>
            </Button>
          )}
        </div>

        {hasAccess && (
          <div className="glass rounded-2xl p-5 mt-8">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground mb-2">
              <span>Progress</span><span>{completedCount}/{lessons.length} · {pct}%</span>
            </div>
            <div className="h-2 bg-border/40 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-gold transition-all" style={{ width: `${pct}%` }} />
            </div>
            {allDone && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm"><Award className="h-4 w-4 text-gold" /> All lessons complete.</div>
                {cert ? (
                  <Button variant="gold" size="sm" asChild><Link to={`/certificate/${cert.certificate_code}`}>View certificate</Link></Button>
                ) : (
                  <Button variant="gold" size="sm" onClick={issueCert} disabled={issuing}>{issuing ? <Loader2 className="animate-spin h-4 w-4" /> : "Issue my certificate"}</Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <aside className="md:col-span-1 glass rounded-2xl p-5 h-fit">
            <h3 className="font-display text-lg font-bold mb-3">Learning objectives</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {(course.objectives ?? []).map((o: string, i: number) => (
                <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-gold mt-0.5 shrink-0" />{o}</li>
              ))}
            </ul>
            {course.completion_criteria && (
              <>
                <h4 className="text-xs uppercase tracking-widest text-gold mt-5 mb-2">Completion</h4>
                <p className="text-xs text-muted-foreground">{course.completion_criteria}</p>
              </>
            )}
          </aside>

          <div className="md:col-span-2 space-y-3">
            {lessons.map((l, i) => {
              const done = progress[l.id];
              const locked = !hasAccess && !l.is_preview;
              return (
                <div key={l.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                      Lesson {i + 1} · <Clock className="h-3 w-3" /> {l.estimated_minutes} min
                      {l.is_preview && <span className="text-gold">· preview</span>}
                    </div>
                    <div className="font-semibold mt-0.5 truncate">{l.title}</div>
                  </div>
                  {locked ? (
                    <Button variant="glass" size="sm" asChild><Link to={`/checkout?tier=${course.required_tier}`}><Lock className="h-4 w-4" /> Unlock</Link></Button>
                  ) : (
                    <Button variant={done ? "glass" : "hero"} size="sm" asChild>
                      <Link to={`/academy/${slug}/${l.slug}`}>
                        {done ? <><CheckCircle2 className="h-4 w-4" /> Review</> : <><PlayCircle className="h-4 w-4" /> Open</>}
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
