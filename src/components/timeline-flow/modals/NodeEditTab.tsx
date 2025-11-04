import { useState } from 'react';
import { Node } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Trash2 } from 'lucide-react';

interface NodeEditTabProps {
  node: Node;
  isAdmin: boolean;
  onUpdate: () => void;
}

const shapeOptions = [
  { value: 'rounded', label: 'Arredondado' },
  { value: 'rectangle', label: 'Retângulo' },
  { value: 'circle', label: 'Círculo' },
  { value: 'diamond', label: 'Diamante' },
  { value: 'hexagon', label: 'Hexágono' },
];

export default function NodeEditTab({ node, isAdmin, onUpdate }: NodeEditTabProps) {
  const [title, setTitle] = useState(String(node.data.title || ''));
  const [description, setDescription] = useState(String(node.data.description || ''));
  const [color, setColor] = useState(String(node.data.color || '#00f5ff'));
  const [glowColor, setGlowColor] = useState(String(node.data.glow_color || '#00f5ff'));
  const [shape, setShape] = useState(String(node.data.node_shape || 'rounded'));

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('timeline_nodes')
        .update(data)
        .eq('id', node.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Nó atualizado com sucesso');
      onUpdate();
    },
    onError: () => {
      toast.error('Erro ao atualizar nó');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('timeline_nodes')
        .delete()
        .eq('id', node.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Nó excluído com sucesso');
      onUpdate();
    },
    onError: () => {
      toast.error('Erro ao excluir nó');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      title,
      description,
      color,
      glow_color: glowColor,
      node_shape: shape,
    });
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este nó?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!isAdmin}
          placeholder="Nome do nó"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isAdmin}
          placeholder="Descrição detalhada"
          rows={4}
        />
      </div>

      {isAdmin && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Cor Principal</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#00f5ff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="glowColor">Cor do Brilho</Label>
              <div className="flex gap-2">
                <Input
                  id="glowColor"
                  type="color"
                  value={glowColor}
                  onChange={(e) => setGlowColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={glowColor}
                  onChange={(e) => setGlowColor(e.target.value)}
                  placeholder="#00f5ff"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shape">Forma</Label>
            <Select value={shape} onValueChange={setShape}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {shapeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
