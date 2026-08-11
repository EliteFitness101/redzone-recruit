import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, Receipt, Users2, ShieldCheck, LogOut, User as UserIcon } from "lucide-react";

export default function Dashboard() {
  const { user, roles, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
    supabase.from("enrollments").select("*").eq("user_id", user.id)
      .then(({ data }) => setEnrollments(data ?? []));
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("affiliate_id", user.id)
      .then(({ count }) => setReferralCount(count ?? 0));
  }, [user]);

  const isAdmin = roles.includes("admin");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Dashboard" path="/dashboard" noindex />
      <Navbar />
      <main className="pt-28 pb-24 container">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-gold">Welcome back</div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">{profile?.full_name ?? user?.email}</h1>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
              Roles: {roles.join(", ") || "customer"}
            </div>
          </div>
          <Button variant="glass" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /> Sign out</Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={GraduationCap} label="Active courses" value={enrollments.length} />
          <StatCard icon={Receipt} label="Payments" value={orders.filter(o => o.status === "success").length} />
          <StatCard icon={Users2} label="Referrals" value={referralCount} />
          <StatCard icon={ShieldCheck} label="Deployment" value={roles.includes("student") ? "Ready" : "Pending"} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel title="Your Enrollments" cta={<Link to="/academy" className="text-gold text-sm">Open Academy →</Link>}>
            {enrollments.length === 0 ? (
              <Empty msg="No active enrollments." href="/pricing" cta="Choose a tier" />
            ) : (
              <ul className="space-y-2">
                {enrollments.map((e) => (
                  <li key={e.id} className="flex justify-between text-sm py-2 border-b border-border/40">
                    <span className="uppercase font-semibold">{e.tier}</span>
                    <span className="text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent Payments" cta={<Link to="/pricing" className="text-gold text-sm">New order →</Link>}>
            {orders.length === 0 ? (
              <Empty msg="No orders yet." href="/pricing" cta="Start training" />
            ) : (
              <ul className="space-y-2">
                {orders.slice(0, 5).map((o) => (
                  <li key={o.id} className="flex justify-between text-sm py-2 border-b border-border/40">
                    <span>{o.tier} — ₦{(o.amount_kobo / 100).toLocaleString()}</span>
                    <span className={o.status === "success" ? "text-gold" : "text-muted-foreground"}>{o.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Quick actions">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="glass" asChild><Link to="/profile"><UserIcon className="h-4 w-4" /> Profile</Link></Button>
              <Button variant="glass" asChild><Link to="/referrals">Referrals</Link></Button>
              <Button variant="gold" asChild><Link to="/apply">Apply for deployment</Link></Button>
              <Button variant="hero" asChild><Link to="/pricing">Upgrade tier</Link></Button>
            </div>
          </Panel>

          {isAdmin && (
            <Panel title="Admin">
              <p className="text-sm text-muted-foreground mb-3">Manage applications, orders, deployments and courses.</p>
              <Button variant="gold" asChild><Link to="/admin">Open Admin Console</Link></Button>
            </Panel>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value }: any) => (
  <div className="glass rounded-2xl p-5">
    <Icon className="h-5 w-5 text-gold mb-3" />
    <div className="font-tactical text-3xl text-gradient-gold">{value}</div>
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
  </div>
);
const Panel = ({ title, children, cta }: any) => (
  <div className="glass-strong rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-display font-bold uppercase tracking-widest text-sm">{title}</h3>
      {cta}
    </div>
    {children}
  </div>
);
const Empty = ({ msg, href, cta }: any) => (
  <div className="text-center py-4">
    <p className="text-sm text-muted-foreground mb-3">{msg}</p>
    <Button variant="hero" size="sm" asChild><Link to={href}>{cta}</Link></Button>
  </div>
);
