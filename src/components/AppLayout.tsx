import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { AdminNav } from './AdminNav';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AppLayoutProps {
  children: React.ReactNode;
  showAdminNav?: boolean;
}

export const AppLayout = ({ children, showAdminNav = false }: AppLayoutProps) => {
  const { signOut, user, isAdmin, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [companyData, setCompanyData] = useState({
    company_name: '',
    cnpj: '',
    responsible_name: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Só mostra onboarding para clientes (não admins) que não preencheram os dados
    if (userProfile && !isAdmin && !userProfile.company_name) {
      setShowOnboarding(true);
    }
  }, [userProfile, isAdmin]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSaveOnboarding = async () => {
    if (!user) return;
    
    // Validação básica
    if (!companyData.company_name || !companyData.responsible_name) {
      toast({ 
        title: 'Campos obrigatórios', 
        description: 'Por favor, preencha pelo menos o nome da empresa e do responsável.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ ...companyData })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Dados salvos com sucesso!' });
      setShowOnboarding(false);
      navigate('/cliente/dashboard');
    }
    setIsSaving(false);
  };

  return (
    <>
      {/* Modal de Onboarding */}
      <Dialog open={showOnboarding} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[500px] bg-card text-foreground" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Complete seu Cadastro</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Precisamos de algumas informações sobre sua empresa para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company_name" className="text-right text-foreground">Empresa *</Label>
              <Input 
                id="company_name" 
                value={companyData.company_name} 
                onChange={(e) => setCompanyData({...companyData, company_name: e.target.value})} 
                className="col-span-3 bg-background text-foreground placeholder:text-muted-foreground" 
                placeholder="Nome da sua empresa"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cnpj" className="text-right text-foreground">CNPJ</Label>
              <Input 
                id="cnpj" 
                value={companyData.cnpj} 
                onChange={(e) => setCompanyData({...companyData, cnpj: e.target.value})} 
                className="col-span-3 bg-background text-foreground placeholder:text-muted-foreground" 
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responsible_name" className="text-right text-foreground">Responsável *</Label>
              <Input 
                id="responsible_name" 
                value={companyData.responsible_name} 
                onChange={(e) => setCompanyData({...companyData, responsible_name: e.target.value})} 
                className="col-span-3 bg-background text-foreground placeholder:text-muted-foreground" 
                placeholder="Nome do responsável"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right text-foreground">Telefone</Label>
              <Input 
                id="phone" 
                value={companyData.phone} 
                onChange={(e) => setCompanyData({...companyData, phone: e.target.value})} 
                className="col-span-3 bg-background text-foreground placeholder:text-muted-foreground" 
                placeholder="(00) 0000-0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveOnboarding} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar e Continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Infinity Timeline {isAdmin && <span className="text-sm text-foreground">Admin</span>}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="gap-2 text-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {showAdminNav && <AdminNav />}
        {children}
      </main>
      </div>
    </>
  );
};
