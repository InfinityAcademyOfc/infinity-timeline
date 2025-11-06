import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  ReactFlow, 
  useNodesState, 
  useEdgesState, 
  Connection,
  Node,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { differenceInDays, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolsSidebar } from './ToolsSidebar';
import { DraggableTimeline } from './DraggableTimeline';
import { cn } from '@/lib/utils';

// Import node types
import ServiceNode from './nodes/ServiceNode';
import ProductNode from './nodes/ProductNode';
import DeliverableNode from './nodes/DeliverableNode';
import LinkNode from './nodes/LinkNode';
import DocumentNode from './nodes/DocumentNode';
import MediaNode from './nodes/MediaNode';
import YouTubeNode from './nodes/YouTubeNode';
import KanbanNode from './nodes/KanbanNode';
import MilestoneNode from './nodes/MilestoneNode';
import CustomNode from './nodes/CustomNode';
import NodeAddMenu from './NodeAddMenu';
import NodeModal from './modals/NodeModal';

// Define node types
const nodeTypes = {
  service: ServiceNode,
  product: ProductNode,
  deliverable: DeliverableNode,
  link: LinkNode,
  document: DocumentNode,
  media: MediaNode,
  youtube: YouTubeNode,
  kanban: KanbanNode,
  milestone: MilestoneNode,
  custom: CustomNode,
};

interface TimelineFlowBuilderProps {
  clientTimelineId?: string;
  templateId?: string;
  startDate: Date;
  endDate: Date;
  isAdmin: boolean;
}

export default function TimelineFlowBuilder({
  clientTimelineId,
  templateId,
  startDate,
  endDate,
  isAdmin,
}: TimelineFlowBuilderProps) {
  const isTemplateMode = !!templateId;
  const timelineId = isTemplateMode ? templateId : clientTimelineId;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [datePositions, setDatePositions] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const flowRef = useRef<HTMLDivElement>(null);

  // Calculate timeline dates for display
  const totalDays = differenceInDays(endDate, startDate);
  const timelineDates = Array.from({ length: Math.ceil(totalDays / 30) + 1 }, (_, i) => {
    return addDays(startDate, i * 30);
  });

  // Fetch nodes
  const { data: nodesData } = useQuery({
    queryKey: isTemplateMode ? ['timeline-template-nodes', templateId] : ['timeline-nodes', clientTimelineId],
    queryFn: async () => {
      const tableName = isTemplateMode ? 'timeline_template_nodes' : 'timeline_nodes';
      const idColumn = isTemplateMode ? 'template_id' : 'client_timeline_id';
      
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq(idColumn, timelineId)
        .order('position_x');
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!timelineId,
  });

  // Fetch edges
  const { data: edgesData } = useQuery({
    queryKey: isTemplateMode ? ['timeline-template-edges', templateId] : ['timeline-edges', clientTimelineId],
    queryFn: async () => {
      const tableName = isTemplateMode ? 'timeline_template_edges' : 'timeline_edges';
      const idColumn = isTemplateMode ? 'template_id' : 'client_timeline_id';
      
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq(idColumn, timelineId);
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!timelineId,
  });

  // Convert database data to React Flow format
  useEffect(() => {
    if (nodesData) {
      const flowNodes = nodesData.map((node) => {
        const flowNode: Node = {
          id: node.id,
          type: node.node_type,
          position: { x: node.position_x, y: node.position_y },
          data: {
            ...node,
          },
          style: {
            width: node.width,
            height: node.height,
          },
        };
        
        // Add onEdit callback that passes the complete flow node
        flowNode.data.onEdit = () => handleNodeClick(flowNode);
        
        return flowNode;
      });
      setNodes(flowNodes);
    }
  }, [nodesData]);

  useEffect(() => {
    if (edgesData) {
      const flowEdges = edgesData.map((edge) => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        label: edge.label,
        animated: edge.animated,
        style: {
          stroke: edge.color,
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed' as const,
          color: edge.color,
        },
      }));
      setEdges(flowEdges);
    }
  }, [edgesData]);

  // Save node position
  const saveNodePosition = useMutation({
    mutationFn: async ({ id, position }: { id: string; position: { x: number; y: number } }) => {
      const tableName = isTemplateMode ? 'timeline_template_nodes' : 'timeline_nodes';
      
      const { error } = await supabase
        .from(tableName as any)
        .update({ position_x: position.x, position_y: position.y })
        .eq('id', id);
      
      if (error) throw error;
    },
  });

  // Handle node drag end
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      saveNodePosition.mutate({ id: node.id, position: node.position });
    },
    [saveNodePosition]
  );

  // Handle connection
  const onConnect = useCallback(
    async (params: Connection) => {
      const tableName = isTemplateMode ? 'timeline_template_edges' : 'timeline_edges';
      const idColumn = isTemplateMode ? 'template_id' : 'client_timeline_id';
      
      const insertData: any = {
        [idColumn]: timelineId,
        source_node_id: params.source,
        target_node_id: params.target,
        color: '#00f5ff',
        animated: true,
      };

      const { error } = await supabase
        .from(tableName as any)
        .insert([insertData]);

      if (error) {
        toast.error('Erro ao criar conexão');
        return;
      }

      queryClient.invalidateQueries({ 
        queryKey: isTemplateMode ? ['timeline-template-edges', templateId] : ['timeline-edges', clientTimelineId] 
      });
      toast.success('Conexão criada');
    },
    [isTemplateMode, timelineId, templateId, clientTimelineId, queryClient]
  );

  // Handle pane context menu (right-click to add node)
  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      if (!isAdmin) return;
      
      event.preventDefault();
      const bounds = flowRef.current?.getBoundingClientRect();
      if (!bounds) return;

      setMenuPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      setShowAddMenu(true);
    },
    [isAdmin]
  );

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
  };

  const closeModal = () => {
    setSelectedNode(null);
  };

  // Handle date positions change
  const handleDatePositionsChange = (positions: number[]) => {
    setDatePositions(positions);
  };

  // Tool handlers
  const handleAddText = () => {
    toast.info('Funcionalidade em desenvolvimento');
  };

  const handleAddNote = () => {
    toast.info('Funcionalidade em desenvolvimento');
  };

  const handleAddGroup = () => {
    toast.info('Funcionalidade em desenvolvimento');
  };

  const handleAddBoard = () => {
    toast.info('Funcionalidade em desenvolvimento');
  };

  return (
    <div className="relative h-screen w-full" ref={flowRef}>
      {/* Tools Sidebar */}
      {isAdmin && (
        <ToolsSidebar
          onAddNode={() => setShowAddMenu(true)}
          onAddText={handleAddText}
          onAddNote={handleAddNote}
          onAddGroup={handleAddGroup}
          onAddBoard={handleAddBoard}
          collapsed={sidebarCollapsed}
        />
      )}

      {/* Draggable Timeline */}
      <DraggableTimeline 
        dates={timelineDates} 
        onDatePositionsChange={handleDatePositionsChange}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onPaneContextMenu={onPaneContextMenu}
        nodeTypes={nodeTypes}
        fitView
        className="timeline-flow-neon"
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        translateExtent={[[-Infinity, -Infinity], [Infinity, Infinity]]}
        nodeExtent={[[-Infinity, -Infinity], [Infinity, Infinity]]}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(0, 245, 255, 0.15)"
          className="bg-background"
        />
        <Controls 
          className="bg-card/80 backdrop-blur-sm border border-primary/20 text-foreground"
        />
        <MiniMap
          className="!bg-card/80 !border !border-primary/20"
          nodeColor={(node) => {
            const nodeData = node.data as any;
            return nodeData.color || '#00f5ff';
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>

      {showAddMenu && isAdmin && (
        <NodeAddMenu
          position={menuPosition}
          clientTimelineId={clientTimelineId}
          templateId={templateId}
          isTemplateMode={isTemplateMode}
          onClose={() => setShowAddMenu(false)}
          onNodeAdded={() => {
            queryClient.invalidateQueries({ 
              queryKey: isTemplateMode ? ['timeline-template-nodes', templateId] : ['timeline-nodes', clientTimelineId] 
            });
            setShowAddMenu(false);
          }}
        />
      )}

      {selectedNode && (
        <NodeModal
          node={selectedNode}
          clientTimelineId={clientTimelineId}
          templateId={templateId}
          isTemplateMode={isTemplateMode}
          isAdmin={isAdmin}
          onClose={closeModal}
          onUpdate={() => {
            queryClient.invalidateQueries({ 
              queryKey: isTemplateMode ? ['timeline-template-nodes', templateId] : ['timeline-nodes', clientTimelineId] 
            });
            closeModal();
          }}
        />
      )}
    </div>
  );
}

export function TimelineFlowBuilderWrapper(props: TimelineFlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <TimelineFlowBuilder {...props} />
    </ReactFlowProvider>
  );
}
