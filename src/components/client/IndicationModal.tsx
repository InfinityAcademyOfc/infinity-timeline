// src/components/client/IndicationModal.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast'; // Import useToast
import LoadingSpinner from '../LoadingSpinner';
import { Database } from '@/integrations/supabase/types'; // Import Database types

const indicationSchema = z.object({
  indicated_name: z.string().min(2, { message: 'Nome é obrigatório.' }),
  indicated_email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  indicated_phone: z.string().optional(),
});

type IndicationFormValues = z.infer<typeof indicationSchema>;

interface IndicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IndicationModal = ({ isOpen, onClose }: IndicationModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast(); // Hook para toast
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<IndicationFormValues>({
    resolver: zodResolver(indicationSchema),
  });

  const mutation = useMutation({
    mutationFn: async (newIndication: Omit<Database['public']['Tables']['indications']['Insert'], 'client_id' | 'status'>) => {
      if (!user) throw new Error('Usuário não autenticado');
      setIsLoading(true); // Ativa loading no início da mutação
      const { error } = await supabase.from('indications').insert({
        ...newIndication,
        client_id: user.id,
        status: 'PENDENTE',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      // ORDEM INVERTIDA: Invalida primeiro, depois mostra o toast
      queryClient.invalidateQueries({ queryKey: ['indications', user?.id] });
      toast({ title: 'Sucesso!', description: 'Sua indicação foi enviada.' });
      reset(); // Limpa o formulário
      onClose(); // Fecha o modal
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
       setIsLoading(false); // Desativa loading ao finalizar (sucesso ou erro)
    }
  });

  const onSubmit = (data: IndicationFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Indicar um Amigo</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para indicar alguém. Você ganhará pontos se a indicação for aprovada!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="indicated_name" className="text-right">
                Nome*
              </Label>
              <div className="col-span-3">
                <Input
                  id="indicated_name"
                  {...register('indicated_name')}
                  className={errors.indicated_name ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.indicated_name && <p className="text-sm text-red-500 mt-1">{errors.indicated_name.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="indicated_email" className="text-right">
                Email
              </Label>
               <div className="col-span-3">
                <Input
                  id="indicated_email"
                  type="email"
                  {...register('indicated_email')}
                   className={errors.indicated_email ? 'border-red-500' : ''}
                   disabled={isLoading}
                />
                 {errors.indicated_email && <p className="text-sm text-red-500 mt-1">{errors.indicated_email.message}</p>}
               </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="indicated_phone" className="text-right">
                Telefone
              </Label>
              <Input
                id="indicated_phone"
                {...register('indicated_phone')}
                className="col-span-3"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoadingSpinner /> : 'Enviar Indicação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IndicationModal;
