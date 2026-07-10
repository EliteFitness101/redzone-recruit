import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, Clock, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LessonPage() {
  const { slug = "", lessonSlug = "" } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [access, setAccess] = useState(false);
  const [done, setDone] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ pct: number; passed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { window.scrollTo(0, 0); setResult(null); setAnswers({}); }, [lessonSlug]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCourse(c);
      const { data: mods } = await supabase.from("modules").select("id").eq("course_id", c.id).order("order_index");
      const modIds = (mods ?? []).map((m) => m.id);
      const { data: ls } = await supabase.from("lessons").select("*").in("module_id", modIds.length ? modIds : ["00000000-0000-0000-0000-000000000000"]).order("order_index");
      setSiblings(ls ?? []);
      const l = (ls ?? []).find((x: any) => x.slug === lessonSlug);
      setLesson(l);
      let ok = l?.is_preview ?? false;
      if (user) {
        const { data: acc } = await supabase.rpc("has_course_access", { _user: user.id, _course: c.id });
        ok = ok || !!acc;
        if (l) {
          const { data: pr } = await supabase.from("lesson_progress").select("completed_at").eq("user_id", user.id).eq("lesson_id", l.id).maybeSingle();
          setDone(!!pr?.completed_at);
        }
      }
      setAccess(ok);
      // Load final quiz if this is the last lesson
      if (l && ls && ls[ls.length - 1]?.id === l.id) {
        const { data: q } = await supabase.from("quizzes").select("*").in("module_id", modIds).eq("is_final", true).maybeSingle();
        setQuiz(q);
        if (q) {
          const { data: qs } = await supabase.from("quiz_questions").select("*").eq("quiz_id", q.id).order("order_index");
          setQuestions(qs ?? []);
        }
      } else { setQuiz(null); setQuestions([]); }
      setLoading(false);
    })();
  }, [slug, lessonSlug, user]);

  const { prev, next } = useMemo(() => {
    const i = siblings.findIndex((s) => s.slug === lessonSlug);
    return { prev: i > 0 ? siblings[i - 1] : null, next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null };
  }, [siblings, lessonSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-gold" /></div>;
  if (!lesson || !course) return <Navigate to={`/academy/${slug}`} replace />;
  if (!access) return <Navigate to={`/academy/${slug}`} replace />;

  const markDone = async () => {
    if (!user) { nav("/login"); return; }
    const { error } = await supabase.from("lesson_progress").upsert(
      { user_id: user.id, lesson_id: lesson.id, course_id: course.id, completed_at: new Date().toISOString(), last_seen_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" }
    );
    if (error) return toast.error(error.message);
    setDone(true); toast.success("Lesson marked complete");
  };

  const submitQuiz = async () => {
    if (!user || !quiz) return;
    const correct = questions.reduce((n, q) => n + ((answers[q.id] ?? -1) === q.correct_index ? 1 : 0), 0);
    const pct = Math.round((correct / questions.length) * 100);
    const passed = pct >= (quiz.pass_percent ?? 70);
    setResult({ pct, passed });
    await supabase.from("quiz_attempts").insert({ user_id: user.id, quiz_id: quiz.id, course_id: course.id, score_percent: pct, passed, answers });
    if (passed) toast.success(`Passed with ${pct}%`); else toast.error(`${pct}% — try again`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={`${lesson.title} — ${course.title}`} path={`/academy/${slug}/${lessonSlug}`} />
      <Navbar />
      <main className="pt-28 pb-24 container max-w-3xl">
        <Link to={`/academy/${slug}`} className="text-xs uppercase tracking-widest text-gold">← {course.title}</Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-4">{lesson.title}</h1>
        <div className="flex gap-3 mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.estimated_minutes} min</span>
          {done && <span className="text-gold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Complete</span>}
        </div>

        <article className="prose prose-invert max-w-none mt-8 text-foreground/90 leading-relaxed">
          <p className="text-lg">{lesson.body_markdown}</p>
        </article>

        {(lesson.exercises?.length ?? 0) > 0 && (
          <section className="glass rounded-2xl p-5 mt-8">
            <h3 className="font-display text-lg font-bold text-gold">Practical exercises</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {lesson.exercises.map((e: string, i: number) => (
                <li key={i} className="flex gap-2"><span className="text-gold">›</span>{e}</li>
              ))}
            </ul>
          </section>
        )}

        {(lesson.checklist?.length ?? 0) > 0 && (
          <section className="glass rounded-2xl p-5 mt-4">
            <h3 className="font-display text-lg font-bold text-gold">Training checklist</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {lesson.checklist.map((c: string, i: number) => (
                <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-gold mt-0.5 shrink-0" />{c}</li>
              ))}
            </ul>
          </section>
        )}

        {quiz && questions.length > 0 && (
          <section className="glass-strong rounded-2xl p-6 mt-8">
            <h3 className="font-display text-xl font-bold">{quiz.title}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Pass mark: {quiz.pass_percent}%</p>
            <div className="mt-5 space-y-5">
              {questions.map((q, qi) => (
                <div key={q.id}>
                  <div className="font-semibold text-sm mb-2">{qi + 1}. {q.question}</div>
                  <div className="space-y-1.5">
                    {(q.choices as string[]).map((c, ci) => {
                      const sel = answers[q.id] === ci;
                      const correct = result && ci === q.correct_index;
                      const wrong = result && sel && !correct;
                      return (
                        <label key={ci} className={`flex items-center gap-2 text-sm p-2 rounded-lg border cursor-pointer ${sel ? "border-gold" : "border-border/40"} ${correct ? "bg-gold/10" : ""} ${wrong ? "bg-destructive/10" : ""}`}>
                          <input type="radio" name={q.id} checked={sel} onChange={() => setAnswers({ ...answers, [q.id]: ci })} disabled={!!result} />
                          {c}
                        </label>
                      );
                    })}
                  </div>
                  {result && q.explanation && <p className="text-xs text-muted-foreground mt-2 italic">{q.explanation}</p>}
                </div>
              ))}
            </div>
            {!result ? (
              <Button variant="hero" className="mt-5" onClick={submitQuiz} disabled={Object.keys(answers).length !== questions.length}>Submit quiz</Button>
            ) : (
              <div className="mt-5 flex items-center justify-between">
                <div className={`font-tactical text-2xl ${result.passed ? "text-gradient-gold" : "text-destructive"}`}>{result.pct}% {result.passed ? "passed" : "not yet"}</div>
                {!result.passed && <Button variant="glass" onClick={() => { setResult(null); setAnswers({}); }}>Retry</Button>}
              </div>
            )}
          </section>
        )}

        <div className="mt-10 flex items-center justify-between gap-3 flex-wrap">
          <Button variant="glass" disabled={!prev} asChild={!!prev}>
            {prev ? <Link to={`/academy/${slug}/${prev.slug}`}><ArrowLeft className="h-4 w-4" /> Previous</Link> : <span><ArrowLeft className="h-4 w-4" /> Previous</span>}
          </Button>
          {!done ? (
            <Button variant="hero" onClick={markDone}><CheckCircle2 className="h-4 w-4" /> Mark complete</Button>
          ) : next ? (
            <Button variant="hero" asChild><Link to={`/academy/${slug}/${next.slug}`}>Next lesson <ArrowRight className="h-4 w-4" /></Link></Button>
          ) : (
            <Button variant="gold" asChild><Link to={`/academy/${slug}`}>Back to course</Link></Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
