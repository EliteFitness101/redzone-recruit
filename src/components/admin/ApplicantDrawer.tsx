import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, MessageCircle, Mail } from "lucide-react";
import {
  STAGES,
  STAGE_LABELS,
  PROGRAMS,
  addNote,
  changeStage,
  listActivity,
  listInterviews,
  parseLegacyNotes,
  scheduleInterview,
  updateApplication,
  type ActivityEvent,
  type Application,
  type Interview,
  type Recruiter,
  type Stage,
} from "@/lib/recruitment";
import { waLink } from "@/config/site";

const selectCls =
  "mt-1.5 flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export const ApplicantDrawer = ({
  application,
  recruiters,
  onClose,
  onChanged,
}: {
  application: Application | null;
  recruiters: Recruiter[];
  onClose: () => void;
  onChanged: () => void;
}) => {
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [when, setWhen] = useState("");
  const [link, setLink] = useState("");

  const app = application;
  const legacy = parseLegacyNotes(app?.notes ?? null);

  useEffect(() => {
    if (!app) return;
    setLoading(true);
    Promise.all([listActivity(app.id), listInterviews(app.id)])
      .then(([a, i]) => {
        setActivity(a);
        setInterviews(i);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [app?.id]);

  async function run(fn: () => Promise<void>, msg: string) {
    if (!app) return;
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      const [a, i] = await Promise.all([listActivity(app.id), listInterviews(app.id)]);
      setActivity(a);
      setInterviews(i);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={!!app} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {app && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-2xl">{app.full_name}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {app.reference_number ?? "—"}
                </Badge>
                <Badge className="text-[10px] uppercase">{STAGE_LABELS[app.stage as Stage] ?? app.stage}</Badge>
                {(app.tags ?? []).map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            </SheetHeader>

            <Tabs defaultValue="profile" className="mt-6">
              <TabsList className="glass flex-wrap h-auto">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="interviews">Interviews</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-3 pt-4 text-sm">
                <Field label="Email" value={app.email ?? "—"} />
                <Field label="Phone" value={app.phone} />
                <Field label="Location" value={app.location} />
                <Field label="Age" value={String(app.age)} />
                <Field label="Profession / Education" value={app.education} />
                <Field label="Fitness level" value={app.fitness_level} />
                <Field label="Prior experience" value={app.prior_experience ?? "—"} />
                <Field label="Program" value={app.program ?? "—"} />
                <Field label="Cohort" value={app.cohort ?? "—"} />
                <Field label="Applied" value={new Date(app.created_at).toLocaleString()} />
                <div className="pt-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    Attribution
                  </div>
                  <pre className="glass rounded-xl p-3 text-xs overflow-x-auto">
                    {JSON.stringify(
                      Object.keys(app.attribution ?? {}).length ? app.attribution : (legacy?.attribution ?? {}),
                      null,
                      2,
                    )}
                  </pre>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="glass" size="sm" asChild>
                    <a href={waLink(`Hi ${app.full_name}, this is Martial X Admissions.`)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle /> WhatsApp
                    </a>
                  </Button>
                  {app.email && (
                    <Button variant="glass" size="sm" asChild>
                      <a href={`mailto:${app.email}?subject=Martial%20X%20Application%20${app.reference_number ?? ""}`}>
                        <Mail /> Email
                      </a>
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-5 pt-4">
                <div>
                  <Label htmlFor="d-stage">Stage</Label>
                  <select
                    id="d-stage"
                    className={selectCls}
                    value={app.stage}
                    disabled={busy}
                    onChange={(e) => run(() => changeStage(app.id, e.target.value as Stage), "Stage updated")}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="d-recruiter">Assigned recruiter</Label>
                  <select
                    id="d-recruiter"
                    className={selectCls}
                    value={app.assigned_recruiter ?? ""}
                    disabled={busy}
                    onChange={(e) =>
                      run(
                        () => updateApplication(app.id, { assigned_recruiter: e.target.value || null }),
                        "Recruiter assigned",
                      )
                    }
                  >
                    <option value="">Unassigned</option>
                    {recruiters.map((r) => (
                      <option key={r.user_id} value={r.user_id}>
                        {r.display_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="d-program">Program</Label>
                    <select
                      id="d-program"
                      className={selectCls}
                      value={app.program ?? ""}
                      disabled={busy}
                      onChange={(e) => run(() => updateApplication(app.id, { program: e.target.value || null }), "Program set")}
                    >
                      <option value="">Unassigned</option>
                      {PROGRAMS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="d-cohort">Cohort</Label>
                    <Input
                      id="d-cohort"
                      className="mt-1.5"
                      defaultValue={app.cohort ?? ""}
                      placeholder="2026-Q3"
                      onBlur={(e) => {
                        const v = e.target.value.trim() || null;
                        if (v !== (app.cohort ?? null)) run(() => updateApplication(app.id, { cohort: v }), "Cohort set");
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="d-tag">Internal tags</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="d-tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="priority, lagos-cohort"
                    />
                    <Button
                      variant="glass"
                      disabled={busy || !tagInput.trim()}
                      onClick={() =>
                        run(async () => {
                          const next = Array.from(new Set([...(app.tags ?? []), tagInput.trim()]));
                          await updateApplication(app.id, { tags: next });
                          setTagInput("");
                        }, "Tag added")
                      }
                    >
                      Add
                    </Button>
                  </div>
                  {(app.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(app.tags ?? []).map((t) => (
                        <button
                          key={t}
                          className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-md border border-border hover:border-destructive"
                          onClick={() =>
                            run(
                              () => updateApplication(app.id, { tags: (app.tags ?? []).filter((x) => x !== t) }),
                              "Tag removed",
                            )
                          }
                        >
                          {t} ✕
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="d-note">Add note</Label>
                  <Textarea
                    id="d-note"
                    className="mt-1.5"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Call summary, screening outcome…"
                  />
                  <Button
                    className="mt-2"
                    variant="gold"
                    disabled={busy || !note.trim()}
                    onClick={() =>
                      run(async () => {
                        await addNote(app.id, note.trim());
                        setNote("");
                      }, "Note saved")
                    }
                  >
                    Save note
                  </Button>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                    Schedule interview
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Interview date and time" />
                    <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Meeting link" aria-label="Meeting link" />
                  </div>
                  <Button
                    className="mt-3"
                    variant="tactical"
                    disabled={busy || !when}
                    onClick={() =>
                      run(async () => {
                        await scheduleInterview({ application_id: app.id, scheduled_at: when, meeting_link: link });
                        setWhen("");
                        setLink("");
                      }, "Interview scheduled")
                    }
                  >
                    Schedule
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="glass" disabled={busy} onClick={() => run(() => changeStage(app.id, "accepted"), "Marked accepted")}>
                    Mark accepted
                  </Button>
                  <Button variant="glass" disabled={busy} onClick={() => run(() => changeStage(app.id, "enrolled"), "Marked enrolled")}>
                    Mark enrolled
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="pt-4">
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gold" /></div>
                ) : activity.length === 0 ? (
                  <Empty>No activity recorded yet.</Empty>
                ) : (
                  <ol className="space-y-3">
                    {activity.map((a) => (
                      <li key={a.id} className="glass rounded-xl p-3">
                        <div className="flex justify-between gap-3">
                          <span className="text-sm font-medium">{a.event.replace(/_/g, " ")}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(a.created_at).toLocaleString()}
                          </span>
                        </div>
                        {a.notes && <p className="text-sm text-muted-foreground mt-1">{a.notes}</p>}
                        {a.metadata && Object.keys(a.metadata).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                            {JSON.stringify(a.metadata)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </TabsContent>

              <TabsContent value="interviews" className="pt-4">
                {interviews.length === 0 ? (
                  <Empty>No interviews scheduled.</Empty>
                ) : (
                  <ul className="space-y-3">
                    {interviews.map((i) => (
                      <li key={i.id} className="glass rounded-xl p-3 text-sm">
                        <div className="flex justify-between gap-2">
                          <span>{new Date(i.scheduled_at).toLocaleString()}</span>
                          <Badge variant="secondary" className="text-[10px] uppercase">{i.outcome}</Badge>
                        </div>
                        {i.meeting_link && (
                          <a className="text-gold text-xs break-all" href={i.meeting_link} target="_blank" rel="noopener noreferrer">
                            {i.meeting_link}
                          </a>
                        )}
                        {i.score != null && <div className="text-xs text-muted-foreground">Score: {i.score}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4 border-b border-border/40 pb-2">
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="text-right">{value}</span>
  </div>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="text-center py-10 text-sm text-muted-foreground">{children}</div>
);
