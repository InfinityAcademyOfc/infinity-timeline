import { useState } from 'react';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, Trophy, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { GlowButton } from '@/components/GlowButton';
import { AppLayout } from '@/components/AppLayout';

const ClientIndications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    indicated_name: '',
    indicated_email: '',
    indicated_phone: ''
  });

  const { data: indications, isLoading, error } = useQuery({
    queryKey: ['my-indications', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
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

  const createIndicationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('indications')
        .insert({
          client_id: user.id,
          ...data,
          status: 'PENDENTE',
          points_awarded: 0
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Indicação enviada!",
        description: "Sua indicação foi registrada e está sendo analisada.",
      });
      setFormData({ indicated_name: '', indicated_email: '', indicated_phone: '' });
      queryClient.invalidateQueries({ queryKey: ['my-indications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar indicação",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.indicated_name || !formData.indicated_email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e email da indicação.",
        variant: "destructive"
      });
      return;
    }
    createIndicationMutation.mutate(formData);
  };

  if (isLoading) return <LoadingSpinner message="Carregando indicações..." />;
  if (error) return <ErrorMessage error={error as Error} />;

  const totalPoints = indications?.reduce((sum, ind) => sum + (ind.points_awarded || 0), 0) || 0;
  const pendingCount = indications?.filter(ind => ind.status === 'PENDENTE').length || 0;
  const approvedCount = indications?.filter(ind => ind.status === 'CONCLUIDO').length || 0;

  return (
    <AppLayout showClientNav>
      <SEOHelmet 
        title="Minhas Indicações" 
        description="Gerencie suas indicações e ganhe pontos."
      />
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Minhas Indicações
          </h1>
          <p className="text-muted-foreground text-lg">
            Indique novos clientes e ganhe pontos de recompensa
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-card backdrop-blur-sm glow-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPoints} pts</div>
              <p className="text-xs text-muted-foreground">
                Ganhos com indicações
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-card backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">
                Indicações concluídas
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-card backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card className="border-0 shadow-xl bg-gradient-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Nova Indicação
            </CardTitle>
            <CardDescription>
              Preencha os dados da pessoa que você está indicando
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.indicated_name}
                    onChange={(e) => setFormData({ ...formData, indicated_name: e.target.value })}
                    placeholder="João Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.indicated_email}
                    onChange={(e) => setFormData({ ...formData, indicated_email: e.target.value })}
                    placeholder="joao@example.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.indicated_phone}
                  onChange={(e) => setFormData({ ...formData, indicated_phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <GlowButton type="submit" disabled={createIndicationMutation.isPending}>
                {createIndicationMutation.isPending ? 'Enviando...' : 'Enviar Indicação'}
              </GlowButton>
            </form>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="border-0 shadow-xl bg-gradient-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Histórico de Indicações</CardTitle>
            <CardDescription>
              Acompanhe o status de todas as suas indicações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!indications || indications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhuma indicação registrada ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indications.map((indication) => (
                    <TableRow key={indication.id}>
                      <TableCell className="font-medium">{indication.indicated_name}</TableCell>
                      <TableCell>{indication.indicated_email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            indication.status === 'CONCLUIDO' ? 'default' : 
                            indication.status === 'REJEITADO' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {indication.status === 'PENDENTE' && <Clock className="h-3 w-3 mr-1" />}
                          {indication.status === 'CONCLUIDO' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {indication.status === 'REJEITADO' && <XCircle className="h-3 w-3 mr-1" />}
                          {indication.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">
                          +{indication.points_awarded || 0} pts
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(indication.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ClientIndications;
