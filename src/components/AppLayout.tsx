// src/components/AppLayout.tsx
import { Link, Outlet, useNavigate } from 'react-router-dom'; // Adicionado useNavigate
import { CircleUser, Menu, Package2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import NotificationBell from './NotificationBell';

// Imports para o Modal de Onboarding (já devem existir das etapas anteriores)
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Importado aqui
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './ui/use-toast';
import LoadingSpinner from './LoadingSpinner';

const AppLayout = () => {
  // Hooks para Logout e Onboarding
  const { user, userProfile, setUserProfile, isAdmin, signOut } = useAuth(); // ADICIONADO signOut
  const navigate = useNavigate(); // ADICIONADO
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [companyData, setCompanyData] = useState({
    company_name: '', cnpj: '', responsible_name: '', phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Lógica do Onboarding (mantida)
  useEffect(() => {
    if (userProfile && !isAdmin && !userProfile.company_name) {
      setShowOnboarding(true);
      setCompanyData({
        company_name: userProfile.company_name || '',
        cnpj: userProfile.cnpj || '',
        responsible_name: userProfile.responsible_name || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile, isAdmin]);

  const handleSaveOnboarding = async () => {
    if (!user || !companyData.company_name || !companyData.cnpj || !companyData.responsible_name) {
      toast({ title: 'Campos Obrigatórios', description: 'Preencha pelo menos Nome da Empresa, CNPJ e Responsável.', variant: 'destructive'});
      return;
    }
    setIsSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...companyData })
      .eq('id', user.id)
      .select('*, roles:user_roles(role)')
      .single();
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Dados salvos com sucesso!' });
      setUserProfile(data as any);
      setShowOnboarding(false);
      navigate('/cliente/configuracoes');
    }
    setIsSaving(false);
  };

  // Função de Logout para Cliente
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth'); // Redireciona para o login CLIENTE após sair
  };


  return (
    <>
      {/* Modal de Onboarding (mantido) */}
      <Dialog open={showOnboarding}>
         <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
           <DialogHeader>
             <DialogTitle>Complete seu Cadastro</DialogTitle>
             <DialogDescription>
               Precisamos de algumas informações sobre sua empresa para continuar.
             </DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             {/* Campos do formulário de onboarding */}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="company_name" className="text-right">Empresa*</Label>
               <Input id="company_name" value={companyData.company_name} onChange={(e) => setCompanyData({...companyData, company_name: e.target.value})} className="col-span-3" />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="cnpj" className="text-right">CNPJ*</Label>
               <Input id="cnpj" value={companyData.cnpj} onChange={(e) => setCompanyData({...companyData, cnpj: e.target.value})} className="col-span-3" />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="responsible_name" className="text-right">Responsável*</Label>
               <Input id="responsible_name" value={companyData.responsible_name} onChange={(e) => setCompanyData({...companyData, responsible_name: e.target.value})} className="col-span-3" />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="phone" className="text-right">Telefone</Label>
               <Input id="phone" value={companyData.phone} onChange={(e) => setCompanyData({...companyData, phone: e.target.value})} className="col-span-3" />
             </div>
           </div>
           <DialogFooter>
             <Button onClick={handleSaveOnboarding} disabled={isSaving}>
               {isSaving ? <LoadingSpinner /> : 'Salvar e Continuar'}
             </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Layout Principal Cliente */}
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50"> {/* Adicionado z-50 */}
          {/* Navegação Desktop Cliente */}
          <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <Link
              to="/cliente/dashboard"
              className="flex items-center gap-2 text-lg font-semibold md:text-base"
            >
              <Package2 className="h-6 w-6" />
              <span className="">Infinity Timeline</span> {/* Mostra nome */}
            </Link>
            <Link
              to="/cliente/dashboard"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              to="/cliente/timeline"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Cronograma
            </Link>
            <Link
              to="/cliente/documents"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Documentos
            </Link>
            <Link
              to="/cliente/indicacoes"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Indicações
            </Link>
            {/* Adicionar link Progresso se existir a página */}
            {/* <Link
              to="/cliente/progress"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Progresso
            </Link> */}
          </nav>

          {/* Navegação Mobile Cliente (Sheet) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  to="/cliente/dashboard"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Package2 className="h-6 w-6" />
                  <span className="">Infinity Timeline</span>
                </Link>
                <Link to="/cliente/dashboard" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
                <Link to="/cliente/timeline" className="text-muted-foreground hover:text-foreground">
                  Cronograma
                </Link>
                <Link to="/cliente/documents" className="text-muted-foreground hover:text-foreground">
                  Documentos
                </Link>
                <Link to="/cliente/indicacoes" className="text-muted-foreground hover:text-foreground">
                  Indicações
                </Link>
                 {/* <Link to="/cliente/progress" className="text-muted-foreground hover:text-foreground">
                   Progresso
                 </Link> */}
                 <Link to="/cliente/settings" className="text-muted-foreground hover:text-foreground">
                   Configurações
                 </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Ícones da Direita (Notificação e Usuário) */}
          <div className="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
             <NotificationBell />
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="secondary" size="icon" className="rounded-full">
                   <CircleUser className="h-5 w-5" />
                   <span className="sr-only">Toggle user menu</span>
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuLabel>{userProfile?.full_name || 'Minha Conta'}</DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                    <Link to="/cliente/settings">Configurações</Link>
                 </DropdownMenuItem>
                 {/* <DropdownMenuItem>Suporte</DropdownMenuItem> */}
                 <DropdownMenuSeparator />
                 {/* BOTÃO SAIR CLIENTE */}
                 <DropdownMenuItem onClick={handleSignOut} className="text-red-600 hover:text-red-700 cursor-pointer">
                    Sair
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex flex-1 flex-col gap-4 p-4 pt-4 md:gap-8 md:p-8"> {/* Removido pt-20 */}
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default AppLayout;
