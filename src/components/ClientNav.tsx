import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Calendar, FileText, TrendingUp, Users, Settings } from 'lucide-react';

const navItems = [
  {
    title: 'Dashboard',
    href: '/cliente/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Cronograma',
    href: '/cliente/cronograma',
    icon: Calendar,
  },
  {
    title: 'Documentos',
    href: '/cliente/documentos',
    icon: FileText,
  },
  {
    title: 'Progresso',
    href: '/cliente/progresso',
    icon: TrendingUp,
  },
  {
    title: 'Indicações',
    href: '/cliente/indicacoes',
    icon: Users,
  },
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings,
  },
];

export const ClientNav = () => {
  const location = useLocation();

  return (
    <nav className="flex gap-2 mb-6 overflow-x-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap',
              'hover:bg-primary/10 hover:text-primary',
              isActive
                ? 'bg-gradient-primary text-primary-foreground shadow-glow'
                : 'bg-card text-muted-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
};