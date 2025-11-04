import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { SEOHelmet } from '@/components/SEOHelmet';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { TimelineFlowBuilderWrapper } from '@/components/timeline-flow/TimelineFlowBuilder';

export default function ClientTimelineFlow() {
  const { user } = useAuth();

  const { data: timeline, isLoading, error } = useQuery({
    queryKey: ['client-timeline-flow', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_timelines')
        .select('*')
        .eq('client_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error="Erro ao carregar cronograma" />;
  if (!timeline) return <ErrorMessage error="Nenhum cronograma encontrado" />;

  return (
    <AppLayout>
      <SEOHelmet
        title="Meu Cronograma - Fluxo Interativo"
        description="Visualize seu cronograma de forma interativa"
      />
      <TimelineFlowBuilderWrapper
        clientTimelineId={timeline.id}
        startDate={new Date(timeline.start_date)}
        endDate={new Date(timeline.end_date)}
        isAdmin={false}
      />
    </AppLayout>
  );
}
