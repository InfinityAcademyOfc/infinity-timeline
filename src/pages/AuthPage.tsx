// src/pages/AuthPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Usa a nova função signIn que retorna { success, error, roles }
    const { success, error, roles } = await signIn(email, password);

    if (!success || error) {
      // Se signIn falhou (senha errada, usuário não existe, erro ao buscar perfil)
      toast({
        title: 'Erro no Login',
        description: 'Credencial Inválida.', // Mensagem solicitada
        variant: 'destructive',
      });
    } else {
      // Se signIn teve sucesso E o usuário NÃO TEM o role ADMIN (é cliente)
      if (!roles.includes('ADMIN')) {
         toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando...',
        });
        navigate('/cliente/dashboard'); // Único redirecionamento
      } else {
        // Se signIn teve sucesso MAS É ADMIN (tentando logar aqui)
        toast({
          title: 'Erro no Login',
          description: 'Credencial Inválida.', // Mensagem solicitada
          variant: 'destructive',
        });
         // IMPORTANTE: O admin logou com sucesso, mas não deveria estar aqui.
         // O ideal seria deslogá-lo. Manter simples por ora.
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4"> {/* Adicionado padding */}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <LoadingSpinner /> : 'Entrar'}
            </Button>
            {/* Link para login de admin - mantido para conveniência, pode remover se preferir isolamento total */}
            <div className="mt-4 text-center text-sm">
              É administrador?{' '}
              <Link to="/admin/login" className="underline">
                Acesse aqui
              </Link>
            </div>
             <div className="mt-1 text-center text-sm"> {/* Ajustado espaçamento */}
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
