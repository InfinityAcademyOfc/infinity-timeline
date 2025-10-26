// src/pages/AdminAuthPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error, roles } = await signIn(email, password);

    // Trata erro genérico de login primeiro (senha errada, usuário não existe)
    if (error) {
      toast({
        title: 'Erro no Login',
        // Mensagem genérica para não dar pistas se o usuário existe mas não é admin
        description: 'Verifique suas credenciais.',
        variant: 'destructive',
      });
    } else {
      // Se o login foi SUCESSO, verifica se TEM o role ADMIN
      if (roles.includes('ADMIN')) {
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para o painel de controle...',
        });
        navigate('/admin/dashboard'); // ÚNICO redirecionamento possível
      } else {
        // Se logou com sucesso MAS NÃO É ADMIN
        toast({
          title: 'Acesso Não Autorizado',
          description: 'Acesso apenas para administradores.', // Mensagem específica
          variant: 'destructive',
        });
        // IMPORTANTE: Não faz logout aqui, apenas não redireciona.
        // O usuário tecnicamente logou, mas não pode acessar nada.
        // O ProtectedRoute vai barrá-lo se tentar navegar.
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="mx-auto max-w-sm w-full"> {/* Adicionado w-full */}
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login Administrador</CardTitle> {/* Centralizado */}
          <CardDescription className="text-center"> {/* Centralizado */}
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
                placeholder="admin@infinitytimeline.com" // Exemplo mais claro
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
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
            {/* Link para login de cliente removido para isolamento total */}
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
