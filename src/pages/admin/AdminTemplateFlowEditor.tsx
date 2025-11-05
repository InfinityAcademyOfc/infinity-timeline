import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { SEOHelmet } from '@/components/SEOHelmet';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { TimelineFlowBuilderWrapper } from '@/components/timeline-flow/TimelineFlowBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Save, ArrowLeft, Settings } from 'lucide-react';
import { addMonths } from 'date-fns';

export default function AdminTemplateFlowEditor() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(!templateId);
  
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [durationMonths, setDurationMonths] = useState(12);

  // Fetch template if editing
  const { data: template, isLoading } = useQuery({
    queryKey: ['template-flow', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const { data, error } = await supabase
        .from('timeline_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      
      setTemplateName(data.name);
      setTemplateDescription(data.description || '');
      setDurationMonths(data.duration_months);
      
      return data;
    },
    enabled: !!templateId,
  });

  // Create or update template
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!templateName) {
        throw new Error('Nome do template é obrigatório');
      }

      if (templateId) {
        // Update existing
        const { error } = await supabase
          .from('timeline_templates')
          .update({
            name: templateName,
            description: templateDescription,
            duration_months: durationMonths,
          })
          .eq('id', templateId);

        if (error) throw error;
        return { id: templateId };
      } else {
        // Create new
        const { data, error } = await supabase
          .from('timeline_templates')
          .insert({
            name: templateName,
            description: templateDescription,
            duration_months: durationMonths,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      toast.success(templateId ? 'Template atualizado!' : 'Template criado!');
      queryClient.invalidateQueries({ queryKey: ['timeline-templates'] });
      
      if (!templateId) {
        navigate(`/admin/templates/flow/${data.id}`);
      }
      setShowSettings(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar template: ' + error.message);
    },
  });

  if (isLoading && templateId) {
    return <LoadingSpinner />;
  }

  // For new templates, show settings dialog first
  if (!templateId && !templateName) {
    return (
      <AppLayout showAdminNav>
        <SEOHelmet 
          title="Novo Template - Editor de Fluxo" 
          description="Crie um novo template de cronograma com editor visual"
        />
        
        <div className="max-w-2xl mx-auto mt-20">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Novo Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Onboarding Completo"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o propósito deste template..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (meses)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="36"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => navigate('/admin/templates')}>
                  Cancelar
                </Button>
                <Button onClick={() => saveTemplateMutation.mutate()} disabled={!templateName || saveTemplateMutation.isPending}>
                  {saveTemplateMutation.isPending ? 'Criando...' : 'Criar Template'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const startDate = new Date();
  const endDate = addMonths(startDate, durationMonths);

  return (
    <AppLayout showAdminNav>
      <SEOHelmet 
        title={`${templateId ? 'Editar' : 'Novo'} Template - Editor de Fluxo`}
        description="Editor visual de fluxo para templates de cronograma"
      />

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-primary/20">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/templates')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h2 className="font-bold text-lg text-primary">{templateName || 'Novo Template'}</h2>
              <p className="text-xs text-muted-foreground">{templateDescription}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurações do Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome do Template</Label>
                    <Input
                      id="edit-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea
                      id="edit-description"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-duration">Duração (meses)</Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      min="1"
                      max="36"
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowSettings(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => saveTemplateMutation.mutate()} disabled={saveTemplateMutation.isPending}>
                      {saveTemplateMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" onClick={() => saveTemplateMutation.mutate()} disabled={saveTemplateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {/* Flow Editor */}
      <div className="pt-20">
        {templateId ? (
          <TimelineFlowBuilderWrapper
            clientTimelineId={templateId}
            startDate={startDate}
            endDate={endDate}
            isAdmin={true}
          />
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
