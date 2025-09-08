import { useState, useEffect } from 'react';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User, Lock, Bell, Shield } from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    notify_on_comment: true,
    notify_on_progress: true
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, notify_on_comment, notify_on_progress')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      setProfile(data);
    }
  };

  const updateProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          notify_on_comment: profile.notify_on_comment,
          notify_on_progress: profile.notify_on_progress
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const updatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: 'Senha atualizada',
        description: 'Sua senha foi alterada com sucesso.'
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a senha.',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <SEOHelmet 
        title="Configurações do Admin" 
        description="Gerencie suas configurações administrativas."
      />
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Configurações do Administrador</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e preferências administrativas.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações do Perfil
            </CardTitle>
            <CardDescription>
              Atualize suas informações pessoais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>

            <div className="space-y-2">
              <Label>Função</Label>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Administrador</span>
              </div>
            </div>

            <Button onClick={updateProfile} disabled={loading}>
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Altere sua senha administrativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Alterar Senha</h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Nova senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirme a nova senha"
                  />
                </div>
                <Button 
                  onClick={updatePassword} 
                  disabled={loading || !passwordData.newPassword}
                >
                  Alterar Senha
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Preferências de Notificação
            </CardTitle>
            <CardDescription>
              Gerencie como você recebe notificações administrativas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações de Comentários</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações quando clientes comentarem.
                </p>
              </div>
              <Switch
                checked={profile.notify_on_comment}
                onCheckedChange={(checked) => setProfile(prev => ({ ...prev, notify_on_comment: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações de Solicitações</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre novas solicitações e indicações.
                </p>
              </div>
              <Switch
                checked={profile.notify_on_progress}
                onCheckedChange={(checked) => setProfile(prev => ({ ...prev, notify_on_progress: checked }))}
              />
            </div>

            <Button onClick={updateProfile} disabled={loading}>
              Salvar Preferências
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}