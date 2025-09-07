import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, FileText, Link as LinkIcon, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ClientDocuments = () => {
  const { user } = useAuth();
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['client-documents', user?.id, currentFolder],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleDownload = async (fileUrl: string, title: string) => {
    if (fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
    } else {
      // Handle Supabase storage download
      const { data } = await supabase.storage
        .from('documents')
        .download(fileUrl);
      
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = title;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (fileType === 'LINK') return <LinkIcon className="w-5 h-5" />;
    if (fileType === 'FOLDER') return <Folder className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <SEOHelmet 
          title="Meus Documentos" 
          description="Gerencie e visualize documentos relacionados aos seus projetos."
        />
        <h1 className="text-3xl font-bold mb-8">Meus Documentos</h1>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <SEOHelmet 
        title="Meus Documentos" 
        description="Gerencie e visualize documentos relacionados aos seus projetos."
      />
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Meus Documentos</h1>
        {documents && documents.length > 0 && (
          <Badge variant="secondary">
            {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
          </Badge>
        )}
      </div>

      {!documents || documents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
            <p className="text-muted-foreground">
              Seus documentos aparecerão aqui quando forem disponibilizados pelo administrador.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  {getFileIcon(doc.file_type)}
                  <span>{doc.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Adicionado em: {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                  </div>
                  {doc.file_type !== 'FOLDER' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc.file_url, doc.title)}
                      className="flex items-center gap-2"
                    >
                      {doc.file_type === 'LINK' ? (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          Abrir Link
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientDocuments;