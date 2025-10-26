// src/pages/client/ClientSettings.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast'; // Importar useToast

// Schema Zod atualizado com campos da empresa (opcionais)
const formSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  company_logo_url: z.string().url('URL inválida').nullable(),
  notify_on_comment: z.boolean(),
  notify_on_progress: z.boolean(),
  company_name: z.string().nullable().optional(),
  responsible_name: z.string().nullable().optional(),
  cnpj: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  responsible_phone: z.string().nullable().optional(),
});

type ProfileFormValues = z.infer<typeof formSchema>;

const ClientSettings = () => {
  const { user, userProfile, setUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast(); // Hook para toasts

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      company_logo_url: null,
      notify_on_comment: true,
      notify_on_progress: true,
      company_name: '',
      responsible_name: '',
      cnpj: '',
      address: '',
      phone: '',
      responsible_phone: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        full_name: userProfile.full_name || '',
        email: userProfile.email || '',
        company_logo_url: userProfile.company_logo_url || null,
        notify_on_comment: userProfile.notify_on_comment ?? true,
        notify_on_progress: userProfile.notify_on_progress ?? true,
        company_name: userProfile.company_name || '',
        responsible_name: userProfile.responsible_name || '',
        cnpj: userProfile.cnpj || '',
        address: userProfile.address || '',
        phone: userProfile.phone || '',
        responsible_phone: userProfile.responsible_phone || '',
      });
    }
  }, [userProfile, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Remover email do objeto de atualização, pois não deve ser alterado aqui
      const { email, ...updateData } = values;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select('*, roles:user_roles(role)') // Buscar perfil atualizado com roles
        .single();

      if (error) throw error;

      setUserProfile(data as any); // Atualiza o perfil no contexto
      toast({ title: 'Sucesso!', description: 'Seu perfil foi atualizado.' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-logo.${fileExt}`;
    const filePath = `logos/${fileName}`;

    setIsUploading(true);
    try {
      // Excluir logo antigo (se existir) - opcional, mas boa prática
      // await supabase.storage.from('documents').remove([`logos/${user.id}-logo.*`]); // Isso requereria listar antes

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true }); // Usar upsert para sobrescrever

      if (uploadError) {
        throw uploadError;
      }

      // Obter a URL pública do arquivo recém-carregado
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;

      // Atualizar a URL no perfil do usuário
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ company_logo_url: publicUrl })
        .eq('id', user.id)
        .select('*, roles:user_roles(role)')
        .single();

      if (updateError) {
        throw updateError;
      }

      setUserProfile(data as any); // Atualiza o perfil no contexto com a nova URL
      form.setValue('company_logo_url', publicUrl); // Atualiza o valor no formulário
      toast({ title: 'Sucesso!', description: 'Logo atualizado.' });

    } catch (error: any) {
      console.error('Error uploading logo:', error);
      // ADICIONADO TOAST DE ERRO
      toast({ title: 'Erro no Upload', description: error.message || 'Falha ao enviar o logo.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações da Conta</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais, dados da empresa e preferências.
        </p>
      </div>
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Seção de Perfil Pessoal */}
          <div className="flex items-center gap-4">
             <Avatar className="h-16 w-16">
               <AvatarImage src={form.watch('company_logo_url') || undefined} alt="Logo da Empresa" />
               <AvatarFallback>{userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
             </Avatar>
             <div className="grid gap-1">
               <Label htmlFor="logo-upload" className="cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline">
                 {isUploading ? 'Enviando...' : 'Alterar Logo'}
               </Label>
               <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploading} />
               <p className="text-xs text-muted-foreground">PNG, JPG, GIF até 1MB</p>
             </div>
          </div>

          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="seu@email.com" {...field} disabled /> {/* Email não editável */}
                </FormControl>
                <FormDescription>
                  Seu email de login não pode ser alterado aqui.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Seção de Dados da Empresa */}
          <h3 className="text-lg font-medium pt-4">Dados da Empresa</h3>
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
               control={form.control}
               name="company_name"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Nome da Empresa</FormLabel>
                   <FormControl>
                     <Input placeholder="Nome da sua Empresa" {...field} value={field.value || ''} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
             <FormField
               control={form.control}
               name="cnpj"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>CNPJ</FormLabel>
                   <FormControl>
                     <Input placeholder="00.000.000/0001-00" {...field} value={field.value || ''} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
             <FormField
               control={form.control}
               name="responsible_name"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Nome do Responsável</FormLabel>
                   <FormControl>
                     <Input placeholder="Nome do Responsável Legal" {...field} value={field.value || ''} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
             <FormField
               control={form.control}
               name="responsible_phone"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Telefone do Responsável</FormLabel>
                   <FormControl>
                     <Input placeholder="(00) 90000-0000" {...field} value={field.value || ''} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
             <FormField
               control={form.control}
               name="phone"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Telefone da Empresa</FormLabel>
                   <FormControl>
                     <Input placeholder="(00) 0000-0000" {...field} value={field.value || ''} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
             <FormField
               control={form.control}
               name="address"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Endereço Completo</FormLabel>
                   <FormControl>
                     <Input placeholder="Rua, Número, Bairro, Cidade - Estado, CEP" {...field} value={field.value || ''} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
          </div>

          {/* Seção de Preferências */}
          <h3 className="text-lg font-medium pt-4">Preferências de Notificação</h3>
          <Separator />
          <div className="space-y-4">
             <FormField
               control={form.control}
               name="notify_on_comment"
               render={({ field }) => (
                 <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                   <div className="space-y-0.5">
                     <FormLabel className="text-base">Comentários</FormLabel>
                     <FormDescription>
                       Receber notificações sobre novos comentários nas tarefas.
                     </FormDescription>
                   </div>
                   <FormControl>
                     <Switch
                       checked={field.value}
                       onCheckedChange={field.onChange}
                     />
                   </FormControl>
                 </FormItem>
               )}
             />
             <FormField
               control={form.control}
               name="notify_on_progress"
               render={({ field }) => (
                 <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                   <div className="space-y-0.5">
                     <FormLabel className="text-base">Atualizações de Progresso</FormLabel>
                     <FormDescription>
                       Receber notificações quando o status das tarefas mudar.
                     </FormDescription>
                   </div>
                   <FormControl>
                     <Switch
                       checked={field.value}
                       onCheckedChange={field.onChange}
                     />
                   </FormControl>
                 </FormItem>
               )}
             />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? <LoadingSpinner /> : 'Salvar Alterações'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ClientSettings;
