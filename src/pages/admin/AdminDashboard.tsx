import { SEOHelmet } from '@/components/SEOHelmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Calendar, Settings, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { NotificationBell } from '@/components/NotificationBell';
import { AppLayout } from '@/components/AppLayout';

const AdminDashboard = () => {
  const { data: clients, isLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      // Buscar apenas usuários que têm role CLIENTE na tabela user_roles
      const { data: clientRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'CLIENTE');

      if (rolesError) throw rolesError;
      
      const clientIds = clientRoles?.map(r => r.user_id) || [];
      
      if (clientIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          client_timelines(count)
        `)
        .in('id', clientIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [clientsRes, timelinesRes, templatesRes] = await Promise.all([
        supabase.from('user_roles').select('user_id', { count: 'exact' }).eq('role', 'CLIENTE'),
        supabase.from('client_timelines').select('id', { count: 'exact' }),
        supabase.from('timeline_templates').select('id', { count: 'exact' })
      ]);

      return {
        totalClients: clientsRes.count || 0,
        totalTimelines: timelinesRes.count || 0,
        totalTemplates: templatesRes.count || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <AppLayout showAdminNav>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showAdminNav>
      <SEOHelmet 
        title="Dashboard Admin" 
        description="Dashboard administrativo para gestão de clientes e templates."
      />
      
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Dashboard Administrativo
            </h1>
            <p className="text-muted-foreground text-lg">
              Gerencie clientes, cronogramas e templates
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Link to="/admin/timelines">
              <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-lg">
                <Calendar className="h-5 w-5 mr-2" />
                Gerenciar Cronogramas
              </Button>
            </Link>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
              <p className="text-xs text-muted-foreground">
                Clientes ativos na plataforma
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cronogramas Ativos</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTimelines || 0}</div>
              <p className="text-xs text-muted-foreground">
                Cronogramas em execução
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <Settings className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTemplates || 0}</div>
              <p className="text-xs text-muted-foreground">
                Templates disponíveis
              </p>
            </CardContent>
          </Card>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients?.map((client) => (
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
                      {new Date(client.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Ativo</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {clients?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cliente cadastrado ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;