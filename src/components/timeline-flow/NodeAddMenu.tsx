import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingCart,
  CheckCircle,
  Link,
  FileText,
  Image,
  Youtube,
  KanbanSquare,
  Flag,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NodeAddMenuProps {
  position: { x: number; y: number };
  clientTimelineId: string;
  onClose: () => void;
  onNodeAdded: () => void;
}

const nodeTypeOptions = [
  { type: 'service', label: 'Serviço', icon: Package, color: '#00f5ff' },
  { type: 'product', label: 'Produto', icon: ShoppingCart, color: '#ff00ff' },
  { type: 'deliverable', label: 'Entregável', icon: CheckCircle, color: '#00ff00' },
  { type: 'link', label: 'Link', icon: Link, color: '#ffff00' },
  { type: 'document', label: 'Documento', icon: FileText, color: '#ff8800' },
  { type: 'media', label: 'Mídia', icon: Image, color: '#8800ff' },
  { type: 'youtube', label: 'YouTube', icon: Youtube, color: '#ff0000' },
  { type: 'kanban', label: 'Kanban', icon: KanbanSquare, color: '#00ffff' },
  { type: 'milestone', label: 'Marco', icon: Flag, color: '#ff4444' },
  { type: 'custom', label: 'Personalizado', icon: Sparkles, color: '#ffffff' },
];

export default function NodeAddMenu({
  position,
  clientTimelineId,
  onClose,
  onNodeAdded,
}: NodeAddMenuProps) {
  const [creating, setCreating] = useState(false);

  const handleAddNode = async (nodeType: string, color: string) => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('timeline_nodes')
        .insert([{
          client_timeline_id: clientTimelineId,
          node_type: nodeType as any,
          title: `Novo ${nodeTypeOptions.find(n => n.type === nodeType)?.label}`,
          position_x: position.x,
          position_y: position.y,
          color: color,
          glow_color: color,
          node_shape: 'rounded' as any,
          created_by: user?.id,
        }]);

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
        className="fixed z-50 p-4 bg-background/95 backdrop-blur-sm border-primary/30 shadow-2xl"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          maxWidth: '320px',
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          {nodeTypeOptions.map(({ type, label, icon: Icon, color }) => (
            <Button
              key={type}
              onClick={() => handleAddNode(type, color)}
              disabled={creating}
              variant="outline"
              className="flex flex-col items-center justify-center h-20 gap-2 hover:scale-105 transition-transform"
              style={{
                borderColor: color,
                color: color,
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </Card>
    </>
  );
}
