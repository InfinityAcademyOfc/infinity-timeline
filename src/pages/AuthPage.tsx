// src/pages/AuthPage.tsx (CORRIGIDO para estrutura original)
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner'; // Usando import default
import { useAuth } from '@/contexts/AuthContext'; // USA useAuth

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  // Pega signIn E o estado global para verificar se já está logado
  const { signIn, authStatus, isAdmin } = useAuth();

  // EFEITO PARA REDIRECIONAR SE JÁ ESTIVER LOGADO (Executa APÓS o AuthContext definir o status)
  useEffect(() => {
     // Só redireciona se o status NÃO for loading E estiver autenticado
     if (authStatus === 'authenticated') {
        const targetDashboard = isAdmin ? '/admin/dashboard' : '/cliente/dashboard';
        console.log(`AuthPage: Detectado authStatus='authenticated', isAdmin=${isAdmin}. Redirecionando para ${targetDashboard}`);
        // Pega rota original se veio de um redirect, senão vai para dashboard padrão
        const from = location.state?.from?.pathname || targetDashboard;
        navigate(from, { replace: true });
     }
  }, [authStatus, isAdmin, navigate, location.state]);


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingForm(true);
    console.log('AuthPage: Iniciando handleSignIn para:', email);

    // Chama o signIn do AuthContext que retorna roles
    const { success, error, roles } = await signIn(email, password);

    if (!success || error) {
      console.error('AuthPage: Falha no signIn:', error?.message);
      toast({
        title: 'Erro no Login',
        description: error?.message || 'Credenciais inválidas.',
        variant: 'destructive',
      });
    } else {
      // Se signIn teve sucesso, determina o destino baseado nos roles retornados
       console.log('AuthPage: signIn bem-sucedido. Roles recebidos:', roles);
       const targetDashboard = roles.includes('ADMIN') ? '/admin/dashboard' : '/cliente/dashboard';
       console.log(`AuthPage: Redirecionando para ${targetDashboard}...`);
       toast({ title: 'Login bem-sucedido!', description: 'Redirecionando...' });

       // Redireciona IMEDIATAMENTE após o sucesso do signIn
       // Tenta pegar rota original guardada pelo ProtectedRoute, senão usa o dashboard padrão
       const from = location.state?.from?.pathname || targetDashboard;
       navigate(from, { replace: true });
    }
    setIsLoadingForm(false);
    console.log('AuthPage: handleSignIn finalizado.');
  };

  // Se o AuthContext ainda está carregando, ou se já está autenticado (e esperando redirect do useEffect), mostra loading
  if (authStatus === 'loading' || authStatus === 'authenticated') {
    console.log(`AuthPage: Estado global ${authStatus}, mostrando spinner.`);
    return (<div className="flex h-screen w-full items-center justify-center"><LoadingSpinner /></div>);
  }

  // Renderiza formulário APENAS se status for 'unauthenticated'
  console.log('AuthPage: Estado global unauthenticated, renderizando formulário.');
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">Acesse sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="grid gap-4">
             {/* Campos Email e Senha */}
             <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="seuemail@exemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoadingForm}/></div>
             <div className="grid gap-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoadingForm}/></div>
            <Button type="submit" className="w-full" disabled={isLoadingForm}>{isLoadingForm ? <LoadingSpinner /> : 'Entrar'}</Button>
             {/* Link para Início */}
             <div className="mt-4 text-center text-sm"><Link to="/" className="underline">Voltar para o Início</Link></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
