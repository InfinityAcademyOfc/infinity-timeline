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

  // Espera carregar user E profile associado (importante!)
  if (isLoading || (user && !userProfile && !isLoading)) { // Adicionado !isLoading para evitar loop se profile falhar
    // Se isLoading for false mas user existe e profile não, pode indicar erro no fetch do profile
     if (!isLoading && user && !userProfile) {
        console.warn("ProtectedRoute: User logado mas profile não encontrado. Verifique AuthContext e fetchUserProfileAndRoles.");
        // Decide o que fazer: mostrar erro, deslogar ou redirecionar para login?
        // Por segurança, redirecionar para login pode ser melhor.
         return <Navigate to={requireAdmin ? "/admin/login" : "/auth"} replace />;
     }
     // Enquanto carrega, mostra spinner
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Se NÃO estiver logado...
  if (!user) {
     // Se tentar acessar admin sem logar, vai para /admin/login
     if (requireAdmin) return <Navigate to="/admin/login" replace />;
     // Senão (tentar acessar cliente), vai para /auth (login cliente)
     return <Navigate to="/auth" replace />;
  }

  // ---- Usuário ESTÁ logado a partir daqui ----

  // Se a rota exige Admin, mas o usuário logado NÃO é admin
  if (requireAdmin && !isAdmin) {
     // Redireciona cliente para o dashboard dele
    return <Navigate to="/cliente/dashboard" replace />;
  }

  // Se a rota exige Cliente, mas o usuário logado É admin
  if (requireClient && isAdmin) {
     // Redireciona admin para o dashboard dele
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Se passou em todas as verificações (usuário logado e com role correto), renderiza a rota
  return children;
};

export default ProtectedRoute;
