import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: AppRole;
}) => {
  const { session, roles, loading } = useAuth();
  const loc = useLocation();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" />
      </div>
    );
  if (!session)
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (requireRole && !roles.includes(requireRole))
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
