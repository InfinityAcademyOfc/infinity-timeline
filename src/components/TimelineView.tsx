import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, Calendar, Link as LinkIcon, Tag } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import type { ProcessedTimelineData, TimelineItem } from '@/pages/client/ClientTimeline';

interface TimelineViewProps {
  timelineData: ProcessedTimelineData;
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface TimelineItemLink {
  id: string;
  title: string;
  url: string;
  description?: string;
}

const TimelineView = ({ timelineData }: TimelineViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [newComment, setNewComment] = useState('');

  // Scroll to current month on mount
  useEffect(() => {
    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const element = document.getElementById(`month-${currentMonthKey}`);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, []);

  // Fetch comments for selected item
  const { data: comments } = useQuery({
    queryKey: ['timeline-comments', selectedItem?.id],
    queryFn: async () => {
      if (!selectedItem?.id) return [];
      
      const { data, error } = await supabase
        .from('timeline_comments')
        .select('id, content, author_id, created_at')
        .eq('timeline_item_id', selectedItem.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Fetch author profiles separately
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', comment.author_id)
            .single();
          
          return {
            ...comment,
            profiles: { full_name: profile?.full_name || 'Usuário' }
          };
        })
      );
      
      return commentsWithProfiles as Comment[];
    },
    enabled: !!selectedItem?.id,
  });

  // Fetch links for selected item
  const { data: links } = useQuery({
    queryKey: ['timeline-item-links', selectedItem?.id],
    queryFn: async () => {
      if (!selectedItem?.id) return [];
      
      const { data, error } = await supabase
        .from('timeline_item_links')
        .select('*')
        .eq('timeline_item_id', selectedItem.id)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as TimelineItemLink[];
    },
    enabled: !!selectedItem?.id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedItem || !user) throw new Error('Missing data');
      
      const { error } = await supabase
        .from('timeline_comments')
        .insert({
          timeline_item_id: selectedItem.id,
          author_id: user.id,
          content,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-comments', selectedItem?.id] });
      setNewComment('');
      toast({
        title: 'Comentário adicionado',
        description: 'Seu comentário foi publicado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao adicionar comentário',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    },
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment);
    }
  };

  const getStatusIcon = (status: TimelineItem['status']) => {
    switch (status) {
      case 'CONCLUIDO':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'EM_ANDAMENTO':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TimelineItem['status']) => {
    const variants = {
      CONCLUIDO: 'default',
      EM_ANDAMENTO: 'secondary',
      PENDENTE: 'outline',
    } as const;

    const labels = {
      CONCLUIDO: 'Concluído',
      EM_ANDAMENTO: 'Em Andamento',
      PENDENTE: 'Pendente',
    };

    return (
      <Badge variant={variants[status]} className="animate-fade-in">
        {labels[status]}
      </Badge>
    );
  };

  const getCardClassName = (status: TimelineItem['status']) => {
    const baseClasses = 'relative overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer min-w-[280px] backdrop-blur-sm';
    
    switch (status) {
      case 'CONCLUIDO':
        return `${baseClasses} bg-gradient-to-br from-success/10 to-success/5 border-success/30 shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]`;
      case 'EM_ANDAMENTO':
        return `${baseClasses} bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30 shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)]`;
      default:
        return `${baseClasses} bg-gradient-to-br from-muted/50 to-muted/20 border-muted-foreground/20 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]`;
    }
  };

  const handleItemClick = (item: TimelineItem) => {
    setSelectedItem(item);
  };

  return (
    <div className="relative">
      {/* Cyber grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary-rgb),0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary-rgb),0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />

      {/* Neon line container */}
      <div ref={containerRef} className="relative flex gap-8 overflow-x-auto pb-8 pt-12 px-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {/* Horizontal neon timeline line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
        <div className="absolute top-6 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 blur-sm animate-glow-pulse" />

        {timelineData.months.map((month, monthIndex) => (
          <div key={month.monthKey} id={`month-${month.monthKey}`} className="flex flex-col gap-4 min-w-fit">
            {/* Month header with neon accent */}
            <div className="flex flex-col items-center gap-2 sticky top-0 z-10 pb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-xl rounded-full" />
                <div className="relative w-4 h-4 rounded-full bg-gradient-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)] border-2 border-background animate-glow-pulse" />
              </div>
              <div className="text-center bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/20 shadow-lg">
                <h3 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {month.monthName}
                </h3>
                <p className="text-xs text-muted-foreground">{month.items.length} {month.items.length === 1 ? 'item' : 'itens'}</p>
              </div>
            </div>

            {/* Timeline items */}
            <div className="flex flex-col gap-6 pl-2">
              {month.items.length > 0 ? (
                month.items.map((item) => (
                  <Card
                    key={item.id}
                    className={getCardClassName(item.status)}
                    onClick={() => handleItemClick(item)}
                  >
                    {/* Neon glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    
                    <CardContent className="relative p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        {getStatusIcon(item.status)}
                        {getStatusBadge(item.status)}
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-semibold text-base leading-tight line-clamp-2">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(item.due_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground italic py-8">
                  Nenhum item neste mês
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Item details sheet */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
          {selectedItem && (
            <>
              <SheetHeader className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-primary/10 border border-primary/20">
                    {getStatusIcon(selectedItem.status)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <SheetTitle className="text-2xl">{selectedItem.title}</SheetTitle>
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(selectedItem.status)}
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedItem.due_date).toLocaleDateString('pt-BR')}
                      </Badge>
                    </div>
                  </div>
                </div>
                {selectedItem.description && (
                  <SheetDescription className="text-base text-foreground/80">
                    {selectedItem.description}
                  </SheetDescription>
                )}
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Progress section */}
                {typeof selectedItem.completion_percentage === 'number' && (
                  <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progresso</span>
                      <span className="text-sm font-bold text-primary">{selectedItem.completion_percentage}%</span>
                    </div>
                    <Progress value={selectedItem.completion_percentage} className="h-2" />
                  </div>
                )}

                {/* Links section */}
                {links && links.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-primary" />
                      Links e Recursos
                    </h3>
                    <div className="space-y-2">
                      {links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg border border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                        >
                          <div className="font-medium text-primary group-hover:underline">{link.title}</div>
                          {link.description && (
                            <div className="text-sm text-muted-foreground mt-1">{link.description}</div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Comentários</h3>
                  
                  <div className="space-y-4">
                    {comments && comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium text-sm">{comment.profiles.full_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic text-center py-4">
                        Nenhum comentário ainda
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Adicione um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      className="w-full bg-gradient-primary hover:opacity-90"
                    >
                      {addCommentMutation.isPending ? 'Enviando...' : 'Adicionar Comentário'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TimelineView;
