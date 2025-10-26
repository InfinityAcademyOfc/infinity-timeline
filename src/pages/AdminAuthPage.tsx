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

    // Usa a nova função signIn que retorna { success, error, roles }
    const { success, error, roles } = await signIn(email, password);

    if (!success || error) {
      // Se signIn falhou (senha errada, usuário não existe, erro ao buscar perfil)
      toast({
        title: 'Acesso Não Autorizado',
        description: 'Acesso apenas para administradores.', // Mensagem solicitada
        variant: 'destructive',
      });
    } else {
      // Se signIn teve sucesso E o usuário TEM o role ADMIN
      if (roles.includes('ADMIN')) {
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando...',
        });
        navigate('/admin/dashboard'); // Único redirecionamento
      } else {
        // Se signIn teve sucesso MAS NÃO TEM o role ADMIN
        toast({
          title: 'Acesso Não Autorizado',
          description: 'Acesso apenas para administradores.', // Mensagem solicitada
          variant: 'destructive',
        });
        // IMPORTANTE: Neste caso, o usuário (cliente) logou com sucesso.
        // O ideal seria deslogá-lo para evitar confusão, mas vamos manter simples por ora.
        // O ProtectedRoute impedirá o acesso às páginas admin de qualquer forma.
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4"> {/* Adicionado padding */}
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
