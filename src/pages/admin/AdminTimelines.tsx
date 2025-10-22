import { useState } from 'react';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Upload, Plus, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ParsedTimeline {
  name: string;
  duration: number;
  items: Array<{
    title: string;
    description?: string;
    category: 'FASE' | 'MES' | 'ENTREGAVEL';
    display_order: number;
    parent_id?: string;
  }>;
}

const AdminTimelines = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['timeline-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_templates')
        .select(`
          *,
          timeline_template_items(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const importTimelineMutation = useMutation({
    mutationFn: async (parsedData: ParsedTimeline) => {
      const { data, error } = await supabase.functions.invoke('import-timeline', {
        body: parsedData
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Cronograma importado com sucesso!",
        description: "O novo template foi adicionado à lista."
      });
      queryClient.invalidateQueries({ queryKey: ['timeline-templates'] });
      setIsImportModalOpen(false);
      setSelectedFile(null);
    },
    onError: (error: any) => {
      console.error('Import error:', error);
      toast({
        title: "Erro na importação",
        description: error.message || error.error || "Não foi possível importar o cronograma. Verifique o formato do arquivo.",
        variant: "destructive"
      });
    }
  });

  const parseTimelineFile = (content: string): ParsedTimeline => {
    try {
      const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length === 0) {
        throw new Error('Arquivo vazio ou sem conteúdo válido');
      }
      
      let name = 'Cronograma Importado';
      let duration = 12;
      const items: ParsedTimeline['items'] = [];
      let currentOrder = 1;
      let currentPhase: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (!line || line.length === 0) continue; // Skip empty lines
      // Extrair nome do cronograma (primeira linha ou linha com "CRONOGRAMA:")
      if (line.toUpperCase().includes('CRONOGRAMA:') || items.length === 0) {
        const nameMatch = line.match(/(?:CRONOGRAMA:\s*)?(.+?)(?:\s*-?\s*\d+\s*meses?)?$/i);
        if (nameMatch && nameMatch[1]) {
          name = nameMatch[1].trim();
        }
      }

      // Extrair duração
      const durationMatch = line.match(/(\d+)\s*meses?/i);
      if (durationMatch) {
        duration = parseInt(durationMatch[1]);
      }

      // Identificar FASE
      if (line.toUpperCase().startsWith('FASE')) {
        const phaseTitle = line.replace(/^FASE\s*\d*[\s:-]*/i, '').trim();
        items.push({
          title: phaseTitle,
          category: 'FASE',
          display_order: currentOrder++
        });
        currentPhase = phaseTitle;
      }
      
      // Identificar Mês
      else if (line.toUpperCase().startsWith('MÊS') || line.toUpperCase().match(/^M[EÊ]S\s*\d+/)) {
        const monthTitle = line.replace(/^M[EÊ]S\s*\d*[\s:-]*/i, '').trim();
        items.push({
          title: monthTitle,
          category: 'MES',
          display_order: currentOrder++
        });
      }
      
      // Identificar Foco Principal
      else if (line.toUpperCase().includes('FOCO PRINCIPAL:')) {
        const focus = line.replace(/^.*FOCO PRINCIPAL:\s*/i, '').trim();
        if (focus) {
          items.push({
            title: `Foco: ${focus}`,
            category: 'ENTREGAVEL',
            display_order: currentOrder++
          });
        }
      }
      
      // Identificar Entregáveis
      else if (line.toUpperCase().includes('ENTREGÁVEIS:') || line.toUpperCase().includes('ENTREGAVEIS:')) {
        const deliverables = line.replace(/^.*ENTREGÁVEIS?:\s*/i, '').trim();
        if (deliverables) {
          // Dividir por vírgula ou ponto e vírgula
          const items_list = deliverables.split(/[,;]/).map(item => item.trim()).filter(item => item);
          items_list.forEach(item => {
            items.push({
              title: item,
              category: 'ENTREGAVEL',
              display_order: currentOrder++
            });
          });
        }
      }
      
      // Linhas que começam com "-" ou "•" como entregáveis
      else if (line.match(/^[-•*]\s*/)) {
        const item = line.replace(/^[-•*]\s*/, '').trim();
        if (item) {
          items.push({
            title: item,
            category: 'ENTREGAVEL',
            display_order: currentOrder++
          });
        }
      }
    }

      if (items.length === 0) {
        throw new Error('Nenhum item válido encontrado no arquivo. Verifique o formato.');
      }

      return { name, duration, items };
    } catch (error) {
      console.error('Parse error:', error);
      throw new Error(`Erro ao processar arquivo: ${error.message}`);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const content = await selectedFile.text();
      const parsedData = parseTimelineFile(content);
      
      if (parsedData.items.length === 0) {
        throw new Error("Não foram encontrados itens válidos no arquivo.");
      }

      await importTimelineMutation.mutateAsync(parsedData);
    } catch (error: any) {
      toast({
        title: "Erro no parsing",
        description: error.message || "Não foi possível processar o arquivo.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <SEOHelmet 
        title="Gerenciar Cronogramas" 
        description="Gerencie templates de cronograma e importe novos arquivos."
      />
      
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Gerenciar Cronogramas
            </h1>
            <p className="text-muted-foreground text-lg">
              Templates disponíveis e ferramentas de importação
            </p>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="shadow-lg">
                  <Upload className="h-5 w-5 mr-2" />
                  Importar Cronograma
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Importar Cronograma de Arquivo</DialogTitle>
                  <DialogDescription>
                    Carregue um arquivo .txt ou .md com a estrutura do cronograma
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Arquivo (.txt ou .md)</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".txt,.md"
                      onChange={handleFileSelect}
                    />
                  </div>
                  
                  {selectedFile && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                        <Badge variant="secondary">{selectedFile.type || 'text/plain'}</Badge>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleImport}
                      disabled={!selectedFile || isImporting}
                    >
                      {isImporting ? 'Importando...' : 'Importar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Criar Novo Cronograma
            </Button>
          </div>
        </div>

        {/* Tabela de Templates */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Templates de Cronograma
            </CardTitle>
            <CardDescription>
              Lista de todos os templates disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Cronograma</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {template.duration_months} meses
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {template.timeline_template_items?.[0]?.count || 0} itens
                    </TableCell>
                    <TableCell>
                      {new Date(template.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {templates?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum template cadastrado ainda. Comece importando um arquivo ou criando manualmente.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTimelines;