import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireCreator?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireCreator = false 
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isCreator } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireCreator && !isCreator) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
