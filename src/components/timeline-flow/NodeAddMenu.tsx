import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Box, FileText, Image, Link as LinkIcon, Package, ShoppingCart, 
  Target, Video, Kanban, Milestone, X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NodeAddMenuProps {
  position: { x: number; y: number };
  clientTimelineId?: string;
  templateId?: string;
  isTemplateMode: boolean;
  onClose: () => void;
  onNodeAdded: () => void;
}

const nodeTypeOptions = [
  { type: 'service', label: 'Serviço', icon: Package, color: '#00f5ff' },
  { type: 'product', label: 'Produto', icon: ShoppingCart, color: '#ff00ff' },
  { type: 'deliverable', label: 'Entregável', icon: Target, color: '#00ff00' },
  { type: 'link', label: 'Link', icon: LinkIcon, color: '#ffff00' },
  { type: 'document', label: 'Documento', icon: FileText, color: '#ff8800' },
  { type: 'media', label: 'Mídia', icon: Image, color: '#8800ff' },
  { type: 'youtube', label: 'YouTube', icon: Video, color: '#ff0000' },
  { type: 'kanban', label: 'Kanban', icon: Kanban, color: '#00ffff' },
  { type: 'milestone', label: 'Marco', icon: Milestone, color: '#ff4444' },
  { type: 'custom', label: 'Personalizado', icon: Box, color: '#aaaaaa' },
];

export default function NodeAddMenu({
  position,
  clientTimelineId,
  templateId,
  isTemplateMode,
  onClose,
  onNodeAdded,
}: NodeAddMenuProps) {
  const timelineId = isTemplateMode ? templateId : clientTimelineId;
  const [creating, setCreating] = useState(false);

  const handleAddNode = async (nodeType: string, color: string) => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tableName = isTemplateMode ? 'timeline_template_nodes' : 'timeline_nodes';
      const idColumn = isTemplateMode ? 'template_id' : 'client_timeline_id';
      
      const insertData: any = {
        [idColumn]: timelineId,
        node_type: nodeType as any,
        title: `Novo ${nodeTypeOptions.find(n => n.type === nodeType)?.label}`,
        position_x: position.x,
        position_y: position.y,
        color: color,
        glow_color: color,
        node_shape: 'rounded' as any,
        created_by: user?.id,
      };

      const { error } = await supabase
        .from(tableName as any)
        .insert([insertData]);

      if (error) throw error;

      toast.success('Nó adicionado com sucesso');
      onNodeAdded();
    } catch (error) {
      console.error('Error adding node:', error);
      toast.error('Erro ao adicionar nó');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <Card
        className="fixed z-50 w-80 shadow-2xl border-primary/40 bg-card/98 backdrop-blur-md"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/20">
          <h3 className="text-sm font-semibold text-foreground">Selecione o tipo de nó</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-primary/10"
            onClick={onClose}
          >
            <X className="h-4 w-4 text-foreground" />
          </Button>
        </div>
        
        {/* Node types grid */}
        <div className="grid grid-cols-2 gap-2 p-4">
          {nodeTypeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.type}
                onClick={() => handleAddNode(option.type, option.color)}
                disabled={creating}
                className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-primary/5 hover:bg-primary/15 border border-primary/30 hover:border-primary/50 transition-all"
              >
                <Icon className="h-6 w-6" style={{ color: option.color }} />
                <span className="text-xs text-center font-medium text-foreground">
                  {option.label}
                </span>
              </Button>
            );
          })}
        </div>
      </Card>
    </>
  );
}
