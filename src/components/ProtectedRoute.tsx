import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireClient?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false, requireClient = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // CRITICAL: Wait for auth state AND roles to load before proceeding
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary glow-pulse"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin trying to access client-only routes
  if (requireClient && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Non-admin trying to access admin routes
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/cliente/dashboard" replace />;
  }

  return <>{children}</>;
};