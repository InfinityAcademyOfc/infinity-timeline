import { Plus, Type, StickyNote, Folder, ArrowLeft, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ToolsSidebarProps {
  onAddNode: () => void;
  onAddText: () => void;
  onAddNote: () => void;
  onAddGroup: () => void;
  onAddBoard: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  collapsed?: boolean;
}

export function ToolsSidebar({
  onAddNode,
  onAddText,
  onAddNote,
  onAddGroup,
  onAddBoard,
  showBackButton = false,
  onBack,
  collapsed = false,
}: ToolsSidebarProps) {
  const tools = [
    { 
      icon: Plus, 
      label: 'Adicionar Nó', 
      onClick: onAddNode,
      tooltip: 'Adicionar um novo nó ao cronograma'
    },
    { 
      icon: Type, 
      label: 'Adicionar Texto', 
      onClick: onAddText,
      tooltip: 'Adicionar texto livre ao cronograma'
    },
    { 
      icon: StickyNote, 
      label: 'Adicionar Nota', 
      onClick: onAddNote,
      tooltip: 'Adicionar bloco de notas'
    },
    { 
      icon: Folder, 
      label: 'Grupo de Nós', 
      onClick: onAddGroup,
      tooltip: 'Criar grupo clicável de nós'
    },
    { 
      icon: Layout, 
      label: 'Quadro de Anotações', 
      onClick: onAddBoard,
      tooltip: 'Adicionar quadro variável de anotações'
    },
  ];

  return (
    <div 
      className={cn(
        "absolute left-0 top-0 bottom-0 z-20 bg-card/95 backdrop-blur-sm border-r border-primary/20",
        "flex flex-col shadow-lg transition-all duration-300",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-primary/20">
        <h3 className={cn(
          "font-semibold text-foreground transition-opacity",
          collapsed ? "opacity-0 text-[0px]" : "opacity-100 text-sm"
        )}>
          Ferramentas
        </h3>
      </div>

      {/* Tools */}
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {tools.map((tool, index) => (
          <Button
            key={index}
            onClick={tool.onClick}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-foreground hover:bg-primary/10 hover:text-primary",
              "transition-all duration-200 group relative",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? tool.tooltip : undefined}
          >
            <tool.icon className="h-4 w-4 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" />
            <span className={cn(
              "transition-opacity text-sm",
              collapsed ? "opacity-0 absolute" : "opacity-100"
            )}>
              {tool.label}
            </span>
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-popover border border-primary/20 rounded-md
                            opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity
                            whitespace-nowrap text-sm text-popover-foreground shadow-lg z-50">
                {tool.label}
              </div>
            )}
          </Button>
        ))}
      </div>

      {/* Back Button */}
      {showBackButton && onBack && (
        <>
          <Separator className="bg-primary/20" />
          <div className="p-2">
            <Button
              onClick={onBack}
              variant="outline"
              className={cn(
                "w-full justify-start gap-3 text-foreground border-primary/20 hover:bg-primary/10",
                collapsed && "justify-center px-0"
              )}
            >
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              <span className={cn(
                "transition-opacity text-sm",
                collapsed ? "opacity-0 absolute" : "opacity-100"
              )}>
                Voltar
              </span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
