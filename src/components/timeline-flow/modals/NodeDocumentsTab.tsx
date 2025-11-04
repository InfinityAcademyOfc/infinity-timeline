import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Download, Trash2, FileText } from 'lucide-react';

interface NodeDocumentsTabProps {
  nodeId: string;
  isAdmin: boolean;
  onUpdate: () => void;
}

export default function NodeDocumentsTab({ nodeId, isAdmin, onUpdate }: NodeDocumentsTabProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const queryClient = useQueryClient();

  const { data: documents } = useQuery({
    queryKey: ['timeline-node-documents', nodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_node_documents')
        .select('*')
        .eq('node_id', nodeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) setTitle(file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title) {
      toast.error('Selecione um arquivo e forneça um título');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${nodeId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('timeline_node_documents')
        .insert({
          node_id: nodeId,
          title,
          file_path: fileName,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;

      toast.success('Documento enviado com sucesso');
      setSelectedFile(null);
      setTitle('');
      queryClient.invalidateQueries({ queryKey: ['timeline-node-documents', nodeId] });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (document: any) => {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('timeline_node_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success('Documento excluído');
      queryClient.invalidateQueries({ queryKey: ['timeline-node-documents', nodeId] });
    },
    onError: () => {
      toast.error('Erro ao excluir documento');
    },
  });

  return (
    <div className="space-y-4 py-4">
      {isAdmin && (
        <div className="space-y-4 p-4 border border-primary/20 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Documento</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do documento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Arquivo</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileSelect}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Enviando...' : 'Enviar Documento'}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {documents?.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-background/50"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {(doc.file_size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(doc.file_path, doc.title)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(doc)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {!documents?.length && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum documento anexado
          </p>
        )}
      </div>
    </div>
  );
}
