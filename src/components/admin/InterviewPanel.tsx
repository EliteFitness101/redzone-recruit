import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarPlus, Loader2, CalendarDays, X } from "lucide-react";
import {
  INTERVIEW_STATUSES,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPES,
  TIMEZONES,
  cancelInterview,
  createInterview,
  downloadIcs,
  listInterviewRounds,
  rescheduleInterview,
  saveScorecard,
  updateInterview,
  type InterviewRecord,
  type InterviewStatus,
  type InterviewType,
} from "@/lib/recruitmentOps";

const selectCls =
  "mt-1.5 flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const CRITERIA = ["Discipline", "Communication", "Fitness", "Integrity", "Situational awareness"];

export const InterviewPanel = ({
  applicationId,
  applicantName,
  onChanged,
}: {
  applicationId: string;
  applicantName: string;
  onChanged: () => void;
}) => {
  const [rounds, setRounds] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scoring, setScoring] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [scoreNotes, setScoreNotes] = useState("");

  const [when, setWhen] = useState("");
  const [tz, setTz] = useState<string>("Africa/Lagos");
  const [type, setType] = useState<InterviewType>("virtual");
  const [link, setLink] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("45");
  const [notes, setNotes] = useState("");

  const load = () =>
    listInterviewRounds(applicationId)
      .then(setRounds)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const run = async (fn: () => Promise<void>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      await load();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Schedule interview — round {Math.max(0, ...rounds.map((r) => r.round)) + 1}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="iv-when">Date &amp; time</Label>
            <Input id="iv-when" type="datetime-local" className="mt-1.5" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="iv-tz">Timezone</Label>
            <select id="iv-tz" className={selectCls} value={tz} onChange={(e) => setTz(e.target.value)}>
              {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="iv-type">Type</Label>
            <select id="iv-type" className={selectCls} value={type} onChange={(e) => setType(e.target.value as InterviewType)}>
              {INTERVIEW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="iv-dur">Duration (minutes)</Label>
            <Input id="iv-dur" className="mt-1.5" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          {type !== "physical" && (
            <div className="sm:col-span-2">
              <Label htmlFor="iv-link">Meeting link (Meet, Teams, Zoom or custom)</Label>
              <Input id="iv-link" className="mt-1.5" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/..." />
            </div>
          )}
          {type === "physical" && (
            <div className="sm:col-span-2">
              <Label htmlFor="iv-loc">Location</Label>
              <Input id="iv-loc" className="mt-1.5" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Martial X HQ, Lagos" />
            </div>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="iv-notes">Notes</Label>
            <Textarea id="iv-notes" className="mt-1.5" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <Button
          variant="tactical"
          disabled={busy || !when}
          onClick={() =>
            run(async () => {
              await createInterview({
                application_id: applicationId,
                scheduled_at: when,
                timezone: tz,
                interview_type: type,
                meeting_link: link,
                location,
                duration_minutes: Number(duration) || 45,
                notes,
              });
              setWhen("");
              setLink("");
              setLocation("");
              setNotes("");
            }, "Interview scheduled")
          }
        >
          <CalendarPlus /> Schedule
        </Button>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Interview history</div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gold" /></div>
        ) : rounds.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No interviews scheduled yet.</p>
        ) : (
          <ol className="space-y-3">
            {rounds.map((iv) => (
              <li key={iv.id} className="glass rounded-xl p-3 space-y-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium">Round {iv.round}</span>{" "}
                    <span className="text-muted-foreground">
                      {new Date(iv.scheduled_at).toLocaleString(undefined, { timeZone: iv.timezone })} ({iv.timezone})
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {INTERVIEW_STATUS_LABELS[iv.status] ?? iv.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {iv.interview_type} · {iv.duration_minutes} min
                  {iv.location ? ` · ${iv.location}` : ""}
                </div>
                {iv.meeting_link && (
                  <a className="text-gold text-xs break-all" href={iv.meeting_link} target="_blank" rel="noopener noreferrer">
                    {iv.meeting_link}
                  </a>
                )}
                {iv.score != null && <div className="text-xs">Score: {iv.score}%</div>}
                {iv.notes && <p className="text-xs text-muted-foreground">{iv.notes}</p>}

                <div className="flex flex-wrap gap-2 pt-1">
                  <select
                    className="h-8 rounded-md border border-input bg-input px-2 text-xs"
                    value={iv.status}
                    disabled={busy}
                    aria-label="Interview status"
                    onChange={(e) =>
                      run(() => updateInterview(iv.id, { status: e.target.value as InterviewStatus }), "Status updated")
                    }
                  >
                    {INTERVIEW_STATUSES.map((s) => (
                      <option key={s} value={s}>{INTERVIEW_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <Button size="sm" variant="glass" onClick={() => downloadIcs(iv, applicantName)}>
                    <CalendarDays /> Calendar
                  </Button>
                  <Button
                    size="sm"
                    variant="glass"
                    disabled={busy}
                    onClick={() => {
                      const next = window.prompt("New date & time (YYYY-MM-DDTHH:MM)");
                      if (!next) return;
                      const reason = window.prompt("Reason for rescheduling") ?? undefined;
                      run(() => rescheduleInterview(iv, next, reason), "Interview rescheduled");
                    }}
                  >
                    Reschedule
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy || iv.status === "cancelled"}
                    onClick={() => {
                      const reason = window.prompt("Reason for cancelling");
                      if (!reason) return;
                      run(() => cancelInterview(iv.id, reason), "Interview cancelled");
                    }}
                  >
                    <X /> Cancel
                  </Button>
                  <Button size="sm" variant="glass" onClick={() => setScoring(scoring === iv.id ? null : iv.id)}>
                    Scorecard
                  </Button>
                </div>

                {scoring === iv.id && (
                  <div className="border-t border-border/40 pt-3 space-y-2">
                    {CRITERIA.map((c) => (
                      <div key={c} className="flex items-center justify-between gap-3">
                        <span className="text-xs">{c}</span>
                        <Input
                          className="h-8 w-20"
                          inputMode="numeric"
                          placeholder="0-100"
                          value={scores[c] ?? ""}
                          onChange={(e) => setScores((s) => ({ ...s, [c]: Number(e.target.value) }))}
                          aria-label={`${c} score`}
                        />
                      </div>
                    ))}
                    <Textarea
                      rows={2}
                      placeholder="Interviewer summary"
                      value={scoreNotes}
                      onChange={(e) => setScoreNotes(e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="gold"
                      disabled={busy}
                      onClick={() => {
                        const vals = CRITERIA.map((c) => Number(scores[c] ?? 0));
                        const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                        run(async () => {
                          await saveScorecard(iv.id, scores, avg, scoreNotes);
                          setScoring(null);
                          setScores({});
                          setScoreNotes("");
                        }, `Scorecard saved (${avg}%)`);
                      }}
                    >
                      Save scorecard
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};
