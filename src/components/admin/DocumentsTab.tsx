import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Link as LinkIcon, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface DocumentsTabProps {
  clientId: string;
}

export const DocumentsTab = ({ clientId }: DocumentsTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [linkData, setLinkData] = useState({ title: '', url: '' });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      // Upload to storage
      const filePath = `${clientId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      // Insert document record
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          client_id: clientId,
          title: file.name,
          file_type: file.type,
          file_url: filePath
        });
      
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast({
        title: "Documento enviado!",
        description: "O documento foi enviado e o cliente foi notificado.",
      });
      setIsUploadDialogOpen(false);
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar documento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const addLinkMutation = useMutation({
    mutationFn: async (data: typeof linkData) => {
      const { error } = await supabase
        .from('documents')
        .insert({
          client_id: clientId,
          title: data.title,
          file_type: 'link',
          file_url: data.url
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Link adicionado!",
        description: "O link foi adicionado e o cliente foi notificado.",
      });
      setIsLinkDialogOpen(false);
      setLinkData({ title: '', url: '' });
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar link",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = () => {
    if (!uploadFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo para enviar.",
        variant: "destructive"
      });
      return;
    }
    uploadFileMutation.mutate(uploadFile);
  };

  const handleAddLink = () => {
    if (!linkData.title || !linkData.url) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha título e URL.",
        variant: "destructive"
      });
      return;
    }
    addLinkMutation.mutate(linkData);
  };

  const downloadDocument = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(fileUrl);
      
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Erro ao baixar documento",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) return <LoadingSpinner message="Carregando documentos..." />;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Arquivo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload de Documento</DialogTitle>
              <DialogDescription>
                Envie um arquivo para o cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Selecione o arquivo</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleFileUpload} disabled={uploadFileMutation.isPending}>
                  {uploadFileMutation.isPending ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Adicionar Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Link</DialogTitle>
              <DialogDescription>
                Adicione um link externo para o cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-title">Título</Label>
                <Input
                  id="link-title"
                  value={linkData.title}
                  onChange={(e) => setLinkData({ ...linkData, title: e.target.value })}
                  placeholder="Nome do documento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  type="url"
                  value={linkData.url}
                  onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddLink} disabled={addLinkMutation.isPending}>
                  {addLinkMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!documents || documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum documento adicionado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      {doc.file_type === 'link' ? 'Link Externo' : doc.file_type || 'Arquivo'}
                    </TableCell>
                    <TableCell>
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {doc.file_type === 'link' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Abrir
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadDocument(doc.file_url, doc.title)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
