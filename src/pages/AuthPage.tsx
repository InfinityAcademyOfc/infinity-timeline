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

    const { error, roles } = await signIn(email, password);

    // Trata erro genérico de login (senha errada, usuário não existe)
    if (error) {
      toast({
        title: 'Erro no Login',
        description: 'Credencial Inválida.', // Mensagem genérica
        variant: 'destructive',
      });
    } else {
      // Se o login foi SUCESSO, verifica se NÃO É ADMIN
      if (!roles.includes('ADMIN')) {
         toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para sua área...',
        });
        navigate('/cliente/dashboard'); // ÚNICO redirecionamento possível
      } else {
        // Se logou com sucesso MAS É ADMIN (tentando logar aqui)
        toast({
          title: 'Erro no Login',
          description: 'Credencial Inválida.', // Mesma mensagem genérica
          variant: 'destructive',
        });
         // IMPORTANTE: Não faz logout, apenas não redireciona.
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="mx-auto max-w-sm w-full"> {/* Adicionado w-full */}
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login Cliente</CardTitle> {/* Centralizado */}
          <CardDescription className="text-center"> {/* Centralizado */}
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
                placeholder="seuemail@exemplo.com" // Exemplo mais claro
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                 {/* <Link to="#" className="ml-auto inline-block text-sm underline">
                  Esqueceu sua senha?
                 </Link> */}
              </div>
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
              {isLoading ? <LoadingSpinner /> : 'Entrar'} {/* Texto simplificado */}
            </Button>
            {/* Link para login de admin removido para isolamento total */}
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

export default AuthPage;
