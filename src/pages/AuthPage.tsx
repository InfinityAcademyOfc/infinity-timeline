// src/pages/AuthPage.tsx
import { useState, useEffect } from 'react'; // Adicionado useEffect
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Adicionado useLocation
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
  const [isLoadingForm, setIsLoadingForm] = useState(false); // Renomeado
  const navigate = useNavigate();
  const location = useLocation(); // Hook para obter a localização atual
  const { toast } = useToast();
  const { signIn, user, isLoading: isLoadingAuth, isAdmin } = useAuth(); // Pega user, isLoadingAuth, isAdmin

  // Efeito para redirecionar se já estiver logado como cliente
  useEffect(() => {
    // Se não estiver carregando a autenticação E o usuário existe E NÃO é admin
    if (!isLoadingAuth && user && !isAdmin) {
      navigate('/cliente/dashboard', { replace: true });
    }
  }, [user, isAdmin, isLoadingAuth, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingForm(true);

    // Usa a nova função signIn que retorna { success, error, isAdminLogin }
    const { success, error, isAdminLogin } = await signIn(email, password);

    if (!success || error) {
      // Se signIn falhou (senha errada, usuário não existe, etc)
      toast({
        title: 'Erro no Login',
        description: 'Credencial Inválida.',
        variant: 'destructive',
      });
    } else {
      // Se signIn teve sucesso
      if (!isAdminLogin) {
         // Se o usuário logado NÃO É admin (é cliente)
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando...',
        });
        // A navegação será tratada pelo useEffect ou ProtectedRoute agora
        // navigate('/cliente/dashboard'); // REMOVIDO DAQUI
      } else {
        // Se o usuário logado É ADMIN (tentando logar aqui)
        toast({
          title: 'Erro no Login',
          description: 'Credencial Inválida.',
          variant: 'destructive',
        });
        // IMPORTANTE: O admin logou com sucesso, mas não deveria.
        // O ProtectedRoute o impedirá de acessar /cliente,
        // mas ele ficaria preso aqui. Idealmente, deslogar.
      }
    }
    setIsLoadingForm(false);
  };

   // Não renderiza o formulário se já estiver logado como cliente (redirecionamento pelo useEffect)
   if (isLoadingAuth || (user && !isAdmin)) {
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
