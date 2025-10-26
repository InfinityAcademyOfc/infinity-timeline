// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireClient?: boolean;
};

const ProtectedRoute = ({ children, requireAdmin, requireClient }: ProtectedRouteProps) => {
  // Usa o novo authStatus e isAdmin do contexto refatorado
  const { user, isAdmin, authStatus, userProfile } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', { // Log de estado
     pathname: location.pathname,
     authStatus,
     user: user?.id ?? 'null',
     isAdmin,
     requireAdmin,
     requireClient,
     profileLoaded: !!userProfile
  });

  // ESTADO DE CARREGAMENTO: Mostra spinner APENAS se authStatus for 'loading'
  if (authStatus === 'loading') {
    console.log('ProtectedRoute: Status = loading, mostrando Spinner.'); // Log
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // ---- ESTADOS NÃO-CARREGANDO ('authenticated' ou 'unauthenticated') A PARTIR DAQUI ----

  // CASO 1: Usuário NÃO está autenticado (authStatus === 'unauthenticated')
  if (authStatus === 'unauthenticated') {
     console.log('ProtectedRoute: Status = unauthenticated.'); // Log
    // Se tentar acessar rota protegida, redireciona para o login apropriado
    if (requireAdmin) {
       console.log('ProtectedRoute: Redirecionando para /admin/login.'); // Log
       return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    if (requireClient) {
       console.log('ProtectedRoute: Redirecionando para /auth.'); // Log
       return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    // Se for rota pública (não requireAdmin nem requireClient), permite acesso
     console.log('ProtectedRoute: Rota pública, permitindo acesso não autenticado.'); // Log
    return children;
  }

  // ---- Usuário ESTÁ autenticado (authStatus === 'authenticated') a partir daqui ----
   console.log('ProtectedRoute: Status = authenticated.'); // Log

  // CASO 2: Usuário AUTENTICADO tentando acessar uma PÁGINA DE LOGIN
  // Redireciona para o dashboard correto baseado no isAdmin (agora confiável)
  if (location.pathname === '/admin/login' || location.pathname === '/auth') {
     const targetDashboard = isAdmin ? '/admin/dashboard' : '/cliente/dashboard';
     console.log(`ProtectedRoute: Usuário logado em página de login, redirecionando para ${targetDashboard}.`); // Log
    return <Navigate to={targetDashboard} replace />;
  }

  // CASO 3: Usuário AUTENTICADO acessando ROTA PROTEGIDA ERRADA
  // Se a rota exige Admin, mas o usuário autenticado NÃO é admin
  if (requireAdmin && !isAdmin) {
     console.log('ProtectedRoute: Cliente tentando acessar rota admin, redirecionando para /cliente/dashboard.'); // Log
    return <Navigate to="/cliente/dashboard" replace />;
  }
  // Se a rota exige Cliente, mas o usuário autenticado É admin
  if (requireClient && isAdmin) {
     console.log('ProtectedRoute: Admin tentando acessar rota cliente, redirecionando para /admin/dashboard.'); // Log
    return <Navigate to="/admin/dashboard" replace />;
  }

  // CASO 4: Usuário AUTENTICADO acessando ROTA PROTEGIDA CORRETA (ou rota pública)
   console.log('ProtectedRoute: Acesso permitido.'); // Log
  // Se passou por todas as verificações, permite o acesso
  return children;
};

export default ProtectedRoute;
