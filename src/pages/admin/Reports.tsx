import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { STAGES, STAGE_LABELS, getStats, listRecruiters, type RecruitmentStats, type Recruiter } from "@/lib/recruitment";

export default function AdminReports() {
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adSpend, setAdSpend] = useState("");

  const load = () => {
    setError(null);
    getStats().then(setStats).catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    listRecruiters().then(setRecruiters);
  }, []);

  const cpa = useMemo(() => {
    const spend = Number(adSpend);
    if (!stats?.total || !spend) return null;
    return spend / stats.total;
  }, [adSpend, stats]);

  if (error)
    return (
      <Shell>
        <div className="glass rounded-2xl py-16 text-center">
          <p className="font-display text-xl text-destructive">Could not load reports</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <Button className="mt-4" variant="glass" onClick={load}>Try again</Button>
        </div>
      </Shell>
    );

  if (!stats)
    return (
      <Shell>
        <div className="grid md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </Shell>
    );

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.count));
  const funnel = STAGES.map((s) => ({ stage: s, count: stats.by_stage[s] ?? 0 }));

  return (
    <Shell>
      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <Stat label="Total applications" value={stats.total} />
        <Stat label="Today" value={stats.today} />
        <Stat label="This week" value={stats.week} />
        <Stat label="Cost per application" value={cpa ? `₦${cpa.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"} />
      </div>

      <div className="glass rounded-2xl p-5 mb-10 max-w-sm">
        <Label htmlFor="spend">Ad spend (₦) for CPA</Label>
        <Input id="spend" className="mt-1.5" inputMode="numeric" value={adSpend} onChange={(e) => setAdSpend(e.target.value)} placeholder="e.g. 250000" />
      </div>

      <Panel title="Daily applications (30 days)">
        {stats.daily.length === 0 ? (
          <Empty />
        ) : (
          <div className="flex items-end gap-1 h-40" role="img" aria-label="Daily applications bar chart">
            {stats.daily.map((d) => (
              <div key={d.date} className="flex-1 min-w-1 group relative">
                <div
                  className="bg-gradient-to-t from-gold/40 to-gold rounded-t"
                  style={{ height: `${(d.count / maxDaily) * 100}%` }}
                  title={`${d.date}: ${d.count}`}
                />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Funnel conversion by stage">
        <ul className="space-y-2">
          {funnel.map((f) => (
            <li key={f.stage} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-xs text-muted-foreground">{STAGE_LABELS[f.stage]}</span>
              <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-gradient-red" style={{ width: `${stats.total ? (f.count / stats.total) * 100 : 0}%` }} />
              </div>
              <span className="w-20 text-right text-xs">
                {f.count} · {stats.total ? Math.round((f.count / stats.total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid md:grid-cols-2 gap-6">
        <Panel title="Program popularity"><Breakdown data={stats.by_program} total={stats.total} /></Panel>
        <Panel title="Cohort fill"><Breakdown data={stats.by_cohort} total={stats.total} /></Panel>
        <Panel title="Source performance"><Breakdown data={stats.by_source} total={stats.total} /></Panel>
        <Panel title="Campaign performance"><Breakdown data={stats.by_campaign} total={stats.total} /></Panel>
        <Panel title="Recruiter performance">
          <Breakdown
            data={Object.fromEntries(
              Object.entries(stats.by_recruiter).map(([k, v]) => [
                recruiters.find((r) => r.user_id === k)?.display_name ?? (k === "unassigned" ? "Unassigned" : k.slice(0, 8)),
                v,
              ]),
            )}
            total={stats.total}
          />
        </Panel>
        <Panel title="Stage aging (avg days since last update)">
          <ul className="space-y-2 text-sm">
            {Object.entries(stats.stage_aging).length === 0 && <Empty />}
            {Object.entries(stats.stage_aging).map(([k, v]) => (
              <li key={k} className="flex justify-between border-b border-border/40 pb-1">
                <span className="text-muted-foreground">{STAGE_LABELS[k as keyof typeof STAGE_LABELS] ?? k}</span>
                <span>{v} days</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-10">
        <Button variant="glass" asChild><Link to="/admin/applications">Open applicant dashboard</Link></Button>
      </div>
    </Shell>
  );
}

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground">
    <SEO title="Recruitment Reports" path="/admin/reports" description="Recruitment funnel analytics" />
    <Navbar />
    <main className="pt-28 pb-24 container">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-gold">Recruitment Operations</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Reports</h1>
      </div>
      {children}
    </main>
    <Footer />
  </div>
);

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="glass rounded-2xl p-5">
    <div className="font-tactical text-2xl text-gradient-gold">{value}</div>
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
  </div>
);

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="glass-strong rounded-2xl p-5 mb-6">
    <h2 className="font-display uppercase tracking-widest text-sm mb-4">{title}</h2>
    {children}
  </section>
);

const Empty = () => <p className="text-sm text-muted-foreground py-6 text-center">No data yet.</p>;

const Breakdown = ({ data, total }: { data: Record<string, number>; total: number }) => {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <Empty />;
  return (
    <ul className="space-y-2">
      {entries.map(([k, v]) => (
        <li key={k} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-xs text-muted-foreground" title={k}>{k}</span>
          <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-gold" style={{ width: `${total ? (v / total) * 100 : 0}%` }} />
          </div>
          <span className="w-10 text-right text-xs">{v}</span>
        </li>
      ))}
    </ul>
  );
};
