import { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Clock, CheckCircle, Circle, Play } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProcessedTimelineData, TimelineItem } from '@/pages/client/ClientTimeline';

interface TimelineViewProps {
  timelineData: ProcessedTimelineData;
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  author?: {
    full_name?: string;
    email: string;
  };
}

const TimelineView = ({ timelineData }: TimelineViewProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Center timeline on today's date on initial load
  useEffect(() => {
    if (timelineRef.current && timelineData.months.length > 0) {
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      const monthIndex = timelineData.months.findIndex(month => month.monthKey === todayKey);
      if (monthIndex !== -1) {
        const monthElement = timelineRef.current.children[monthIndex] as HTMLElement;
        if (monthElement) {
          monthElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }
    }
  }, [timelineData]);

  // Fetch comments for selected item
  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['timeline-comments', selectedItem?.id],
    queryFn: async () => {
      if (!selectedItem?.id) return [];
      
      const { data: commentsData, error } = await supabase
        .from('timeline_comments')
        .select('*')
        .eq('timeline_item_id', selectedItem.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Get author info for each comment
      const commentsWithAuthors = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', comment.author_id)
            .single();
          
          return {
            ...comment,
            author: profile
          };
        })
      );
      
      return commentsWithAuthors;
    },
    enabled: !!selectedItem?.id && isSheetOpen,
  });

  // Mutation for adding comments
  const addCommentMutation = useMutation({
    mutationFn: async ({ itemId, content }: { itemId: string; content: string }) => {
      const { data, error } = await supabase
        .from('timeline_comments')
        .insert({
          timeline_item_id: itemId,
          author_id: user!.id,
          content
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Comentário adicionado!",
        description: "Seu comentário foi enviado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['timeline-comments', selectedItem?.id] });
      setCommentText('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar comentário",
        description: error.message || "Não foi possível enviar o comentário.",
        variant: "destructive"
      });
    }
  });

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedItem) return;
    
    addCommentMutation.mutate({ 
      itemId: selectedItem.id, 
      content: commentText.trim() 
    });
  };

  const getStatusIcon = (status: TimelineItem['status']) => {
    switch (status) {
      case 'CONCLUIDO':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'EM_ANDAMENTO':
        return <Play className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TimelineItem['status']) => {
    switch (status) {
      case 'CONCLUIDO':
        return <Badge className="bg-green-500 hover:bg-green-600">Concluído</Badge>;
      case 'EM_ANDAMENTO':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Em Andamento</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getCardClassName = (status: TimelineItem['status']) => {
    const baseClasses = "transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer border-0 shadow-xl bg-gradient-to-br backdrop-blur-sm";
    
    switch (status) {
      case 'CONCLUIDO':
        return `${baseClasses} from-green-500/10 to-green-500/5 border-l-4 border-l-green-500`;
      case 'EM_ANDAMENTO':
        return `${baseClasses} from-blue-500/10 to-blue-500/5 border-l-4 border-l-blue-500`;
      default:
        return `${baseClasses} from-card to-card/80 border-l-4 border-l-muted-foreground`;
    }
  };

  const handleItemClick = (item: TimelineItem) => {
    setSelectedItem(item);
    setIsSheetOpen(true);
  };

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="relative">
      {/* Timeline Container */}
      <div 
        ref={timelineRef}
        className="overflow-x-auto py-8 px-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex gap-8 min-w-max">
          {/* Timeline Central Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 transform -translate-y-1/2 shadow-lg dark:shadow-primary/50"></div>
          
          {timelineData.months.map((month, monthIndex) => {
            const isCurrentMonth = month.monthKey === todayKey;
            
            return (
              <div key={month.monthKey} className="relative flex-shrink-0 w-80">
                {/* Month Header */}
                <div className={`text-center mb-6 ${isCurrentMonth ? 'animate-pulse' : ''}`}>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    isCurrentMonth 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">{month.monthName}</span>
                  </div>
                  
                  {/* Today Marker */}
                  {isCurrentMonth && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
                      <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Timeline Items */}
                <div className="space-y-4 mt-12">
                  {month.items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <span className="text-sm">Nenhum item neste mês</span>
                    </div>
                  ) : (
                    month.items.map((item) => (
                      <Card 
                        key={item.id} 
                        className={getCardClassName(item.status)}
                        onClick={() => handleItemClick(item)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(item.status)}
                              <CardTitle className="text-sm font-medium leading-tight">
                                {item.title}
                              </CardTitle>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(item);
                              }}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {item.description && (
                            <CardDescription className="text-xs mb-3 line-clamp-2">
                              {item.description}
                            </CardDescription>
                          )}
                          
                          <div className="flex items-center justify-between">
                            {getStatusBadge(item.status)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comments Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comentários sobre "{selectedItem.title}"
                </SheetTitle>
                <SheetDescription>
                  Adicione comentários e acompanhe discussões sobre este item do cronograma.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Comments List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {commentsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : comments && comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {comment.author?.full_name || comment.author?.email || 'Usuário'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum comentário ainda.</p>
                      <p className="text-xs">Seja o primeiro a comentar!</p>
                    </div>
                  )}
                </div>

                {/* Add Comment Form */}
                <div className="space-y-3 border-t pt-4">
                  <Textarea
                    placeholder="Digite seu comentário..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    className="w-full"
                  >
                    {addCommentMutation.isPending ? 'Enviando...' : 'Enviar Comentário'}
                  </Button>
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