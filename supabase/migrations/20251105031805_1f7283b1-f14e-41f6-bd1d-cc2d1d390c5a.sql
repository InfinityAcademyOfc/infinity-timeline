-- Create tables for template nodes and edges (separate from client timelines)
CREATE TABLE IF NOT EXISTS public.timeline_template_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.timeline_templates(id) ON DELETE CASCADE,
  node_type node_type NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  description TEXT,
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  width DOUBLE PRECISION DEFAULT 200,
  height DOUBLE PRECISION DEFAULT 100,
  color VARCHAR DEFAULT '#00f5ff',
  glow_color VARCHAR DEFAULT '#00f5ff',
  node_shape node_shape NOT NULL DEFAULT 'rounded',
  icon TEXT,
  metadata JSONB DEFAULT '{}',
  is_locked BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.timeline_template_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.timeline_templates(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.timeline_template_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.timeline_template_nodes(id) ON DELETE CASCADE,
  label TEXT,
  style VARCHAR DEFAULT 'default',
  color VARCHAR DEFAULT '#00f5ff',
  animated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timeline_template_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_template_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template nodes
CREATE POLICY "Admins podem gerenciar todos os nós de template"
  ON public.timeline_template_nodes
  FOR ALL
  USING (is_admin());

CREATE POLICY "Usuários autenticados podem ver nós de template"
  ON public.timeline_template_nodes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS Policies for template edges
CREATE POLICY "Admins podem gerenciar todas as conexões de template"
  ON public.timeline_template_edges
  FOR ALL
  USING (is_admin());

CREATE POLICY "Usuários autenticados podem ver conexões de template"
  ON public.timeline_template_edges
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_timeline_template_nodes_template_id ON public.timeline_template_nodes(template_id);
CREATE INDEX idx_timeline_template_edges_template_id ON public.timeline_template_edges(template_id);
CREATE INDEX idx_timeline_template_edges_source ON public.timeline_template_edges(source_node_id);
CREATE INDEX idx_timeline_template_edges_target ON public.timeline_template_edges(target_node_id);

-- Triggers for updated_at
CREATE TRIGGER update_timeline_template_nodes_updated_at
  BEFORE UPDATE ON public.timeline_template_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timeline_template_edges_updated_at
  BEFORE UPDATE ON public.timeline_template_edges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();