import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHelmet } from '@/components/SEOHelmet';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, GripVertical, Trash2, Save, Eye, Layers, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: 'FASE' | 'MES' | 'ENTREGAVEL';
  display_order: number;
}

const SortableItem = ({ item, onEdit, onDelete }: { item: TemplateItem; onEdit: (item: TemplateItem) => void; onDelete: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'FASE': return 'bg-primary/20 text-primary border-primary/50';
      case 'MES': return 'bg-secondary/20 text-secondary-foreground border-secondary/50';
      case 'ENTREGAVEL': return 'bg-accent/20 text-accent-foreground border-accent/50';
      default: return 'bg-muted';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
    >
      <Card className={`border-2 transition-all hover:shadow-glow ${isDragging ? 'shadow-glow' : ''}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={getCategoryColor(item.category)}>{item.category}</Badge>
              <h4 className="font-semibold truncate">{item.title}</h4>
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground truncate">{item.description}</p>
            )}
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
              Editar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminTemplates = () => {
  const navigate = useNavigate();
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [durationMonths, setDurationMonths] = useState(12);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [editingItem, setEditingItem] = useState<TemplateItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'FASE' | 'MES' | 'ENTREGAVEL'>('ENTREGAVEL');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: templates } = useQuery({
    queryKey: ['timeline-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: { name: string; description: string; duration_months: number; items: TemplateItem[] }) => {
      // Create template
      const { data: template, error: templateError } = await supabase
        .from('timeline_templates')
        .insert({
          name: templateData.name,
          description: templateData.description,
          duration_months: templateData.duration_months,
        })
        .select()
        .single();
      
      if (templateError) throw templateError;

      // Create template items
      const itemsToInsert = templateData.items.map((item, index) => ({
        template_id: template.id,
        title: item.title,
        description: item.description,
        category: item.category,
        display_order: index,
      }));

      const { error: itemsError } = await supabase
        .from('timeline_template_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;

      return template;
    },
    onSuccess: () => {
      toast({
        title: "Template criado!",
        description: "O template foi salvo com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['timeline-templates'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar template",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addItem = () => {
    if (!newItemTitle) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, adicione um título para o item.",
        variant: "destructive"
      });
      return;
    }

    const newItem: TemplateItem = {
      id: crypto.randomUUID(),
      title: newItemTitle,
      description: newItemDescription,
      category: newItemCategory,
      display_order: items.length,
    };

    if (editingItem) {
      setItems(items.map(item => item.id === editingItem.id ? { ...newItem, id: editingItem.id } : item));
      setEditingItem(null);
    } else {
      setItems([...items, newItem]);
    }

    setNewItemTitle('');
    setNewItemDescription('');
    setNewItemCategory('ENTREGAVEL');
    setIsAddModalOpen(false);
  };

  const editItem = (item: TemplateItem) => {
    setEditingItem(item);
    setNewItemTitle(item.title);
    setNewItemDescription(item.description);
    setNewItemCategory(item.category);
    setIsAddModalOpen(true);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const saveTemplate = () => {
    if (!templateName || items.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome do template e adicione pelo menos um item.",
        variant: "destructive"
      });
      return;
    }

    createTemplateMutation.mutate({
      name: templateName,
      description: templateDescription,
      duration_months: durationMonths,
      items
    });
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setDurationMonths(12);
    setItems([]);
  };

  return (
    <AppLayout showAdminNav>
      <SEOHelmet 
        title="Editor de Templates" 
        description="Crie e gerencie templates de cronograma com editor visual drag-and-drop."
      />
      
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Editor de Templates
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Construa cronogramas visuais com arrastar e soltar
            </p>
          </div>

          <Button size="lg" onClick={() => navigate('/admin/templates/flow/new')} className="bg-gradient-primary hover:bg-primary-hover shadow-glow">
            <Plus className="h-5 w-5 mr-2" />
            Novo Template Visual
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Configurações */}
          <Card className="border-0 shadow-xl bg-gradient-card backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Configurações do Template
              </CardTitle>
              <CardDescription>
                Defina as propriedades básicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template</Label>
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
                  onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                />
              </div>

              <div className="pt-4 border-t space-y-2">
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
                      <DialogDescription>
                        Configure os detalhes do item do cronograma
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={newItemCategory} onValueChange={(v) => setNewItemCategory(v as any)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FASE">FASE</SelectItem>
                            <SelectItem value="MES">MÊS</SelectItem>
                            <SelectItem value="ENTREGAVEL">ENTREGÁVEL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          placeholder="Ex: Configuração Inicial"
                          value={newItemTitle}
                          onChange={(e) => setNewItemTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição (opcional)</Label>
                        <Textarea
                          placeholder="Detalhes sobre este item..."
                          value={newItemDescription}
                          onChange={(e) => setNewItemDescription(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={addItem}>
                          {editingItem ? 'Salvar' : 'Adicionar'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button className="w-full" onClick={saveTemplate} disabled={createTemplateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {createTemplateMutation.isPending ? 'Salvando...' : 'Salvar Template'}
                </Button>

                <Button className="w-full" variant="secondary" onClick={() => setIsPreviewOpen(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Canvas de Construção */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-gradient-card backdrop-blur-sm min-h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Canvas de Construção
                </CardTitle>
                <CardDescription>
                  Arraste os itens para reorganizar a ordem
                </CardDescription>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Layers className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      Nenhum item adicionado
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Clique em "Adicionar Item" para começar a construir seu template
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            onEdit={editItem}
                            onDelete={deleteItem}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Templates Existentes */}
        <Card className="border-0 shadow-xl bg-gradient-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Templates Salvos</CardTitle>
            <CardDescription>
              Seus templates criados anteriormente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates?.map((template) => (
                <Card 
                  key={template.id} 
                  className="hover:shadow-glow transition-all cursor-pointer group"
                  onClick={() => navigate(`/admin/templates/flow/${template.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold group-hover:text-primary transition-colors">{template.name}</h4>
                      <Badge variant="outline">{template.duration_months} meses</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/templates/flow/${template.id}`);
                    }}>
                      Editar no Flow
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {templates?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum template salvo ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Template</DialogTitle>
            <DialogDescription>
              Como o cronograma ficará para os clientes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold">{templateName || 'Sem título'}</h3>
              <p className="text-muted-foreground">{templateDescription}</p>
              <Badge className="mt-2">{durationMonths} meses</Badge>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <Card key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.category === 'FASE' ? 'default' : item.category === 'MES' ? 'secondary' : 'outline'}>
                        {item.category}
                      </Badge>
                      <h4 className="font-semibold">{item.title}</h4>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AdminTemplates;
