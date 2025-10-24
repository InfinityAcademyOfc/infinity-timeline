import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Gift, Plus, Award } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BonusManagerProps {
  clientId: string;
}

export const BonusManager = ({ clientId }: BonusManagerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bonuses, isLoading } = useQuery({
    queryKey: ['client-bonuses', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_bonuses')
        .select(`
          *,
          awarded_by_profile:profiles!client_bonuses_awarded_by_fkey(full_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const addBonusMutation = useMutation({
    mutationFn: async (data: { client_id: string; points: number; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Add bonus record
      const { error: bonusError } = await supabase
        .from('client_bonuses')
        .insert({
          client_id: data.client_id,
          points: data.points,
          reason: data.reason,
          awarded_by: user.id,
        });
      
      if (bonusError) throw bonusError;

      // Update client points
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', data.client_id)
        .single();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: (profile?.points || 0) + data.points })
        .eq('id', data.client_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast({
        title: "Bônus concedido!",
        description: "Os pontos foram adicionados à conta do cliente.",
      });
      queryClient.invalidateQueries({ queryKey: ['client-bonuses', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-details', clientId] });
      setIsModalOpen(false);
      setPoints(0);
      setReason('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao conceder bônus",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddBonus = () => {
    if (points <= 0 || !reason) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha os pontos e a justificativa.",
        variant: "destructive"
      });
      return;
    }

    addBonusMutation.mutate({ client_id: clientId, points, reason });
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-card backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Gerenciar Bônus
            </CardTitle>
            <CardDescription>
              Conceda pontos extras ao cliente por motivos especiais
            </CardDescription>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Conceder Bônus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conceder Bônus de Pontos</DialogTitle>
                <DialogDescription>
                  Adicione pontos extras com uma justificativa
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Quantidade de Pontos</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    placeholder="Ex: 100"
                    value={points || ''}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Justificativa</Label>
                  <Textarea
                    id="reason"
                    placeholder="Ex: Entrega excepcional do projeto"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddBonus} disabled={addBonusMutation.isPending}>
                    {addBonusMutation.isPending ? 'Concedendo...' : 'Conceder Bônus'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bonuses && bonuses.length > 0 ? (
          <div className="space-y-3">
            {bonuses.map((bonus) => (
              <Card key={bonus.id} className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="h-4 w-4 text-primary" />
                        <Badge variant="default">+{bonus.points} pontos</Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">{bonus.reason}</p>
                      <div className="text-xs text-muted-foreground">
                        Concedido por {bonus.awarded_by_profile?.full_name || 'Admin'} em{' '}
                        {new Date(bonus.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum bônus concedido ainda</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
