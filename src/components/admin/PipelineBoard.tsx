import { useState } from "react";
import { toast } from "sonner";
import { STAGES, STAGE_LABELS, changeStage, type Application, type Stage } from "@/lib/recruitment";

export const PipelineBoard = ({
  applications,
  onOpen,
  onChanged,
}: {
  applications: Application[];
  onOpen: (a: Application) => void;
  onChanged: () => void;
}) => {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  async function move(id: string, stage: Stage) {
    const current = applications.find((a) => a.id === id);
    if (!current || current.stage === stage) return;
    try {
      await changeStage(id, stage);
      toast.success(`Moved to ${STAGE_LABELS[stage]}`);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not move applicant");
    }
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {STAGES.map((stage) => {
          const rows = applications.filter((a) => a.stage === stage);
          return (
            <section
              key={stage}
              aria-label={STAGE_LABELS[stage]}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setOverStage(null);
                if (dragId) move(dragId, stage);
                setDragId(null);
              }}
              className={`w-72 shrink-0 rounded-2xl p-3 border transition-colors ${
                overStage === stage ? "border-gold bg-gold/5" : "border-border/50 glass"
              }`}
            >
              <header className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {STAGE_LABELS[stage]}
                </h3>
                <span className="font-tactical text-sm text-gold">{rows.length}</span>
              </header>
              <div className="space-y-2 min-h-[80px]">
                {rows.length === 0 && (
                  <p className="text-xs text-muted-foreground/70 px-1 py-6 text-center">Empty</p>
                )}
                {rows.map((a) => (
                  <article
                    key={a.id}
                    draggable
                    onDragStart={() => setDragId(a.id)}
                    onDragEnd={() => setDragId(null)}
                    tabIndex={0}
                    role="button"
                    onClick={() => onOpen(a)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpen(a);
                      }
                    }}
                    className="glass-strong rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-gold/40 border border-transparent focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    <div className="text-sm font-medium truncate">{a.full_name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {a.location} · {a.program ?? "No program"}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono text-[10px] text-gold">{a.reference_number ?? "—"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <label className="sr-only" htmlFor={`mv-${a.id}`}>
                      Move {a.full_name} to stage
                    </label>
                    <select
                      id={`mv-${a.id}`}
                      value={a.stage}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => move(a.id, e.target.value as Stage)}
                      className="mt-2 w-full bg-secondary rounded-md px-2 py-1 text-[10px]"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
