import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, ExternalLink, Trash2, Youtube, Play } from 'lucide-react';
import YouTube from 'react-youtube';

interface NodeLinksTabProps {
  nodeId: string;
  isAdmin: boolean;
  onUpdate: () => void;
}

export default function NodeLinksTab({ nodeId, isAdmin, onUpdate }: NodeLinksTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: links } = useQuery({
    queryKey: ['timeline-node-links', nodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_node_links')
        .select('*')
        .eq('node_id', nodeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const addLinkMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('timeline_node_links')
        .insert({
          node_id: nodeId,
          title,
          url,
          description,
          created_by: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Link adicionado');
      setShowAddDialog(false);
      setTitle('');
      setUrl('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['timeline-node-links', nodeId] });
    },
    onError: () => {
      toast.error('Erro ao adicionar link');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('timeline_node_links')
        .delete()
        .eq('id', linkId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Link excluído');
      queryClient.invalidateQueries({ queryKey: ['timeline-node-links', nodeId] });
    },
    onError: () => {
      toast.error('Erro ao excluir link');
    },
  });

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleAddLink = () => {
    if (!title || !url) {
      toast.error('Preencha título e URL');
      return;
    }
    addLinkMutation.mutate();
  };

  return (
    <div className="space-y-4 py-4">
      {isAdmin && (
        <Button onClick={() => setShowAddDialog(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Link
        </Button>
      )}

      <div className="space-y-2">
        {links?.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-background/50 group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isYouTubeUrl(link.url) ? (
                  <Youtube className="h-5 w-5 text-red-500 flex-shrink-0" />
                ) : (
                  <ExternalLink className="h-5 w-5 text-primary flex-shrink-0" />
                )}
                <p className="font-medium truncate">{link.title}</p>
              </div>
              {link.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {link.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              {isYouTubeUrl(link.url) ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVideoModalUrl(link.url)}
                  className="hover:text-red-500"
                >
                  <Play className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(link.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              {isAdmin && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(link.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {!links?.length && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum link adicionado
          </p>
        )}
      </div>

      {/* Add Link Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-title">Título</Label>
              <Input
                id="link-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do link"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-description">Descrição (opcional)</Label>
              <Textarea
                id="link-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do link"
                rows={3}
              />
            </div>
            <Button
              onClick={handleAddLink}
              disabled={addLinkMutation.isPending}
              className="w-full"
            >
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* YouTube Video Modal */}
      {videoModalUrl && (
        <Dialog open={true} onOpenChange={() => setVideoModalUrl(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Assistir Vídeo</DialogTitle>
            </DialogHeader>
            <div className="aspect-video">
              <YouTube
                videoId={getYouTubeVideoId(videoModalUrl) || ''}
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 1,
                  },
                }}
                className="w-full h-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
