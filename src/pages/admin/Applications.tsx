import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Download, Search, RotateCcw } from "lucide-react";
import { ApplicantDrawer } from "@/components/admin/ApplicantDrawer";
import { PipelineBoard } from "@/components/admin/PipelineBoard";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import {
  PROGRAMS,
  STAGES,
  STAGE_LABELS,
  downloadCsv,
  listAllApplications,
  listApplications,
  listRecruiters,
  type Application,
  type ApplicationFilters,
  type Recruiter,
  type Stage,
} from "@/lib/recruitment";

const PAGE_SIZE = 25;
const selectCls =
  "mt-1.5 flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const EMPTY: ApplicationFilters = {
  search: "",
  stage: "all",
  program: "all",
  cohort: "all",
  source: "all",
  campaign: "all",
  recruiter: "all",
  from: "",
  to: "",
};

export default function AdminApplications() {
  const [sp, setSp] = useSearchParams();
  const [filters, setFilters] = useState<ApplicationFilters>({ ...EMPTY, search: sp.get("ref") ?? "" });
  const [search, setSearch] = useState(filters.search ?? "");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Application[]>([]);
  const [boardRows, setBoardRows] = useState<Application[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [tab, setTab] = useState("table");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, all] = await Promise.all([
        listApplications(filters, page, PAGE_SIZE),
        listAllApplications(filters),
      ]);
      setRows(list.rows);
      setCount(list.count);
      setBoardRows(all);
      if (selected) setSelected(all.find((a) => a.id === selected.id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listRecruiters().then(setRecruiters);
  }, []);

  useEffect(() => {
    const appId = sp.get("app");
    if (appId && boardRows.length) {
      const found = boardRows.find((a) => a.id === appId);
      if (found) setSelected(found);
    }
  }, [sp, boardRows]);

  const cohorts = useMemo(
    () => Array.from(new Set(boardRows.map((r) => r.cohort).filter(Boolean))) as string[],
    [boardRows],
  );
  const sources = useMemo(
    () => Array.from(new Set(boardRows.map((r) => r.source).filter(Boolean))) as string[],
    [boardRows],
  );
  const campaigns = useMemo(
    () => Array.from(new Set(boardRows.map((r) => r.campaign).filter(Boolean))) as string[],
    [boardRows],
  );

  const set = (patch: Partial<ApplicationFilters>) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const recruiterName = (id: string | null) =>
    (id && recruiters.find((r) => r.user_id === id)?.display_name) || "Unassigned";

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Applicant Dashboard" path="/admin/applications" description="Manage recruitment applications" />
      <Navbar />
      <main className="pt-28 pb-24 container">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-gold">Recruitment Operations</div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">Applicant Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                if (!boardRows.length) return toast.error("Nothing to export");
                downloadCsv(boardRows, `applications-${new Date().toISOString().slice(0, 10)}.csv`);
                toast.success(`Exported ${boardRows.length} applications`);
              }}
            >
              <Download /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <form
          className="glass rounded-2xl p-4 md:p-5 grid gap-3 md:grid-cols-4 mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            set({ search });
          }}
        >
          <div className="md:col-span-2">
            <Label htmlFor="f-search">Search</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="f-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, phone or reference"
              />
              <Button type="submit" variant="glass" aria-label="Search applicants">
                <Search />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="f-stage">Status</Label>
            <select id="f-stage" className={selectCls} value={filters.stage} onChange={(e) => set({ stage: e.target.value })}>
              <option value="all">All stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="f-program">Program</Label>
            <select id="f-program" className={selectCls} value={filters.program} onChange={(e) => set({ program: e.target.value })}>
              <option value="all">All programs</option>
              {PROGRAMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="f-cohort">Cohort</Label>
            <select id="f-cohort" className={selectCls} value={filters.cohort} onChange={(e) => set({ cohort: e.target.value })}>
              <option value="all">All cohorts</option>
              {cohorts.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="f-campaign">Campaign</Label>
            <select id="f-campaign" className={selectCls} value={filters.campaign} onChange={(e) => set({ campaign: e.target.value })}>
              <option value="all">All campaigns</option>
              {campaigns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="f-source">Source</Label>
            <select id="f-source" className={selectCls} value={filters.source} onChange={(e) => set({ source: e.target.value })}>
              <option value="all">All sources</option>
              {sources.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="f-recruiter">Recruiter</Label>
            <select id="f-recruiter" className={selectCls} value={filters.recruiter} onChange={(e) => set({ recruiter: e.target.value })}>
              <option value="all">All recruiters</option>
              <option value="unassigned">Unassigned</option>
              {recruiters.map((r) => <option key={r.user_id} value={r.user_id}>{r.display_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 md:col-span-2">
            <div>
              <Label htmlFor="f-from">From</Label>
              <Input id="f-from" type="date" className="mt-1.5" value={filters.from} onChange={(e) => set({ from: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="f-to">To</Label>
              <Input id="f-to" type="date" className="mt-1.5" value={filters.to} onChange={(e) => set({ to: e.target.value })} />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch("");
                setFilters({ ...EMPTY });
                setPage(1);
                setSp({});
              }}
            >
              <RotateCcw /> Reset
            </Button>
          </div>
        </form>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="glass mb-6">
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            {error ? (
              <ErrorState message={error} onRetry={load} />
            ) : loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="glass-strong rounded-2xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Recruitment applications</caption>
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                        {["Applicant", "Email", "Phone", "Program", "Cohort", "Stage", "Applied", "Source", "Recruiter"].map((c) => (
                          <th key={c} scope="col" className="px-4 py-3 whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr
                          key={r.id}
                          tabIndex={0}
                          onClick={() => setSelected(r)}
                          onKeyDown={(e) => e.key === "Enter" && setSelected(r)}
                          className="border-t border-border/40 cursor-pointer hover:bg-secondary/40 focus:outline-none focus:bg-secondary/40"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium">{r.full_name}</div>
                            <div className="font-mono text-[10px] text-gold">{r.reference_number ?? "—"}</div>
                          </td>
                          <td className="px-4 py-3">{r.email ?? "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{r.phone}</td>
                          <td className="px-4 py-3">{r.program ?? "—"}</td>
                          <td className="px-4 py-3">{r.cohort ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-[10px] uppercase whitespace-nowrap">
                              {STAGE_LABELS[r.stage as Stage] ?? r.stage}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{r.source ?? "direct"}</td>
                          <td className="px-4 py-3">{recruiterName(r.assigned_recruiter)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <nav className="flex items-center justify-between mt-4" aria-label="Pagination">
                  <span className="text-xs text-muted-foreground">
                    {count} applicant{count === 1 ? "" : "s"} · page {page} of {pages}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="glass" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button variant="glass" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </nav>
              </>
            )}
          </TabsContent>

          <TabsContent value="pipeline">
            {error ? (
              <ErrorState message={error} onRetry={load} />
            ) : loading ? (
              <Skeleton className="h-72 w-full rounded-2xl" />
            ) : boardRows.length === 0 ? (
              <EmptyState />
            ) : (
              <PipelineBoard applications={boardRows} onOpen={setSelected} onChanged={load} />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ApplicantDrawer
        application={selected}
        recruiters={recruiters}
        onClose={() => setSelected(null)}
        onChanged={load}
      />
      <Footer />
    </div>
  );
}

const EmptyState = () => (
  <div className="glass rounded-2xl py-16 text-center">
    <p className="font-display text-xl">No applicants match these filters</p>
    <p className="text-sm text-muted-foreground mt-2">Adjust the filters or wait for new applications to arrive.</p>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="glass rounded-2xl py-16 text-center">
    <p className="font-display text-xl text-destructive">Could not load applications</p>
    <p className="text-sm text-muted-foreground mt-2">{message}</p>
    <Button className="mt-4" variant="glass" onClick={onRetry}>Try again</Button>
  </div>
);
