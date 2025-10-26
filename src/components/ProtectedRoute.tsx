// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireClient?: boolean;
};

const ProtectedRoute = ({ children, requireAdmin, requireClient }: ProtectedRouteProps) => {
  const { user, isAdmin, isLoading, userProfile } = useAuth();

  if (isLoading || (user && !userProfile)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Se não estiver logado...
  if (!user) {
     // Se tentar acessar admin sem logar, vai para /admin/login (a rota correta)
     if (requireAdmin) return <Navigate to="/admin/login" replace />; // <-- CORRIGIDO AQUI
     // Senão (tentar acessar cliente), vai para /auth (login cliente)
     return <Navigate to="/auth" replace />;
  }

  // Se a rota exige Admin, mas o usuário NÃO é admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/cliente/dashboard" replace />;
  }

  // Se a rota exige Cliente, mas o usuário É admin
  if (requireClient && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
