import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, CheckSquare, Square } from 'lucide-react';

interface NodeKanbanTabProps {
  nodeId: string;
  isAdmin: boolean;
  onUpdate: () => void;
}

export default function NodeKanbanTab({ nodeId, isAdmin, onUpdate }: NodeKanbanTabProps) {
  const [showBoardDialog, setShowBoardDialog] = useState(false);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [boardTitle, setBoardTitle] = useState('');
  const [cardData, setCardData] = useState({
    title: '',
    description: '',
    tags: '',
    progress: 0,
  });
  const queryClient = useQueryClient();

  const { data: boards } = useQuery({
    queryKey: ['timeline-node-kanban-boards', nodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_node_kanban_boards')
        .select(`
          *,
          cards:timeline_node_kanban_cards(*)
        `)
        .eq('node_id', nodeId)
        .order('position');
      
      if (error) throw error;
      return data;
    },
  });

  const addBoardMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('timeline_node_kanban_boards')
        .insert({
          node_id: nodeId,
          title: boardTitle,
          position: boards?.length || 0,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Quadro adicionado');
      setShowBoardDialog(false);
      setBoardTitle('');
      queryClient.invalidateQueries({ queryKey: ['timeline-node-kanban-boards', nodeId] });
    },
  });

  const addCardMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBoard) return;

      const { error } = await supabase
        .from('timeline_node_kanban_cards')
        .insert({
          board_id: selectedBoard,
          title: cardData.title,
          description: cardData.description,
          tags: cardData.tags ? cardData.tags.split(',').map(t => t.trim()) : [],
          progress: cardData.progress,
          position: 0,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Card adicionado');
      setShowCardDialog(false);
      setCardData({ title: '', description: '', tags: '', progress: 0 });
      queryClient.invalidateQueries({ queryKey: ['timeline-node-kanban-boards', nodeId] });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('timeline_node_kanban_cards')
        .delete()
        .eq('id', cardId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Card excluído');
      queryClient.invalidateQueries({ queryKey: ['timeline-node-kanban-boards', nodeId] });
    },
  });

  return (
    <div className="space-y-4 py-4">
      {isAdmin && (
        <Button onClick={() => setShowBoardDialog(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Quadro
        </Button>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {boards?.map((board) => (
          <Card key={board.id} className="min-w-[300px] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{board.title}</h3>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedBoard(board.id);
                    setShowCardDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {board.cards?.map((card: any) => (
                <Card key={card.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{card.title}</h4>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCardMutation.mutate(card.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {card.description && (
                    <p className="text-xs text-muted-foreground">
                      {card.description}
                    </p>
                  )}

                  {card.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progresso</span>
                      <span className="text-primary">{card.progress}%</span>
                    </div>
                    <Progress value={card.progress} className="h-2" />
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Board Dialog */}
      <Dialog open={showBoardDialog} onOpenChange={setShowBoardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Quadro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board-title">Título do Quadro</Label>
              <Input
                id="board-title"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                placeholder="Ex: A Fazer, Em Progresso, Concluído"
              />
            </div>
            <Button
              onClick={() => addBoardMutation.mutate()}
              disabled={addBoardMutation.isPending || !boardTitle}
              className="w-full"
            >
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Card Dialog */}
      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-title">Título</Label>
              <Input
                id="card-title"
                value={cardData.title}
                onChange={(e) => setCardData({ ...cardData, title: e.target.value })}
                placeholder="Nome da tarefa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-description">Descrição</Label>
              <Textarea
                id="card-description"
                value={cardData.description}
                onChange={(e) => setCardData({ ...cardData, description: e.target.value })}
                placeholder="Descrição da tarefa"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-tags">Tags (separadas por vírgula)</Label>
              <Input
                id="card-tags"
                value={cardData.tags}
                onChange={(e) => setCardData({ ...cardData, tags: e.target.value })}
                placeholder="urgente, importante, revisão"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-progress">Progresso (%)</Label>
              <Input
                id="card-progress"
                type="number"
                min="0"
                max="100"
                value={cardData.progress}
                onChange={(e) => setCardData({ ...cardData, progress: parseInt(e.target.value) || 0 })}
              />
            </div>
            <Button
              onClick={() => addCardMutation.mutate()}
              disabled={addCardMutation.isPending || !cardData.title}
              className="w-full"
            >
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
