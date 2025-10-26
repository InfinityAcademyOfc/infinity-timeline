// src/pages/AuthPage.tsx
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // useNavigate mantido
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
  const navigate = useNavigate(); // Mantido
  const { toast } = useToast();
  // Pega authStatus
  const { signIn, authStatus, user, isAdmin } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingForm(true);

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
          description: 'Redirecionando...', // O redirecionamento virá do ProtectedRoute
        });
        // Não navegar daqui!
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

  // Se o AuthContext ainda está carregando o estado inicial, mostra spinner
  if (authStatus === 'loading') {
     return (
       <div className="flex h-screen w-full items-center justify-center">
         <LoadingSpinner />
       </div>
     );
  }

   // Se já está autenticado como cliente, não mostra nada (ProtectedRoute redirecionará)
   if (authStatus === 'authenticated' && !isAdmin) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <LoadingSpinner /> {/* Ou null */}
        </div>
      );
   }

  // Renderiza o formulário se não estiver carregando E (não autenticado OU autenticado mas É admin)
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
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoadingForm}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoadingForm}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoadingForm}>
              {isLoadingForm ? <LoadingSpinner /> : 'Entrar'}
            </Button>
            <div className="mt-4 text-center text-sm">
              É administrador?{' '}
              <Link to="/admin/login" className="underline">
                Acesse aqui
              </Link>
            </div>
            <div className="mt-1 text-center text-sm">
               <Link to="/" className="underline">
                 Voltar para o Início
               </Link>
             </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
