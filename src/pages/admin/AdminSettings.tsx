import { useState, useEffect } from 'react';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Trophy, Palette, Bell, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/AppLayout';

const AdminSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pointsConfig, setPointsConfig] = useState({
    indication_percentage: 0.25,
    task_on_time: 25,
    task_early: 50,
    task_late: 0,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', 'points_config')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPointsConfig(data.setting_value as typeof pointsConfig);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
    }
  };

  const savePointsConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'points_config',
          setting_value: pointsConfig,
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: 'Configurações salvas',
        description: 'As configurações de pontos foram atualizadas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout showAdminNav>
      <SEOHelmet 
        title="Configurações - Admin" 
        description="Configure o sistema Infinity Timeline."
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-gradient-primary/10 border border-primary/20">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
              <p className="text-muted-foreground">Gerencie as configurações globais da plataforma</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="points" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="points" className="gap-2">
              <Trophy className="h-4 w-4" />
              Pontos
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="fees" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Mensalidades
            </TabsTrigger>
          </TabsList>

          {/* Points Configuration */}
          <TabsContent value="points">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Pontuação</CardTitle>
                <CardDescription>
                  Defina os valores de pontos para cada tipo de ação na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="indication">Percentual de Indicação (0 a 1)</Label>
                    <Input
                      id="indication"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={pointsConfig.indication_percentage}
                      onChange={(e) => setPointsConfig({
                        ...pointsConfig,
                        indication_percentage: parseFloat(e.target.value)
                      })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Valor atual: {(pointsConfig.indication_percentage * 100).toFixed(0)}% da mensalidade
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="taskOnTime">Pontos por Tarefa no Prazo</Label>
                    <Input
                      id="taskOnTime"
                      type="number"
                      min="0"
                      value={pointsConfig.task_on_time}
                      onChange={(e) => setPointsConfig({
                        ...pointsConfig,
                        task_on_time: parseInt(e.target.value)
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taskEarly">Pontos por Tarefa Adiantada</Label>
                    <Input
                      id="taskEarly"
                      type="number"
                      min="0"
                      value={pointsConfig.task_early}
                      onChange={(e) => setPointsConfig({
                        ...pointsConfig,
                        task_early: parseInt(e.target.value)
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taskLate">Pontos por Tarefa Atrasada</Label>
                    <Input
                      id="taskLate"
                      type="number"
                      min="0"
                      value={pointsConfig.task_late}
                      onChange={(e) => setPointsConfig({
                        ...pointsConfig,
                        task_late: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <Button 
                  onClick={savePointsConfig} 
                  disabled={loading}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Configure cores, logos e elementos visuais da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure quando e como os usuários receberão notificações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Fees */}
          <TabsContent value="fees">
            <Card>
              <CardHeader>
                <CardTitle>Mensalidades dos Clientes</CardTitle>
                <CardDescription>
                  Gerencie os valores de mensalidade de cada cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Para configurar a mensalidade de um cliente, vá em Clientes → Selecione o cliente → Editar perfil
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminSettings;
