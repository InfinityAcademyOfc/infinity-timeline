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
import { Upload, User, Lock, Bell } from 'lucide-react';

export default function ClientSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    company_logo_url: '',
    notify_on_comment: true,
    notify_on_progress: true
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
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
      .select('full_name, company_logo_url, notify_on_comment, notify_on_progress')
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

  const updateEmail = async () => {
    // This would use supabase.auth.updateUser()
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'A alteração de email estará disponível em breve.'
    });
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
        currentPassword: '',
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`logos/${fileName}`, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(`logos/${fileName}`);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ company_logo_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, company_logo_url: publicUrl }));

      toast({
        title: 'Logo atualizada',
        description: 'A logo da empresa foi salva com sucesso.'
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload da logo.',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <SEOHelmet 
        title="Configurações" 
        description="Gerencie suas configurações de perfil e preferências."
      />
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e preferências de conta.
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
              <Label htmlFor="logo">Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                {profile.company_logo_url && (
                  <img 
                    src={profile.company_logo_url} 
                    alt="Logo da empresa" 
                    className="w-16 h-16 object-contain rounded-lg border"
                  />
                )}
                <div>
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('logo')?.click()}
                    disabled={loading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {profile.company_logo_url ? 'Alterar Logo' : 'Upload Logo'}
                  </Button>
                </div>
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
              Altere sua senha ou email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Atual</Label>
              <Input value={user?.email || ''} disabled />
              <Button variant="outline" onClick={updateEmail} size="sm">
                Alterar Email
              </Button>
            </div>

            <Separator />

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
              Gerencie como você recebe notificações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações de Comentários</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações quando houver novos comentários.
                </p>
              </div>
              <Switch
                checked={profile.notify_on_comment}
                onCheckedChange={(checked) => setProfile(prev => ({ ...prev, notify_on_comment: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações de Progresso</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre atualizações de progresso.
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