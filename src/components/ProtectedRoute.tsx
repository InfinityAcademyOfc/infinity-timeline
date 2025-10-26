// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom'; // Adicionado useLocation
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireClient?: boolean;
};

const ProtectedRoute = ({ children, requireAdmin, requireClient }: ProtectedRouteProps) => {
  const { user, isAdmin, isLoading, userProfile } = useAuth();
  const location = useLocation(); // Pega a rota atual

  // ESTADO DE CARREGAMENTO: Mostra spinner enquanto isLoading é true OU
  // se o usuário existe mas o perfil ainda não carregou (evita renderização parcial)
  if (isLoading || (user && !userProfile)) {
    // Adiciona uma verificação extra: se não está carregando, mas user existe e profile não, loga um aviso.
    if (!isLoading && user && !userProfile) {
       console.warn("ProtectedRoute: User logado mas profile não encontrado após carregamento inicial. Verifique AuthContext.");
       // Neste estado incerto, talvez seja melhor redirecionar para login para forçar recarga.
       // return <Navigate to={requireAdmin ? "/admin/login" : "/auth"} replace />;
    }
    // Mostra Spinner durante o carregamento normal ou enquanto espera o perfil
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // ---- ESTADOS NÃO-CARREGANDO A PARTIR DAQUI ----

  // CASO 1: Usuário NÃO está logado
  if (!user) {
    // Se tentar acessar rota protegida (admin ou cliente) sem logar, redireciona para o login apropriado
    if (requireAdmin) return <Navigate to="/admin/login" state={{ from: location }} replace />; // Guarda rota original
    if (requireClient) return <Navigate to="/auth" state={{ from: location }} replace />; // Guarda rota original
    // Se não for rota protegida (raro chegar aqui com essa estrutura), permite acesso (ou redireciona para login geral?)
    // Por segurança, vamos redirecionar para o login cliente como padrão se não for rota protegida.
    // return <Navigate to="/auth" state={{ from: location }} replace />;
     return children; // Permite acesso a rotas não protegidas se não estiver logado (Ex: "/")
  }

  // ---- Usuário ESTÁ logado a partir daqui ----

  // CASO 2: Usuário LOGADO tentando acessar uma PÁGINA DE LOGIN
  // Se está logado E está na página de login admin OU cliente, redireciona para o dashboard correto
  if (location.pathname === '/admin/login' || location.pathname === '/auth') {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/cliente/dashboard'} replace />;
  }

  // CASO 3: Usuário LOGADO acessando ROTA PROTEGIDA ERRADA
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

  // CASO 4: Usuário LOGADO acessando ROTA PROTEGIDA CORRETA (ou rota pública)
  // Se passou por todas as verificações anteriores, permite o acesso
  return children;
};

export default ProtectedRoute;
