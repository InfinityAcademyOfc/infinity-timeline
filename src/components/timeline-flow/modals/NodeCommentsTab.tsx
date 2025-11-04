import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NodeCommentsTabProps {
  nodeId: string;
  isAdmin: boolean;
  onUpdate: () => void;
}

export default function NodeCommentsTab({ nodeId, isAdmin, onUpdate }: NodeCommentsTabProps) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments } = useQuery({
    queryKey: ['timeline-node-comments', nodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_node_comments')
        .select('*')
        .eq('node_id', nodeId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Fetch author info separately
      const commentsWithAuthors = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', comment.author_id)
            .single();
          
          return { ...comment, profile };
        })
      );
      
      return commentsWithAuthors;
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('timeline_node_comments')
        .insert({
          node_id: nodeId,
          author_id: user.id,
          content,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Comentário adicionado');
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['timeline-node-comments', nodeId] });
    },
    onError: () => {
      toast.error('Erro ao adicionar comentário');
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {comments?.map((comment) => (
          <div
            key={comment.id}
            className="p-4 rounded-lg border border-primary/20 bg-background/50"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-primary">
                {comment.profile?.full_name || comment.profile?.email || 'Usuário'}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(comment.created_at), "dd MMM yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
        ))}
        {!comments?.length && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum comentário ainda
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva seu comentário..."
          rows={3}
          className="flex-1"
        />
        <Button
          onClick={handleAddComment}
          disabled={addCommentMutation.isPending || !newComment.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
