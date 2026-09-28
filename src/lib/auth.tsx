import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "affiliate" | "student" | "customer";

interface AuthState {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({ session: null, user: null, roles: [], loading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      if (!s) setRoles([]);
      else setTimeout(() => loadRoles(s.user.id), 0);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session && localStorage.getItem("martialx_remember") === "false") {
        await supabase.auth.signOut();
        setSession(null); setRoles([]); setLoading(false); return;
      }
      setSession(data.session);
      if (data.session) loadRoles(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadRoles(_uid: string) {
    // Resolve authorization through a server-controlled RPC bound to auth.uid().
    // This avoids relying on direct client reads of user_roles/RLS for role loading.
    const { data, error } = await supabase.rpc("get_my_app_roles");
    if (error) {
      console.error("Failed to load application roles", error);
      setRoles([]);
      return;
    }
    setRoles((data ?? []).map((r: { role: string }) => r.role as AppRole));
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null); setRoles([]);
  };

  return <AuthCtx.Provider value={{ session, user: session?.user ?? null, roles, loading, signOut }}>{children}</AuthCtx.Provider>;
};
export const useAuth = () => useContext(AuthCtx);
