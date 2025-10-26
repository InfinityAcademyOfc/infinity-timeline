// src/components/ProtectedRoute.tsx (CORRIGIDO para estrutura original)
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner'; // Usando import default

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireClient?: boolean; // ADICIONADO
};

const ProtectedRoute = ({ children, requireAdmin, requireClient }: ProtectedRouteProps) => {
  // Usa authStatus, isAdmin, user do AuthContext corrigido
  const { user, isAdmin, authStatus, userProfile } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', { // Log de estado
     pathname: location.pathname, authStatus, user: user?.id ?? 'null', isAdmin, requireAdmin, requireClient, profileLoaded: !!userProfile
  });

  // Mostra loading APENAS enquanto authStatus for 'loading'
  if (authStatus === 'loading') {
    console.log('ProtectedRoute: Status = loading.');
    return ( <div className="flex h-screen w-full items-center justify-center"><LoadingSpinner /></div> );
  }

  // --- Estados Não-Loading ---

  // CASO 1: Não autenticado
  if (authStatus === 'unauthenticated') {
     console.log('ProtectedRoute: Status = unauthenticated.');
    // Se tentar acessar rota protegida (admin ou cliente), redireciona para /auth
    if (requireAdmin || requireClient) {
        console.log('ProtectedRoute: Redirecionando não autenticado para /auth.');
        // Guarda a página que tentou acessar para redirecionar de volta após login
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    // Permite acesso a rotas públicas (ex: "/")
     console.log('ProtectedRoute: Rota pública, permitindo acesso não autenticado.');
    return children;
  }

  // --- Usuário Autenticado (authStatus === 'authenticated') ---
   console.log('ProtectedRoute: Status = authenticated.');

  // CASO 2: Autenticado tentando acessar PÁGINA DE LOGIN (/auth)
  // Redireciona para o dashboard correto
  if (location.pathname === '/auth') {
     const targetDashboard = isAdmin ? '/admin/dashboard' : '/cliente/dashboard';
     console.log(`ProtectedRoute: Usuário logado em /auth, redirecionando para ${targetDashboard}.`);
    return <Navigate to={targetDashboard} replace />;
  }

  // CASO 3: Autenticado acessando ROTA PROTEGIDA ERRADA
  if (requireAdmin && !isAdmin) { // Rota admin, mas user é cliente
     console.log('ProtectedRoute: Cliente em rota admin -> /cliente/dashboard.');
    return <Navigate to="/cliente/dashboard" replace />;
  }
  if (requireClient && isAdmin) { // Rota cliente, mas user é admin
     console.log('ProtectedRoute: Admin em rota cliente -> /admin/dashboard.');
    return <Navigate to="/admin/dashboard" replace />;
  }

  // CASO 4: Autenticado acessando ROTA PROTEGIDA CORRETA (ou rota pública)
   console.log('ProtectedRoute: Acesso permitido.');
  return children;
};

export default ProtectedRoute;
