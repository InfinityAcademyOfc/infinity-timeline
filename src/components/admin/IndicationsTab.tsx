import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, User, Phone, Mail, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IndicationsTabProps {
  clientId: string;
}

interface Indication {
  id: string;
  indicated_name: string;
  indicated_email: string | null;
  indicated_phone: string | null;
  status: string;
  points_awarded: number | null;
  created_at: string;
}

export const IndicationsTab = ({ clientId }: IndicationsTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data: indications, isLoading } = useQuery({
    queryKey: ['client-indications', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('indications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Indication[];
    },
    enabled: !!clientId,
  });

  const approveIndicationMutation = useMutation({
    mutationFn: async (indicationId: string) => {
      const { data, error } = await supabase.functions.invoke('approve-indication', {
        body: { indication_id: indicationId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, indicationId) => {
      toast({
        title: "Indicação aprovada!",
        description: `${data.points_awarded} pontos foram adicionados ao cliente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['client-indications', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-details', clientId] });
      setApprovingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar indicação",
        description: error.message || "Não foi possível aprovar a indicação.",
        variant: "destructive"
      });
      setApprovingId(null);
    }
  });

  const handleApproveIndication = async (indicationId: string) => {
    setApprovingId(indicationId);
    await approveIndicationMutation.mutateAsync(indicationId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!indications || indications.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma indicação encontrada</h3>
          <p className="text-muted-foreground">
            Este cliente ainda não fez nenhuma indicação.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Badge variant="outline">Pendente</Badge>;
      case 'CONCLUIDO':
        return <Badge variant="default">Concluída</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Indicações do Cliente</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as indicações feitas pelo cliente
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total de indicações</p>
          <p className="text-2xl font-bold">{indications.length}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {indications.map((indication) => (
          <Card key={indication.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {indication.indicated_name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(indication.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(indication.status)}
                  {indication.points_awarded && (
                    <Badge variant="secondary">
                      +{indication.points_awarded} pts
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {indication.indicated_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{indication.indicated_email}</span>
                  </div>
                )}
                {indication.indicated_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{indication.indicated_phone}</span>
                  </div>
                )}
              </div>
              
              {indication.status === 'PENDENTE' && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => handleApproveIndication(indication.id)}
                    disabled={approvingId === indication.id}
                    className="w-full sm:w-auto"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {approvingId === indication.id ? 'Aprovando...' : 'Aprovar Indicação'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};