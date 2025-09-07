import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, MessageCircle, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const indicationSchema = z.object({
  indicated_name: z.string().min(1, 'Nome é obrigatório'),
  indicated_email: z.string().email('Email inválido').optional().or(z.literal('')),
  indicated_phone: z.string().optional(),
});

const requestSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  details: z.string().min(10, 'Detalhes devem ter pelo menos 10 caracteres'),
  request_type: z.string().min(1, 'Tipo de solicitação é obrigatório'),
});

const ClientProgress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [indicationOpen, setIndicationOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const indicationForm = useForm<z.infer<typeof indicationSchema>>({
    resolver: zodResolver(indicationSchema),
    defaultValues: {
      indicated_name: '',
      indicated_email: '',
      indicated_phone: '',
    },
  });

  const requestForm = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      details: '',
      request_type: '',
    },
  });

  // Fetch KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['client-kpis', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('client_kpis')
        .select('*')
        .eq('client_id', user.id)
        .order('report_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch indications
  const { data: indications } = useQuery({
    queryKey: ['client-indications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('indications')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch requests
  const { data: requests } = useQuery({
    queryKey: ['client-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createIndication = useMutation({
    mutationFn: async (values: z.infer<typeof indicationSchema>) => {
      const { data, error } = await supabase
        .from('indications')
        .insert({
          client_id: user!.id,
          indicated_name: values.indicated_name,
          indicated_email: values.indicated_email || null,
          indicated_phone: values.indicated_phone || null,
          status: 'PENDENTE',
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Indicação enviada!',
        description: 'Sua indicação foi registrada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['client-indications'] });
      setIndicationOpen(false);
      indicationForm.reset();
    },
  });

  const createRequest = useMutation({
    mutationFn: async (values: z.infer<typeof requestSchema>) => {
      const { data, error } = await supabase
        .from('client_requests')
        .insert({
          client_id: user!.id,
          title: values.title,
          details: values.details,
          request_type: values.request_type,
          status: 'PENDENTE',
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação foi registrada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['client-requests'] });
      setRequestOpen(false);
      requestForm.reset();
    },
  });

  const onIndicationSubmit = (values: z.infer<typeof indicationSchema>) => {
    createIndication.mutate(values);
  };

  const onRequestSubmit = (values: z.infer<typeof requestSchema>) => {
    createRequest.mutate(values);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <SEOHelmet 
        title="Meu Progresso" 
        description="Acompanhe seu progresso, métricas e faça solicitações."
      />
      
      <h1 className="text-3xl font-bold">Meu Progresso</h1>

      {/* KPIs Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Relatórios de Performance
        </h2>
        
        {kpisLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !kpis || kpis.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum relatório disponível</h3>
              <p className="text-muted-foreground">
                Seus relatórios de performance aparecerão aqui quando estiverem disponíveis.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {kpis.map((kpi) => (
              <Card key={kpi.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {kpi.title}
                    <Badge variant="secondary">
                      {new Date(kpi.report_date).toLocaleDateString('pt-BR')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kpi.summary && <p className="text-sm text-muted-foreground mb-4">{kpi.summary}</p>}
                  <div className="grid grid-cols-2 gap-4">
                    {kpi.leads_generated && (
                      <div>
                        <p className="text-sm text-muted-foreground">Leads</p>
                        <p className="text-2xl font-bold">{kpi.leads_generated}</p>
                      </div>
                    )}
                    {kpi.sales_count && (
                      <div>
                        <p className="text-sm text-muted-foreground">Vendas</p>
                        <p className="text-2xl font-bold">{kpi.sales_count}</p>
                      </div>
                    )}
                    {kpi.cac && (
                      <div>
                        <p className="text-sm text-muted-foreground">CAC</p>
                        <p className="text-2xl font-bold">R$ {kpi.cac}</p>
                      </div>
                    )}
                    {kpi.ltv && (
                      <div>
                        <p className="text-sm text-muted-foreground">LTV</p>
                        <p className="text-2xl font-bold">R$ {kpi.ltv}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Actions Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Indications */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Minhas Indicações
            </h2>
            <Dialog open={indicationOpen} onOpenChange={setIndicationOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Indicar Contato
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Indicar Novo Contato</DialogTitle>
                </DialogHeader>
                <Form {...indicationForm}>
                  <form onSubmit={indicationForm.handleSubmit(onIndicationSubmit)} className="space-y-4">
                    <FormField
                      control={indicationForm.control}
                      name="indicated_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Indicado *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={indicationForm.control}
                      name="indicated_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={indicationForm.control}
                      name="indicated_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createIndication.isPending}>
                      {createIndication.isPending ? 'Enviando...' : 'Enviar Indicação'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {indications && indications.length > 0 ? (
            <div className="space-y-3">
              {indications.slice(0, 3).map((indication) => (
                <Card key={indication.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{indication.indicated_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(indication.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant={indication.status === 'APROVADO' ? 'default' : 'secondary'}>
                        {indication.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma indicação ainda</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Requests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Minhas Solicitações
            </h2>
            <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Solicitação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fazer Nova Solicitação</DialogTitle>
                </DialogHeader>
                <Form {...requestForm}>
                  <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
                    <FormField
                      control={requestForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={requestForm.control}
                      name="request_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Solicitação *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PARCERIA">Proposta de Parceria</SelectItem>
                              <SelectItem value="ADICIONAL_CRONOGRAMA">Item Adicional ao Cronograma</SelectItem>
                              <SelectItem value="SUPORTE">Suporte Técnico</SelectItem>
                              <SelectItem value="OUTRO">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={requestForm.control}
                      name="details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detalhes *</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createRequest.isPending}>
                      {createRequest.isPending ? 'Enviando...' : 'Enviar Solicitação'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.slice(0, 3).map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{request.title}</p>
                      <Badge variant={request.status === 'APROVADO' ? 'default' : 'secondary'}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{request.request_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma solicitação ainda</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
};

export default ClientProgress;