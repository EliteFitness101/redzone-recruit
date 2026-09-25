import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type FarmRole = "client" | "operations" | "supervisor" | "executive";

export function FarmAccessRoute({ children, roles }: { children: React.ReactNode; roles?: FarmRole[] }) {
  const { user, session, loading: authLoading } = useAuth();
  const loc = useLocation();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!session || !user) { if (alive) { setAllowed(false); setChecking(false); } return; }
      const { data: admin } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (admin) { if (alive) { setAllowed(true); setChecking(false); } return; }
      const { data } = await supabase.from("farm_user_access").select("access_role").eq("user_id", user.id).eq("active", true);
      const ok = !roles?.length || (data ?? []).some((r: any) => roles.includes(r.access_role));
      if (alive) { setAllowed(ok); setChecking(false); }
    })();
    return () => { alive = false; };
  }, [session, user?.id, roles?.join("|")]);

  if (authLoading || checking) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gold" /></div>;
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
