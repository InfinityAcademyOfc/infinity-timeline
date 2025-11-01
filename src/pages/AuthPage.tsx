import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, UserPlus, Clock, Shield } from 'lucide-react';

interface AuthPageProps {
  adminMode?: boolean;
}

const AuthPage = ({ adminMode = false }: AuthPageProps) => {
  const { user, signIn, signUp, signOut, loading, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (user && !loading) {
    // Se está no modo admin, só redireciona se for realmente admin
    if (adminMode) {
      return isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/auth" replace />;
    }
    // Se não está no modo admin, redireciona baseado no role
    return <Navigate to={isAdmin ? "/admin/dashboard" : "/cliente/dashboard"} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error, roles } = await signIn(email, password);
    setIsLoading(false);
    
    if (!error && adminMode) {
      // Verifica se o usuário que logou é realmente um admin
      const hasAdminRole = roles.includes('ADMIN');
      if (!hasAdminRole) {
        // Força logout se tentar login admin sem ser admin
        await signOut();
        return;
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signUp(email, password, fullName);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <SEOHelmet 
        title={adminMode ? "Login Admin" : "Login e Cadastro"}
        description={adminMode ? "Acesso administrativo ao Infinity Timeline" : "Acesse sua conta Infinity Timeline ou crie uma nova conta para gerenciar seus cronogramas de projeto."}
        keywords="login, cadastro, acesso, conta, infinity timeline"
      />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {adminMode ? (
              <Shield className="h-12 w-12 text-primary mr-3" />
            ) : (
              <Clock className="h-12 w-12 text-primary mr-3" />
            )}
            <h1 className="text-3xl font-bold text-primary">Infinity Timeline</h1>
          </div>
          <p className="text-muted-foreground">
            {adminMode ? "Área Administrativa" : "Gestão profissional de cronogramas"}
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/95 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              {adminMode && <Shield className="h-5 w-5 text-primary" />}
              {adminMode ? "Login Administrativo" : "Bem-vindo"}
            </CardTitle>
            <CardDescription className="text-center">
              {adminMode 
                ? "Acesse com suas credenciais de administrador" 
                : "Acesse sua conta ou crie uma nova para começar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              {!adminMode && (
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Cadastrar
                  </TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:bg-primary-hover" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              {!adminMode && (
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome Completo</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-primary hover:bg-primary-hover" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Criando conta...' : 'Criar Conta'}
                    </Button>
                  </form>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;