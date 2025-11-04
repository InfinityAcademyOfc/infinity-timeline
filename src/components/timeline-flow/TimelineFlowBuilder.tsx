import { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Save, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Import custom node types
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
  clientTimelineId: string;
  startDate: Date;
  endDate: Date;
  isAdmin: boolean;
}

export default function TimelineFlowBuilder({
  clientTimelineId,
  startDate,
  endDate,
  isAdmin,
}: TimelineFlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const queryClient = useQueryClient();
  const flowRef = useRef<HTMLDivElement>(null);

  // Calculate timeline dates for display
  const totalDays = differenceInDays(endDate, startDate);
  const timelineDates = Array.from({ length: Math.ceil(totalDays / 30) + 1 }, (_, i) => {
    return addDays(startDate, i * 30);
  });

  // Fetch nodes
  const { data: nodesData } = useQuery({
    queryKey: ['timeline-nodes', clientTimelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_nodes')
        .select('*')
        .eq('client_timeline_id', clientTimelineId)
        .order('position_x');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch edges
  const { data: edgesData } = useQuery({
    queryKey: ['timeline-edges', clientTimelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_edges')
        .select('*')
        .eq('client_timeline_id', clientTimelineId);
      
      if (error) throw error;
      return data;
    },
  });

  // Convert database data to React Flow format
  useEffect(() => {
    if (nodesData) {
      const flowNodes = nodesData.map((node) => ({
        id: node.id,
        type: node.node_type,
        position: { x: node.position_x, y: node.position_y },
        data: {
          ...node,
          onEdit: () => handleNodeClick(node as any),
        },
        style: {
          width: node.width,
          height: node.height,
        },
      }));
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
      const { error } = await supabase
        .from('timeline_nodes')
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
      const { error } = await supabase
        .from('timeline_edges')
        .insert({
          client_timeline_id: clientTimelineId,
          source_node_id: params.source,
          target_node_id: params.target,
          color: '#00f5ff',
          animated: true,
        });

      if (error) {
        toast.error('Erro ao criar conexão');
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['timeline-edges', clientTimelineId] });
      toast.success('Conexão criada');
    },
    [clientTimelineId, queryClient]
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

  // Calculate date position on timeline
  const getDatePosition = (date: Date) => {
    const daysSinceStart = differenceInDays(date, startDate);
    return (daysSinceStart / totalDays) * 100;
  };

  return (
    <div className="relative h-screen w-full" ref={flowRef}>
      {/* Timeline dates header */}
      <div className="absolute top-0 left-0 right-0 z-10 h-16 bg-gradient-to-b from-background to-transparent pointer-events-none">
        <div className="flex items-center justify-between px-4 h-full">
          {timelineDates.map((date, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-xs text-primary font-medium pointer-events-auto"
              style={{ left: `${getDatePosition(date)}%` }}
            >
              <Calendar className="h-4 w-4 mb-1 text-primary" />
              <span className="whitespace-nowrap">
                {format(date, 'MMM yyyy', { locale: ptBR })}
              </span>
            </div>
          ))}
        </div>
      </div>

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
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(0, 245, 255, 0.2)"
          className="bg-background"
        />
        <Controls className="bg-background/80 backdrop-blur-sm border border-primary/20" />
        <MiniMap
          className="bg-background/80 backdrop-blur-sm border border-primary/20"
          nodeColor={(node) => {
            const nodeData = node.data as any;
            return nodeData.color || '#00f5ff';
          }}
        />
        
        {isAdmin && (
          <Panel position="top-right" className="m-4">
            <Button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="bg-primary/20 hover:bg-primary/30 border-primary text-primary shadow-glow"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nó
            </Button>
          </Panel>
        )}
      </ReactFlow>

      {showAddMenu && isAdmin && (
        <NodeAddMenu
          position={menuPosition}
          clientTimelineId={clientTimelineId}
          onClose={() => setShowAddMenu(false)}
          onNodeAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['timeline-nodes', clientTimelineId] });
            setShowAddMenu(false);
          }}
        />
      )}

      {selectedNode && (
        <NodeModal
          node={selectedNode}
          clientTimelineId={clientTimelineId}
          isAdmin={isAdmin}
          onClose={closeModal}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['timeline-nodes', clientTimelineId] });
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
