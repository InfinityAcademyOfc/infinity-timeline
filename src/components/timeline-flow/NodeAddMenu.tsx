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
        className="fixed z-50 p-6 shadow-2xl border-primary/20 bg-gradient-to-br from-background/98 to-primary/5 backdrop-blur-md"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-primary">Adicionar Nó</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-primary/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {nodeTypeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.type}
                variant="outline"
                size="sm"
                onClick={() => handleAddNode(option.type, option.color)}
                disabled={creating}
                className="flex flex-col items-center gap-2 h-auto py-4 hover:scale-105 transition-all duration-200 border-2 hover:shadow-lg"
                style={{ 
                  borderColor: `${option.color}40`,
                  backgroundColor: `${option.color}10`
                }}
              >
                <div 
                  className="p-2 rounded-lg"
                  style={{ 
                    backgroundColor: `${option.color}20`,
                    boxShadow: `0 0 15px ${option.color}40`
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: option.color }} />
                </div>
                <span className="text-xs font-medium">{option.label}</span>
              </Button>
            );
          })}
        </div>
      </Card>
    </>
  );
}
