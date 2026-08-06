import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { completeTask, createTask, listTasks, type RecruiterTask } from "@/lib/recruitmentOps";
import type { Recruiter } from "@/lib/recruitment";

const selectCls =
  "mt-1.5 flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export const TasksPanel = ({
  applicationId,
  recruiters,
}: {
  applicationId: string;
  recruiters: Recruiter[];
}) => {
  const [tasks, setTasks] = useState<RecruiterTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState("");

  const load = () =>
    listTasks(applicationId)
      .then(setTasks)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  return (
    <div className="space-y-5 pt-4">
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Follow-up task</div>
        <div>
          <Label htmlFor="t-title">Title</Label>
          <Input id="t-title" className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Call applicant to confirm documents" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="t-due">Due</Label>
            <Input id="t-due" type="datetime-local" className="mt-1.5" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="t-assignee">Assign to</Label>
            <select id="t-assignee" className={selectCls} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Me</option>
              {recruiters.map((r) => <option key={r.user_id} value={r.user_id}>{r.display_name}</option>)}
            </select>
          </div>
        </div>
        <Textarea rows={2} placeholder="Details" value={details} onChange={(e) => setDetails(e.target.value)} />
        <Button
          variant="gold"
          disabled={busy || !title.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              await createTask({
                application_id: applicationId,
                title,
                details,
                due_at: due || undefined,
                assigned_to: assignee || undefined,
              });
              setTitle("");
              setDetails("");
              setDue("");
              toast.success("Task created");
              await load();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not create task");
            } finally {
              setBusy(false);
            }
          }}
        >
          Add task
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gold" /></div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No tasks yet.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const overdue = !t.completed_at && t.due_at && new Date(t.due_at) < new Date();
            return (
              <li key={t.id} className="glass rounded-xl p-3 text-sm flex items-start justify-between gap-3">
                <div>
                  <div className={t.completed_at ? "line-through text-muted-foreground" : "font-medium"}>{t.title}</div>
                  {t.details && <p className="text-xs text-muted-foreground">{t.details}</p>}
                  {t.due_at && (
                    <Badge variant={overdue ? "destructive" : "secondary"} className="text-[10px] mt-1">
                      due {new Date(t.due_at).toLocaleString()}
                    </Badge>
                  )}
                </div>
                {!t.completed_at && (
                  <Button
                    size="sm"
                    variant="glass"
                    onClick={async () => {
                      await completeTask(t.id);
                      toast.success("Task completed");
                      load();
                    }}
                  >
                    <CheckCircle2 /> Done
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
