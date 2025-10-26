// src/pages/AuthPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  // Pega authStatus em vez de isLoadingAuth
  const { signIn, user, authStatus, isAdmin } = useAuth();

  // Efeito para redirecionar se já estiver logado como cliente (usando authStatus)
  useEffect(() => {
    // Se autenticado E NÃO é admin
    if (authStatus === 'authenticated' && !isAdmin) {
      console.log("AuthPage: Já logado como cliente, redirecionando para dashboard."); // Log
      // Tenta pegar rota original do state, senão vai para dashboard
      const from = location.state?.from?.pathname || '/cliente/dashboard';
      navigate(from, { replace: true });
    }
  }, [authStatus, isAdmin, navigate, location.state]);


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingForm(true);

    // Chama signIn que retorna { success, error, isActualAdmin }
    const { success, error, isActualAdmin } = await signIn(email, password);

    if (!success || error) {
      toast({
        title: 'Erro no Login',
        description: 'Credencial Inválida.',
        variant: 'destructive',
      });
    } else {
      // Se signIn teve sucesso
      if (!isActualAdmin) {
         // Se o usuário logado NÃO É admin (é cliente)
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando...', // O redirecionamento será pelo ProtectedRoute ou useEffect
        });
      } else {
        // Se o usuário logado É ADMIN (tentando logar aqui)
        toast({
          title: 'Erro no Login',
          description: 'Credencial Inválida.',
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

  // Se já estiver logado como cliente, não renderiza o form (será redirecionado)
  if (user && !isAdmin) {
     console.log("AuthPage: Renderizando null pois já está logado como cliente."); // Log
     return null; // ou um spinner rápido
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login Cliente</CardTitle>
          <CardDescription className="text-center">
            Acesse sua conta para visualizar o cronograma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="grid gap-4">
             {/* Campos Email e Senha */}
             <div className="grid gap-2">
               <Label htmlFor="email">Email</Label>
               <Input id="email" type="email" placeholder="seuemail@exemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoadingForm}/>
             </div>
             <div className="grid gap-2">
               <Label htmlFor="password">Senha</Label>
               <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoadingForm}/>
             </div>
            <Button type="submit" className="w-full" disabled={isLoadingForm}>
              {isLoadingForm ? <LoadingSpinner /> : 'Entrar'}
            </Button>
            <div className="mt-4 text-center text-sm">
              É administrador?{' '}
              <Link to="/admin/login" className="underline"> Acesse aqui </Link>
            </div>
            <div className="mt-1 text-center text-sm">
               <Link to="/" className="underline"> Voltar para o Início </Link>
             </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
