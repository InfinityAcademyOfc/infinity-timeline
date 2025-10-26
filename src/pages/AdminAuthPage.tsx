// src/pages/AdminAuthPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const AdminAuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  // Pega authStatus em vez de isLoadingAuth
  const { signIn, user, authStatus, isAdmin } = useAuth();

  // Efeito para redirecionar se já estiver logado como admin (usando authStatus)
  useEffect(() => {
    // Se autenticado E é admin
    if (authStatus === 'authenticated' && isAdmin) {
      console.log("AdminAuthPage: Já logado como admin, redirecionando para dashboard."); // Log
      // Tenta pegar rota original do state, senão vai para dashboard
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [authStatus, isAdmin, navigate, location.state]);


  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingForm(true);

    // Chama signIn que retorna { success, error, isActualAdmin }
    const { success, error, isActualAdmin } = await signIn(email, password);

    if (!success || error) {
      toast({
        title: 'Acesso Não Autorizado',
        description: 'Acesso apenas para administradores.',
        variant: 'destructive',
      });
    } else {
      // Se signIn teve sucesso
      if (isActualAdmin) {
        // Se o usuário logado É admin
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando...', // O redirecionamento será pelo ProtectedRoute ou useEffect
        });
      } else {
        // Se o usuário logado NÃO é admin (era cliente)
        toast({
          title: 'Acesso Não Autorizado',
          description: 'Acesso apenas para administradores.',
          variant: 'destructive',
        });
      }
    }
    setIsLoadingForm(false);
  };

  // Mostra loading global se o AuthContext ainda está carregando
  if (authStatus === 'loading') {
     return (
       <div className="flex h-screen w-full items-center justify-center">
         <LoadingSpinner />
       </div>
     );
  }

  // Se já estiver logado como admin, não renderiza o form (será redirecionado)
  if (user && isAdmin) {
     console.log("AdminAuthPage: Renderizando null pois já está logado como admin."); // Log
     return null; // ou um spinner rápido
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login Administrador</CardTitle>
          <CardDescription className="text-center">
            Acesso restrito ao painel de controle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminSignIn} className="grid gap-4">
            {/* Campos de Email e Senha */}
             <div className="grid gap-2">
               <Label htmlFor="email">Email</Label>
               <Input id="email" type="email" placeholder="admin@infinitytimeline.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoadingForm}/>
             </div>
             <div className="grid gap-2">
               <Label htmlFor="password">Senha</Label>
               <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoadingForm}/>
             </div>
            <Button type="submit" className="w-full" disabled={isLoadingForm}>
              {isLoadingForm ? <LoadingSpinner /> : 'Entrar'}
            </Button>
            <div className="mt-4 text-center text-sm">
               <Link to="/" className="underline"> Voltar para o Início </Link>
             </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuthPage;
