import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Node } from '@xyflow/react';
import NodeEditTab from './NodeEditTab';
import NodeCommentsTab from './NodeCommentsTab';
import NodeDocumentsTab from './NodeDocumentsTab';
import NodeLinksTab from './NodeLinksTab';
import NodeKanbanTab from './NodeKanbanTab';

interface NodeModalProps {
  node: Node;
  clientTimelineId?: string;
  templateId?: string;
  isTemplateMode: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function NodeModal({
  node,
  clientTimelineId,
  templateId,
  isTemplateMode,
  isAdmin,
  onClose,
  onUpdate,
}: NodeModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const nodeType = String(node.data.node_type || 'custom');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {String(node.data.title || 'Nó')}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="comments">Comentários</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            {nodeType === 'kanban' && (
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details">
            <NodeEditTab
              node={node}
              isTemplateMode={isTemplateMode}
              isAdmin={isAdmin}
              onUpdate={onUpdate}
            />
          </TabsContent>

          <TabsContent value="comments">
            <NodeCommentsTab
              nodeId={node.id}
              isAdmin={isAdmin}
              onUpdate={onUpdate}
            />
          </TabsContent>

          <TabsContent value="documents">
            <NodeDocumentsTab
              nodeId={node.id}
              isAdmin={isAdmin}
              onUpdate={onUpdate}
            />
          </TabsContent>

          <TabsContent value="links">
            <NodeLinksTab
              nodeId={node.id}
              isAdmin={isAdmin}
              onUpdate={onUpdate}
            />
          </TabsContent>

          {nodeType === 'kanban' && (
            <TabsContent value="kanban">
              <NodeKanbanTab
                nodeId={node.id}
                isAdmin={isAdmin}
                onUpdate={onUpdate}
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
