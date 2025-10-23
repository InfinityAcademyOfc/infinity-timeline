import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Gift } from 'lucide-react';

interface IndicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthlyFee: number;
}

export const IndicationModal = ({ open, onOpenChange, monthlyFee }: IndicationModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    indicated_name: '',
    indicated_email: '',
    indicated_phone: '',
  });

  const pointsToEarn = Math.floor(monthlyFee * 0.25);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('indications')
        .insert({
          client_id: user.id,
          indicated_name: formData.indicated_name,
          indicated_email: formData.indicated_email || null,
          indicated_phone: formData.indicated_phone || null,
          status: 'PENDENTE',
        });

      if (error) throw error;

      toast({
        title: 'Indicação enviada!',
        description: `Você ganhará ${pointsToEarn} pontos quando a indicação for aprovada.`,
      });

      setFormData({ indicated_name: '', indicated_email: '', indicated_phone: '' });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar indicação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-primary/10 border border-primary/20">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl">Indique e Ganhe</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Indique novos clientes e ganhe <span className="text-primary font-bold">{pointsToEarn} pontos</span> por cada indicação aprovada!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="indicated_name">Nome da Indicação *</Label>
            <Input
              id="indicated_name"
              value={formData.indicated_name}
              onChange={(e) => setFormData({ ...formData, indicated_name: e.target.value })}
              placeholder="Nome completo"
              required
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="indicated_email">Email</Label>
            <Input
              id="indicated_email"
              type="email"
              value={formData.indicated_email}
              onChange={(e) => setFormData({ ...formData, indicated_email: e.target.value })}
              placeholder="email@exemplo.com"
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="indicated_phone">Telefone</Label>
            <Input
              id="indicated_phone"
              value={formData.indicated_phone}
              onChange={(e) => setFormData({ ...formData, indicated_phone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-primary mb-1">Como funciona?</p>
              <p className="text-muted-foreground">
                Sua indicação será analisada pela nossa equipe. Após a aprovação e contratação, você receberá automaticamente os pontos na sua conta.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary hover:opacity-90"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Indicação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
