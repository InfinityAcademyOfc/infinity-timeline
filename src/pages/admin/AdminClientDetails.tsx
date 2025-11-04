import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Calendar as CalendarIcon, Trophy, AlertCircle, Settings, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { IndicationsTab } from '@/components/admin/IndicationsTab';
import { DocumentsTab } from '@/components/admin/DocumentsTab';
import { TimelineEditor } from '@/components/admin/TimelineEditor';
import { BonusManager } from '@/components/admin/BonusManager';
import { AppLayout } from '@/components/AppLayout';

const AdminClientDetails = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>();
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client-details', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required');
      
      // Primeiro verificar se o usuário é um cliente
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', clientId)
        .eq('role', 'CLIENTE')
        .maybeSingle();

      if (roleError) throw roleError;
      if (!roleData) throw new Error('User is not a client');

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          client_timelines(
            id,
            name,
            start_date,
            end_date,
            template_id,
            timeline_items(count)
          )
        `)
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const { data: templates } = useQuery({
    queryKey: ['timeline-templates-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_templates')
        .select('id, name, duration_months')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const hasActiveTimeline = client?.client_timelines && client.client_timelines.length > 0;
  const activeTimeline = hasActiveTimeline ? client.client_timelines[0] : null;

  // Fetch timeline items if there's an active timeline
  const { data: timelineItems, isLoading: timelineItemsLoading } = useQuery({
    queryKey: ['timeline-items', clientId, activeTimeline?.id],
    queryFn: async () => {
      if (!activeTimeline?.id) return [];
      
      const { data, error } = await supabase
        .from('timeline_items')
        .select('*')
        .eq('client_timeline_id', activeTimeline.id)
        .order('due_date');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTimeline?.id,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ timelineItemId, progressStatus, extraPoints }: { 
      timelineItemId: string; 
      progressStatus: string; 
      extraPoints?: number 
    }) => {
      const { data, error } = await supabase.functions.invoke('update-timeline-progress', {
        body: {
          timeline_item_id: timelineItemId,
          progress_status: progressStatus,
          extra_points: extraPoints || 0
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Progresso atualizado!",
        description: `Status atualizado com sucesso. ${data.pointsAdded} pontos adicionados.`,
      });
      queryClient.invalidateQueries({ queryKey: ['client-details', clientId] });
      queryClient.invalidateQueries({ queryKey: ['timeline-items', clientId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar progresso",
        description: error.message || "Não foi possível atualizar o progresso.",
        variant: "destructive"
      });
    }
  });

  const assignTimelineMutation = useMutation({
    mutationFn: async (assignmentData: { clientId: string; templateId: string; startDate: string }) => {
      const { data, error } = await supabase.functions.invoke('assign-timeline', {
        body: assignmentData
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Cronograma atribuído com sucesso!",
        description: "O cronograma foi criado e o cliente pode começar sua jornada."
      });
      queryClient.invalidateQueries({ queryKey: ['client-details', clientId] });
      setIsAssignModalOpen(false);
      setSelectedTemplateId('');
      setStartDate(undefined);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atribuir cronograma",
        description: error.message || "Não foi possível atribuir o cronograma.",
        variant: "destructive"
      });
    }
  });

  const handleAssignTimeline = async () => {
    if (!selectedTemplateId || !startDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione um template e uma data de início.",
        variant: "destructive"
      });
      return;
    }

    if (!clientId) return;

    setIsAssigning(true);
    try {
      await assignTimelineMutation.mutateAsync({
        clientId,
        templateId: selectedTemplateId,
        startDate: startDate.toISOString().split('T')[0]
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (clientLoading) {
    return (
      <AppLayout showAdminNav>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout showAdminNav>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Cliente não encontrado</h3>
              <p className="text-muted-foreground">O cliente solicitado não foi encontrado ou não existe.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showAdminNav>
      <SEOHelmet 
        title={`Cliente: ${client.full_name || client.email}`} 
        description="Detalhes do cliente e gerenciamento de cronogramas."
      />
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {client.full_name || 'Cliente'}
            </h1>
            <p className="text-muted-foreground text-lg">{client.email}</p>
          </div>
        </div>

        {/* Informações do Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Informações</CardTitle>
              <User className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{client.full_name || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">
                Cadastrado em {new Date(client.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontuação</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{client.points} pts</div>
              <Badge variant={client.points >= 100 ? "default" : "secondary"}>
                {client.points >= 100 ? "Nível Avançado" : "Nível Inicial"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Settings className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {hasActiveTimeline ? 'Ativo' : 'Inativo'}
              </div>
              <Badge variant={hasActiveTimeline ? "default" : "outline"}>
                {hasActiveTimeline ? 'Com Cronograma' : 'Sem Cronograma'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Cronograma */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Cronograma do Cliente
            </CardTitle>
            <CardDescription>
              Gestão e acompanhamento do cronograma do cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasActiveTimeline ? (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Nenhum cronograma ativo</h3>
                <p className="text-muted-foreground mb-6">
                  Este cliente ainda não possui um cronograma atribuído. Atribua um template para começar sua jornada.
                </p>
                
                <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      Atribuir Cronograma
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Atribuir Cronograma</DialogTitle>
                      <DialogDescription>
                        Selecione um template e defina a data de início do projeto
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="template">Selecione o Modelo de Cronograma</Label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha um template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {templates?.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name} ({template.duration_months} meses)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Data de Início</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione uma data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleAssignTimeline}
                          disabled={isAssigning}
                        >
                          {isAssigning ? 'Atribuindo...' : 'Atribuir Cronograma'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Cronograma Ativo</h4>
                    <p className="text-2xl font-bold text-primary">{activeTimeline?.name}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Progresso</h4>
                    <p className="text-lg">
                      {activeTimeline?.timeline_items?.[0]?.count || 0} itens no cronograma
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-sm text-muted-foreground">Data de Início</Label>
                    <p className="font-medium">
                      {new Date(activeTimeline?.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Data de Término</Label>
                    <p className="font-medium">
                      {new Date(activeTimeline?.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <Badge className="mt-4" variant="default">
                  Cronograma Ativo
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs Section */}
        {hasActiveTimeline && (
          <Tabs defaultValue="progress" className="space-y-6">
            <TabsList>
              <TabsTrigger value="progress">Progresso</TabsTrigger>
              <TabsTrigger value="editor">Editor de Cronograma</TabsTrigger>
              <TabsTrigger value="bonus">Bônus</TabsTrigger>
              <TabsTrigger value="indications">Indicações</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="progress">
              <Card className="border-0 shadow-xl bg-gradient-card backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Gerenciamento de Progresso
                  </CardTitle>
                  <CardDescription>
                    Atualize o status dos itens do cronograma e gerencie a pontuação do cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timelineItemsLoading ? (
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
                  ) : !timelineItems || timelineItems.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Nenhum item encontrado no cronograma.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {timelineItems.map((item) => (
                        <TimelineItemCard 
                          key={item.id} 
                          item={item} 
                          onUpdateProgress={updateProgressMutation.mutate}
                          isUpdating={updateProgressMutation.isPending}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="editor">
              <Card className="border-0 shadow-xl bg-gradient-card backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Editor Visual de Cronograma
                  </CardTitle>
                  <CardDescription>
                    Edite itens, adicione links e gerencie detalhes do cronograma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timelineItemsLoading ? (
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
                  ) : !timelineItems || timelineItems.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Nenhum item encontrado no cronograma.</p>
                    </div>
                  ) : (
                    <TimelineEditor 
                      clientTimelineId={activeTimeline?.id || ''} 
                      items={timelineItems}
                      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['timeline-items', clientId] })}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bonus">
              <BonusManager clientId={clientId!} />
            </TabsContent>

            <TabsContent value="indications">
              <IndicationsTab clientId={clientId!} />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsTab clientId={clientId!} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

// Timeline Item Card Component
const TimelineItemCard = ({ 
  item, 
  onUpdateProgress, 
  isUpdating 
}: { 
  item: any; 
  onUpdateProgress: (data: { timelineItemId: string; progressStatus: string; extraPoints?: number }) => void;
  isUpdating: boolean;
}) => {
  const [selectedStatus, setSelectedStatus] = useState(item.progress_status || '');
  const [extraPoints, setExtraPoints] = useState(0);
  const [showExtraPoints, setShowExtraPoints] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setShowExtraPoints(newStatus === 'ADIANTADO');
    
    // Auto-update when status changes
    onUpdateProgress({
      timelineItemId: item.id,
      progressStatus: newStatus,
      extraPoints: newStatus === 'ADIANTADO' ? extraPoints : 0
    });
  };

  const handleExtraPointsUpdate = () => {
    if (selectedStatus === 'ADIANTADO') {
      onUpdateProgress({
        timelineItemId: item.id,
        progressStatus: selectedStatus,
        extraPoints: extraPoints
      });
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'NO_PRAZO':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ADIANTADO':
        return <Trophy className="w-4 h-4 text-blue-500" />;
      case 'ATRASADO':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'NO_PRAZO':
        return 'default';
      case 'ADIANTADO':
        return 'default';
      case 'ATRASADO':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="border border-muted">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(item.progress_status)}
              <h4 className="font-semibold">{item.title}</h4>
              <Badge variant={getStatusBadgeVariant(item.progress_status)}>
                {item.status}
              </Badge>
            </div>
            
            {item.description && (
              <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Prazo: {new Date(item.due_date).toLocaleDateString('pt-BR')}</span>
              {item.progress_status && (
                <Badge variant="outline" className="text-xs">
                  {item.progress_status.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 min-w-[200px]">
            <Label className="text-xs font-medium">Status do Progresso</Label>
            <Select
              value={selectedStatus}
              onValueChange={handleStatusChange}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Selecionar status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NO_PRAZO">No Prazo (25 pts)</SelectItem>
                <SelectItem value="ADIANTADO">Adiantado (25 + extra)</SelectItem>
                <SelectItem value="ATRASADO">Atrasado (0 pts)</SelectItem>
              </SelectContent>
            </Select>
            
            {showExtraPoints && selectedStatus === 'ADIANTADO' && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Pts extra"
                  value={extraPoints}
                  onChange={(e) => setExtraPoints(parseInt(e.target.value) || 0)}
                  className="h-8"
                  min="0"
                  max="50"
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleExtraPointsUpdate}
                  disabled={isUpdating}
                >
                  Aplicar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminClientDetails;