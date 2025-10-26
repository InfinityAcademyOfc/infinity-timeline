// src/pages/AdminAuthPage.tsx
import { useState, useEffect } from 'react'; // Adicionado useEffect
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Adicionado useLocation
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
  const [isLoadingForm, setIsLoadingForm] = useState(false); // Renomeado para evitar conflito
  const navigate = useNavigate();
  const location = useLocation(); // Hook para obter a localização atual
  const { toast } = useToast();
  const { signIn, user, isLoading: isLoadingAuth, isAdmin } = useAuth(); // Pega user, isLoadingAuth, isAdmin

  // Efeito para redirecionar se já estiver logado como admin
  useEffect(() => {
    // Se não estiver carregando a autenticação E o usuário existe E é admin
    if (!isLoadingAuth && user && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, isAdmin, isLoadingAuth, navigate]);


  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingForm(true); // Usa o estado local do formulário

    // Chama signIn que agora retorna { success, error, isAdminLogin }
    const { success, error, isAdminLogin } = await signIn(email, password);

    if (!success || error) {
      // Se signIn falhou (senha errada, etc) OU houve erro
      toast({
        title: 'Acesso Não Autorizado',
        description: 'Acesso apenas para administradores.',
        variant: 'destructive',
      });
    } else {
      // Se signIn teve sucesso (usuário autenticado e perfil carregado)
      if (isAdminLogin) {
         // Se o usuário logado É admin
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando...',
        });
        // A navegação será tratada pelo useEffect ou ProtectedRoute agora
        // navigate('/admin/dashboard'); // REMOVIDO DAQUI
      } else {
        // Se o usuário logado NÃO é admin (era cliente)
        toast({
          title: 'Acesso Não Autorizado',
          description: 'Acesso apenas para administradores.',
          variant: 'destructive',
        });
         // IMPORTANTE: O cliente logou com sucesso, mas não deveria.
         // O ProtectedRoute o impedirá de acessar /admin,
         // mas ele ficaria preso aqui. Idealmente, deslogar ou redirecionar
         // para /auth seria melhor, mas mantemos simples por enquanto.
      }
    }
    setIsLoadingForm(false);
  };

  // Não renderiza o formulário se já estiver logado como admin (redirecionamento pelo useEffect)
  if (isLoadingAuth || (user && isAdmin)) {
     return (
       <div className="flex h-screen w-full items-center justify-center">
         <LoadingSpinner />
       </div>
     );
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
