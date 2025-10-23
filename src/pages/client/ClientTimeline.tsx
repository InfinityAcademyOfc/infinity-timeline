import { SEOHelmet } from '@/components/SEOHelmet';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import TimelineView from '@/components/TimelineView';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  progress_status?: string;
  client_timeline_id: string;
  template_item_id?: string;
  completion_percentage?: number;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
}

export interface ProcessedTimelineData {
  timelineId: string;
  timelineName: string;
  startDate: string;
  endDate: string;
  months: Array<{
    monthKey: string;
    monthName: string;
    year: number;
    items: TimelineItem[];
  }>;
}

const processTimelineData = (timeline: any): ProcessedTimelineData | null => {
  if (!timeline || !timeline.timeline_items) return null;

  const items = timeline.timeline_items as TimelineItem[];
  const startDate = new Date(timeline.start_date);
  const endDate = new Date(timeline.end_date);
  
  // Group items by month
  const monthGroups = new Map<string, TimelineItem[]>();
  
  items.forEach(item => {
    const itemDate = new Date(item.due_date);
    const monthKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthGroups.has(monthKey)) {
      monthGroups.set(monthKey, []);
    }
    monthGroups.get(monthKey)!.push(item);
  });

  // Create months array covering the entire timeline period
  const months: ProcessedTimelineData['months'] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    months.push({
      monthKey,
      monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      year: currentDate.getFullYear(),
      items: monthGroups.get(monthKey) || []
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return {
    timelineId: timeline.id,
    timelineName: timeline.name,
    startDate: timeline.start_date,
    endDate: timeline.end_date,
    months
  };
};

const ClientTimeline = () => {
  const { user } = useAuth();

  const { data: timelineData, isLoading, error } = useQuery({
    queryKey: ['client-timeline', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('client_timelines')
        .select(`
          *,
          timeline_items(*)
        `)
        .eq('client_id', user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No timeline found
          return null;
        }
        throw error;
      }
      
      return processTimelineData(data);
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando sua linha do tempo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar cronograma</h3>
            <p className="text-muted-foreground">
              Ocorreu um erro ao carregar sua linha do tempo. Tente novamente mais tarde.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-6">
        <Card className="max-w-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Nenhum cronograma ativo</h3>
              <p className="text-muted-foreground">
                Você ainda não possui um cronograma atribuído. Entre em contato com a administração 
                para que um cronograma seja criado para você.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SEOHelmet 
        title="Cronograma Infinity" 
        description="Acompanhe sua jornada e visualize seus marcos em uma linha do tempo interativa."
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {timelineData.timelineName}
          </h1>
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Início: {new Date(timelineData.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Fim: {new Date(timelineData.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <TimelineView timelineData={timelineData} />
      </div>
    </div>
  );
};

export default ClientTimeline;