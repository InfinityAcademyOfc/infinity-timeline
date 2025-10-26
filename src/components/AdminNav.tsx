// src/components/AdminNav.tsx
import { Link, useNavigate } from 'react-router-dom'; // Adicionado useNavigate
import { CircleUser, Menu, Package2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import NotificationBell from './NotificationBell'; // Import existente
import { useAuth } from '@/contexts/AuthContext'; // ADICIONADO

const AdminNav = () => {
  const { signOut, userProfile } = useAuth(); // ADICIONADO signOut e userProfile
  const navigate = useNavigate(); // ADICIONADO

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login'); // Redireciona para o login ADMIN após sair
  };

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50"> {/* Adicionado z-50 */}
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Package2 className="h-6 w-6" />
          <span className="sr-only">Infinity Timeline</span>
        </Link>
        <Link
          to="/admin/dashboard"
          className="text-foreground transition-colors hover:text-foreground"
        >
          Dashboard
        </Link>
        <Link
          to="/admin/clients"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Clientes
        </Link>
        <Link
          to="/admin/templates"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Templates
        </Link>
        <Link
          to="/admin/timelines"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Cronogramas
        </Link>
        <Link
          to="/admin/settings"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Configurações
        </Link>
      </nav>
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
              to="/admin/dashboard"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Package2 className="h-6 w-6" />
              <span className="sr-only">Infinity Timeline</span>
            </Link>
            <Link to="/admin/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link
              to="/admin/clients"
              className="text-muted-foreground hover:text-foreground"
            >
              Clientes
            </Link>
            <Link
              to="/admin/templates"
              className="text-muted-foreground hover:text-foreground"
            >
              Templates
            </Link>
             <Link
               to="/admin/timelines"
               className="text-muted-foreground hover:text-foreground"
             >
               Cronogramas
             </Link>
            <Link
              to="/admin/settings"
              className="text-muted-foreground hover:text-foreground"
            >
              Configurações
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar clientes..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <NotificationBell /> {/* Sino de Notificação */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{userProfile?.full_name || 'Minha Conta'}</DropdownMenuLabel> {/* Exibe nome */}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
               <Link to="/admin/settings">Configurações</Link>
            </DropdownMenuItem>
            {/* <DropdownMenuItem>Suporte</DropdownMenuItem> */}
            <DropdownMenuSeparator />
            {/* BOTÃO SAIR ADICIONADO */}
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 hover:text-red-700 cursor-pointer"> {/* Estilizado e com cursor */}
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AdminNav;
