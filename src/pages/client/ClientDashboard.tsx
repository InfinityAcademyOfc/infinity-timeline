import { useState } from 'react';
import { SEOHelmet } from '@/components/SEOHelmet';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Gift, Clock, Calendar, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { NotificationBell } from '@/components/NotificationBell';
import { AppLayout } from '@/components/AppLayout';
import { IndicationModal } from '@/components/client/IndicationModal';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [indicationModalOpen, setIndicationModalOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, points, monthly_fee, responsible_name, company_name')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: timelines } = useQuery({
    queryKey: ['client-timelines', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('client_timelines')
        .select(`
          *,
          timeline_items(*)
        `)
        .eq('client_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calcular progresso baseado nos cronogramas
  const calculateProgress = () => {
    if (!timelines || timelines.length === 0) return 0;
    
    const totalItems = timelines.reduce((acc, timeline) => 
      acc + (timeline.timeline_items?.length || 0), 0);
    const completedItems = timelines.reduce((acc, timeline) => 
      acc + (timeline.timeline_items?.filter(item => item.status === 'CONCLUIDO').length || 0), 0);
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const progress = calculateProgress();
  const points = profile?.points || 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHelmet 
        title="Dashboard Cliente" 
        description="Acompanhe o progresso dos seus projetos e cronogramas."
      />
      
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Bem-vindo, {profile?.responsible_name || profile?.company_name || 'Cliente'}!
            </h1>
            <p className="text-muted-foreground text-lg">
              Acompanhe seu progresso e conquistas
            </p>
          </div>
          <NotificationBell />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card de Progresso */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{progress}%</div>
              <Progress value={progress} className="mb-2" />
              <p className="text-xs text-muted-foreground">
                {timelines?.length || 0} cronograma(s) ativo(s)
              </p>
            </CardContent>
          </Card>

          {/* Card de Pontuação */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontuação</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{points} pts</div>
              <Badge variant={points >= 100 ? "default" : "secondary"} className="mb-2">
                {points >= 100 ? "Nível Avançado" : "Nível Inicial"}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Continue completando tarefas para ganhar pontos
              </p>
            </CardContent>
          </Card>

          {/* Card de Indicação */}
          <Card className="hover-scale bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Indique e Ganhe</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary mb-1">
                {Math.floor((profile?.monthly_fee || 0) * 0.25)} pontos
              </div>
              <p className="text-xs text-muted-foreground mb-3">Por cada indicação aprovada</p>
              <Button 
                onClick={() => setIndicationModalOpen(true)}
                className="w-full bg-gradient-primary hover:opacity-90"
                size="sm"
              >
                <Gift className="h-4 w-4 mr-2" />
                Indicar Agora
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Cronogramas Ativos */}
        {timelines && timelines.length > 0 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Cronogramas Ativos
              </CardTitle>
              <CardDescription>
                Seus projetos em andamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelines.map((timeline) => {
                  const totalItems = timeline.timeline_items?.length || 0;
                  const completedItems = timeline.timeline_items?.filter(
                    item => item.status === 'CONCLUIDO'
                  ).length || 0;
                  const timelineProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

                  return (
                    <div key={timeline.id} className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{timeline.name}</h3>
                        <Badge variant="outline">
                          {completedItems}/{totalItems} concluídas
                        </Badge>
                      </div>
                      <Progress value={timelineProgress} className="mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Período: {new Date(timeline.start_date).toLocaleDateString()} - {new Date(timeline.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 text-center">
                <Link to="/timeline">
                  <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-lg">
                    <Calendar className="h-5 w-5 mr-2" />
                    Ver Cronograma Interativo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <IndicationModal 
        open={indicationModalOpen}
        onOpenChange={setIndicationModalOpen}
        monthlyFee={profile?.monthly_fee || 0}
      />
    </AppLayout>
  );
};

export default ClientDashboard;