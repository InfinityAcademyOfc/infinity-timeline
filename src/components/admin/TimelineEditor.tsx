import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Link as LinkIcon, Calendar, Percent } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress_status?: string;
  due_date: string;
  completion_percentage?: number;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
}

interface TimelineEditorProps {
  clientTimelineId: string;
  items: TimelineItem[];
  onRefresh: () => void;
}

export const TimelineEditor = ({ clientTimelineId, items, onRefresh }: TimelineEditorProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [actualHours, setActualHours] = useState(0);
  const [tags, setTags] = useState('');
  
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateItemMutation = useMutation({
    mutationFn: async (data: Partial<TimelineItem> & { id: string }) => {
      const { error } = await supabase
        .from('timeline_items')
        .update({
          title: data.title,
          description: data.description,
          due_date: data.due_date,
          completion_percentage: data.completion_percentage,
          estimated_hours: data.estimated_hours,
          actual_hours: data.actual_hours,
          tags: data.tags,
        })
        .eq('id', data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Item atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
      setIsEditModalOpen(false);
      onRefresh();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const addLinkMutation = useMutation({
    mutationFn: async (data: { timeline_item_id: string; title: string; url: string; description?: string }) => {
      const { error } = await supabase
        .from('timeline_item_links')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Link adicionado!",
        description: "O link foi adicionado ao item com sucesso.",
      });
      setIsLinkModalOpen(false);
      resetLinkForm();
      onRefresh();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar link",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('timeline_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Item removido!",
        description: "O item foi removido do cronograma.",
      });
      onRefresh();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const openEditModal = (item: TimelineItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setDueDate(item.due_date);
    setCompletionPercentage(item.completion_percentage || 0);
    setEstimatedHours(item.estimated_hours || 0);
    setActualHours(item.actual_hours || 0);
    setTags(item.tags?.join(', ') || '');
    setIsEditModalOpen(true);
  };

  const openLinkModal = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsLinkModalOpen(true);
  };

  const handleSave = () => {
    if (!editingItem) return;

    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);

    updateItemMutation.mutate({
      id: editingItem.id,
      title,
      description,
      due_date: dueDate,
      completion_percentage: completionPercentage,
      estimated_hours: estimatedHours,
      actual_hours: actualHours,
      tags: tagsArray,
    });
  };

  const handleAddLink = () => {
    if (!selectedItemId || !linkTitle || !linkUrl) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e URL do link.",
        variant: "destructive"
      });
      return;
    }

    addLinkMutation.mutate({
      timeline_item_id: selectedItemId,
      title: linkTitle,
      url: linkUrl,
      description: linkDescription,
    });
  };

  const resetLinkForm = () => {
    setLinkTitle('');
    setLinkUrl('');
    setLinkDescription('');
    setSelectedItemId(null);
  };

  const handleDelete = (itemId: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDO': return 'bg-success/20 text-success border-success/50';
      case 'EM_PROGRESSO': return 'bg-timeline-progress/20 text-timeline-progress border-timeline-progress/50';
      case 'PENDENTE': return 'bg-timeline-pending/20 text-timeline-pending border-timeline-pending/50';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-glow transition-all border-2">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  <h4 className="font-semibold">{item.title}</h4>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.due_date).toLocaleDateString()}
                  </div>
                  {item.completion_percentage !== undefined && (
                    <div className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      {item.completion_percentage}% concluído
                    </div>
                  )}
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {item.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditModal(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => openLinkModal(item.id)}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Item do Cronograma</DialogTitle>
            <DialogDescription>
              Atualize os detalhes e progresso do item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Percentual Concluído (%)</Label>
                <Input type="number" min="0" max="100" value={completionPercentage} onChange={(e) => setCompletionPercentage(parseInt(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horas Estimadas</Label>
                <Input type="number" min="0" value={estimatedHours} onChange={(e) => setEstimatedHours(parseFloat(e.target.value))} />
              </div>

              <div className="space-y-2">
                <Label>Horas Reais</Label>
                <Input type="number" min="0" value={actualHours} onChange={(e) => setActualHours(parseFloat(e.target.value))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input placeholder="planejamento, design, desenvolvimento" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updateItemMutation.isPending}>
                {updateItemMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Modal */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Link ao Item</DialogTitle>
            <DialogDescription>
              Adicione um link relevante para este item do cronograma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título do Link</Label>
              <Input placeholder="Ex: Documento de Especificação" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>URL</Label>
              <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea placeholder="Informações sobre o link..." value={linkDescription} onChange={(e) => setLinkDescription(e.target.value)} rows={2} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsLinkModalOpen(false); resetLinkForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleAddLink} disabled={addLinkMutation.isPending}>
                {addLinkMutation.isPending ? 'Adicionando...' : 'Adicionar Link'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
