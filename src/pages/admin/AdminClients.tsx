import { useState } from 'react';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, UserCheck, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const AdminClients = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          client_timelines(
            id,
            name,
            start_date,
            end_date
          )
        `)
        .eq('role', 'CLIENTE')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: typeof formData) => {
      const { data, error } = await supabase.functions.invoke('create-client', {
        body: clientData
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Cliente criado com sucesso!",
        description: "O novo cliente foi adicionado à plataforma."
      });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setIsCreateModalOpen(false);
      setFormData({ fullName: '', email: '', password: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message || "Não foi possível criar o cliente.",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateClient = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      await createClientMutation.mutateAsync(formData);
    } finally {
      setIsCreating(false);
    }
  };

  const getTimelineStatus = (client: any) => {
    if (!client.client_timelines || client.client_timelines.length === 0) {
      return { label: 'Não Iniciado', variant: 'outline' as const };
    }
    return { label: 'Ativo', variant: 'default' as const };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <SEOHelmet 
        title="Gerenciar Clientes" 
        description="Gerencie clientes da plataforma e atribua cronogramas."
      />
      
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Gerenciar Clientes
            </h1>
            <p className="text-muted-foreground text-lg">
              Cadastre novos clientes e gerencie seus cronogramas
            </p>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo cliente para criar sua conta na plataforma
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    placeholder="Nome completo do cliente"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha Provisória</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    minLength={6}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateClient}
                    disabled={isCreating}
                  >
                    {isCreating ? 'Criando...' : 'Criar Cliente'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de Clientes */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Clientes Cadastrados
            </CardTitle>
            <CardDescription>
              Lista de todos os clientes da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Status do Cronograma</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients?.map((client) => {
                  const timelineStatus = getTimelineStatus(client);
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.full_name || 'Nome não informado'}
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {client.points} pts
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={timelineStatus.variant}>
                          {timelineStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(client.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/clients/${client.id}`}>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Gerenciar
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {clients?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cliente cadastrado ainda.</p>
                <p className="text-sm">Clique em "Adicionar Novo Cliente" para começar.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminClients;