import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Row = Record<string, any>;

const APPLICATION_STATUSES = ["submitted", "reviewing", "vetted", "approved", "deployed", "rejected"];
const ORDER_STATUSES = ["pending", "success", "failed", "refunded"];
const ROLES = ["customer", "student", "affiliate", "admin"] as const;

export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Row[]>([]);
  const [applications, setApplications] = useState<Row[]>([]);
  const [enrollments, setEnrollments] = useState<Row[]>([]);
  const [referrals, setReferrals] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Row[]>([]);
  const [userRoles, setUserRoles] = useState<Row[]>([]);
  const [courses, setCourses] = useState<Row[]>([]);
  const [deployments, setDeployments] = useState<Row[]>([]);

  async function loadAll() {
    setLoading(true);
    const [o, a, e, r, p, ur, c, d] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("applications").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("enrollments").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_roles").select("*"),
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("deployments").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setOrders(o.data ?? []);
    setApplications(a.data ?? []);
    setEnrollments(e.data ?? []);
    setReferrals(r.data ?? []);
    setProfiles(p.data ?? []);
    setUserRoles(ur.data ?? []);
    setCourses(c.data ?? []);
    setDeployments(d.data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  const totalRevenueKobo = orders
    .filter((o) => o.status === "success")
    .reduce((s, o) => s + (o.amount_kobo ?? 0), 0);

  const applicantConversion = applications.length
    ? Math.round(
        (applications.filter((a) => ["approved", "deployed"].includes(a.status)).length /
          applications.length) *
          100,
      )
    : 0;

  const totalCommissionKobo = referrals.reduce((s, r) => s + (r.commission_kobo ?? 0), 0);
  const paidCommissionKobo = referrals
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + (r.commission_kobo ?? 0), 0);

  const nameFor = (uid?: string | null) =>
    (uid && profiles.find((p) => p.id === uid)?.full_name) || uid?.slice(0, 8) || "—";
  const rolesFor = (uid: string) =>
    userRoles.filter((r) => r.user_id === uid).map((r) => r.role);

  async function updateApplicationStatus(id: string, status: string) {
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Application updated");
    loadAll();
  }
  async function updateOrderStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order updated");
    loadAll();
  }
  async function toggleRole(user_id: string, role: string, hasRole: boolean) {
    if (hasRole) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role as any);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id, role: role as any });
      if (error) return toast.error(error.message);
    }
    loadAll();
  }
  async function markCommissionPaid(id: string) {
    const { error } = await supabase.from("referrals").update({ status: "paid" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked paid");
    loadAll();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Admin Console" path="/admin" description="Admin operations console" />
      <Navbar />
      <main className="pt-28 pb-24 container">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-gold">Operations</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Admin Console</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" /></div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="glass mb-6 flex-wrap h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applicants</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="enrollments">Training</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="deployments">Deployments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-4 gap-4">
                <Stat label="Revenue" value={`₦${(totalRevenueKobo / 100).toLocaleString()}`} />
                <Stat label="Paid orders" value={orders.filter((o) => o.status === "success").length} />
                <Stat label="Applicants" value={applications.length} />
                <Stat label="Applicant conversion" value={`${applicantConversion}%`} />
                <Stat label="Active enrollments" value={enrollments.filter((e) => e.active).length} />
                <Stat label="Total commission" value={`₦${(totalCommissionKobo / 100).toLocaleString()}`} />
                <Stat label="Paid commission" value={`₦${(paidCommissionKobo / 100).toLocaleString()}`} />
                <Stat label="Deployments" value={deployments.length} />
              </div>
            </TabsContent>

            <TabsContent value="applications">
              <Table
                cols={["Name", "Phone", "Location", "Status", "Created", ""]}
                rows={applications.map((a) => [
                  a.full_name,
                  a.phone,
                  a.location,
                  a.status,
                  new Date(a.created_at).toLocaleDateString(),
                  <select
                    key={a.id}
                    defaultValue={a.status}
                    onChange={(e) => updateApplicationStatus(a.id, e.target.value)}
                    className="bg-secondary rounded-md px-2 py-1 text-xs"
                  >
                    {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>,
                ])}
              />
            </TabsContent>

            <TabsContent value="orders">
              <Table
                cols={["Reference", "User", "Tier", "Amount", "Status", "Date", ""]}
                rows={orders.map((o) => [
                  <code key="r" className="text-xs">{o.reference}</code>,
                  nameFor(o.user_id),
                  o.tier,
                  `₦${(o.amount_kobo / 100).toLocaleString()}`,
                  o.status,
                  new Date(o.created_at).toLocaleDateString(),
                  <select
                    key={o.id}
                    defaultValue={o.status}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                    className="bg-secondary rounded-md px-2 py-1 text-xs"
                  >
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>,
                ])}
              />
            </TabsContent>

            <TabsContent value="enrollments">
              <Table
                cols={["User", "Tier", "Active", "Enrolled"]}
                rows={enrollments.map((e) => [
                  nameFor(e.user_id),
                  e.tier,
                  e.active ? "Yes" : "No",
                  new Date(e.created_at).toLocaleDateString(),
                ])}
              />
              <h3 className="font-display uppercase tracking-widest text-sm mt-8 mb-3">Courses</h3>
              <Table
                cols={["Title", "Tier", "Published"]}
                rows={courses.map((c) => [c.title, c.tier, c.published ? "Yes" : "No"])}
              />
            </TabsContent>

            <TabsContent value="referrals">
              <Table
                cols={["Affiliate", "Referred", "Commission", "Status", ""]}
                rows={referrals.map((r) => [
                  nameFor(r.affiliate_id),
                  nameFor(r.referred_user_id),
                  `₦${(r.commission_kobo / 100).toLocaleString()}`,
                  r.status,
                  r.status !== "paid" && (
                    <Button key={r.id} variant="glass" size="sm" onClick={() => markCommissionPaid(r.id)}>
                      Mark paid
                    </Button>
                  ),
                ])}
              />
            </TabsContent>

            <TabsContent value="users">
              <Table
                cols={["Name", "Phone", "Referral code", "Roles"]}
                rows={profiles.map((p) => [
                  p.full_name ?? "—",
                  p.phone ?? "—",
                  p.referral_code ?? "—",
                  <div key={p.id} className="flex flex-wrap gap-1">
                    {ROLES.map((role) => {
                      const has = rolesFor(p.id).includes(role);
                      return (
                        <button
                          key={role}
                          onClick={() => toggleRole(p.id, role, has)}
                          className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-md border ${
                            has ? "bg-gold text-background border-gold" : "border-border text-muted-foreground hover:border-gold/40"
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>,
                ])}
              />
            </TabsContent>

            <TabsContent value="deployments">
              <Table
                cols={["User", "Firm", "Role", "Status", "Started"]}
                rows={deployments.map((d) => [
                  nameFor(d.user_id),
                  d.firm ?? "—",
                  d.role ?? "—",
                  d.status ?? "—",
                  d.start_date ? new Date(d.start_date).toLocaleDateString() : "—",
                ])}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="glass rounded-2xl p-5">
    <div className="font-tactical text-2xl text-gradient-gold">{value}</div>
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
  </div>
);

const Table = ({ cols, rows }: { cols: string[]; rows: any[][] }) => (
  <div className="glass-strong rounded-2xl overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
          {cols.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={cols.length} className="text-center py-8 text-muted-foreground">No records</td></tr>
        )}
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border/40">
            {r.map((cell, j) => <td key={j} className="px-4 py-3 align-top">{cell as any}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
