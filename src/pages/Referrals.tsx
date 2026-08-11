import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Copy, Gift, Users } from "lucide-react";
import { toast } from "sonner";
import { SITE } from "@/config/site";

export default function Referrals() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("referrals").select("*, orders(amount_kobo,tier)").eq("affiliate_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, [user]);

  const link = profile ? `${SITE.domain}/register?ref=${profile.referral_code}` : "";
  const earnings = rows.reduce((s, r) => s + (r.commission_kobo ?? 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Referrals" path="/referrals" noindex />
      <Navbar />
      <main className="pt-28 pb-24 container max-w-4xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4 text-xs uppercase tracking-[0.3em] text-gold">
            <Gift className="h-3.5 w-3.5" /> Affiliate
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold">Earn ₦ per referral</h1>
        </div>

        <div className="glass-strong rounded-3xl p-8 mb-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Your referral link</div>
          <div className="mt-2 flex items-center gap-3">
            <code className="text-sm md:text-base text-gold break-all">{link || "…"}</code>
            <Button variant="tactical" size="sm" onClick={() => { navigator.clipboard.writeText(link); toast.success("Copied"); }}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Referrals" v={rows.length} />
            <Stat label="Earned" v={`₦${(earnings / 100).toLocaleString()}`} />
            <Stat label="Code" v={profile?.referral_code ?? "—"} />
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm mb-4"><Users className="inline h-4 w-4 text-gold mr-2" />History</h3>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Share your link to start earning.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {rows.map((r) => (
                <li key={r.id} className="py-3 flex justify-between text-sm">
                  <span>{r.orders?.tier ?? "—"}</span>
                  <span className="text-gold">₦{(r.commission_kobo / 100).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

const Stat = ({ label, v }: any) => (
  <div className="rounded-xl bg-secondary/50 p-4 text-center">
    <div className="font-tactical text-xl text-gradient-gold">{v}</div>
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
  </div>
);
