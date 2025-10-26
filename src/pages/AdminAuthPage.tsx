// src/pages/AdminAuthPage.tsx
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // useNavigate ainda pode ser útil para outras ações
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
  const navigate = useNavigate(); // Mantido caso precise no futuro
  const { toast } = useToast();
  // Pega authStatus para mostrar loading inicial se necessário
  const { signIn, authStatus, user, isAdmin } = useAuth();

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingForm(true);

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
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando...', // O redirecionamento real virá do ProtectedRoute
        });
        // Não navegar daqui!
      } else {
        toast({
          title: 'Acesso Não Autorizado',
          description: 'Acesso apenas para administradores.',
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

  // Se já está autenticado como admin, não mostra nada (ProtectedRoute redirecionará)
  if (authStatus === 'authenticated' && isAdmin) {
     return (
       <div className="flex h-screen w-full items-center justify-center">
         <LoadingSpinner /> {/* Ou null */}
       </div>
     );
  }

  // Renderiza o formulário se não estiver carregando E (não autenticado OU autenticado mas NÃO admin)
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
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@infinitytimeline.com"
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

export default AdminAuthPage;
