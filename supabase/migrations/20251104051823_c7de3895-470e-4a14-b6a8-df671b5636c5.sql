-- Criar tipos ENUM para os nós
CREATE TYPE node_type AS ENUM (
  'service',
  'product',
  'deliverable',
  'link',
  'document',
  'media',
  'youtube',
  'kanban',
  'milestone',
  'custom'
);

CREATE TYPE node_shape AS ENUM (
  'rectangle',
  'circle',
  'diamond',
  'hexagon',
  'rounded',
  'custom'
);

-- Tabela principal de nós do fluxo
CREATE TABLE IF NOT EXISTS public.timeline_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_timeline_id UUID NOT NULL REFERENCES public.client_timelines(id) ON DELETE CASCADE,
  node_type node_type NOT NULL DEFAULT 'custom',
  node_shape node_shape NOT NULL DEFAULT 'rounded',
  title TEXT NOT NULL,
  description TEXT,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  width FLOAT DEFAULT 200,
  height FLOAT DEFAULT 100,
  color VARCHAR(50) DEFAULT '#00f5ff',
  glow_color VARCHAR(50) DEFAULT '#00f5ff',
  icon TEXT,
  metadata JSONB DEFAULT '{}',
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de conexões entre nós
CREATE TABLE IF NOT EXISTS public.timeline_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_timeline_id UUID NOT NULL REFERENCES public.client_timelines(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.timeline_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.timeline_nodes(id) ON DELETE CASCADE,
  label TEXT,
  color VARCHAR(50) DEFAULT '#00f5ff',
  style VARCHAR(20) DEFAULT 'default',
  animated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários em nós (admin e cliente)
CREATE TABLE IF NOT EXISTS public.timeline_node_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES public.timeline_nodes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  position VARCHAR(10) DEFAULT 'top',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documentos anexados a nós (somente admin)
CREATE TABLE IF NOT EXISTS public.timeline_node_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES public.timeline_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links anexados a nós (somente admin)
CREATE TABLE IF NOT EXISTS public.timeline_node_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES public.timeline_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quadros Kanban dentro de nós
CREATE TABLE IF NOT EXISTS public.timeline_node_kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES public.timeline_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'A Fazer',
  position INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(50) DEFAULT '#00f5ff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cards dentro dos quadros Kanban
CREATE TABLE IF NOT EXISTS public.timeline_node_kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.timeline_node_kanban_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  checklist JSONB DEFAULT '[]',
  links TEXT[] DEFAULT ARRAY[]::TEXT[],
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  position INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies para timeline_nodes
ALTER TABLE public.timeline_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar todos os nós"
ON public.timeline_nodes FOR ALL
USING (public.is_admin());

CREATE POLICY "Clientes podem visualizar seus nós"
ON public.timeline_nodes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.client_timelines ct
    WHERE ct.id = client_timeline_id
    AND ct.client_id = auth.uid()
  )
);

-- RLS Policies para timeline_edges
ALTER TABLE public.timeline_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar todas as conexões"
ON public.timeline_edges FOR ALL
USING (public.is_admin());

CREATE POLICY "Clientes podem visualizar suas conexões"
ON public.timeline_edges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.client_timelines ct
    WHERE ct.id = client_timeline_id
    AND ct.client_id = auth.uid()
  )
);

-- RLS Policies para timeline_node_comments
ALTER TABLE public.timeline_node_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar todos os comentários"
ON public.timeline_node_comments FOR ALL
USING (public.is_admin());

CREATE POLICY "Clientes podem criar e ver comentários em seus nós"
ON public.timeline_node_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.timeline_nodes tn
    JOIN public.client_timelines ct ON tn.client_timeline_id = ct.id
    WHERE tn.id = node_id AND ct.client_id = auth.uid()
  )
);

CREATE POLICY "Clientes podem criar comentários em seus nós"
ON public.timeline_node_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.timeline_nodes tn
    JOIN public.client_timelines ct ON tn.client_timeline_id = ct.id
    WHERE tn.id = node_id AND ct.client_id = auth.uid()
  ) AND author_id = auth.uid()
);

-- RLS Policies para timeline_node_documents
ALTER TABLE public.timeline_node_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar todos os documentos"
ON public.timeline_node_documents FOR ALL
USING (public.is_admin());

CREATE POLICY "Clientes podem visualizar documentos de seus nós"
ON public.timeline_node_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.timeline_nodes tn
    JOIN public.client_timelines ct ON tn.client_timeline_id = ct.id
    WHERE tn.id = node_id AND ct.client_id = auth.uid()
  )
);

-- RLS Policies para timeline_node_links
ALTER TABLE public.timeline_node_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar todos os links"
ON public.timeline_node_links FOR ALL
USING (public.is_admin());

CREATE POLICY "Clientes podem visualizar links de seus nós"
ON public.timeline_node_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.timeline_nodes tn
    JOIN public.client_timelines ct ON tn.client_timeline_id = ct.id
    WHERE tn.id = node_id AND ct.client_id = auth.uid()
  )
);

-- RLS Policies para timeline_node_kanban_boards
ALTER TABLE public.timeline_node_kanban_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar todos os quadros kanban"
ON public.timeline_node_kanban_boards FOR ALL
USING (public.is_admin());

CREATE POLICY "Clientes podem visualizar quadros kanban de seus nós"
ON public.timeline_node_kanban_boards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.timeline_nodes tn
    JOIN public.client_timelines ct ON tn.client_timeline_id = ct.id
    WHERE tn.id = node_id AND ct.client_id = auth.uid()
  )
);

-- RLS Policies para timeline_node_kanban_cards
ALTER TABLE public.timeline_node_kanban_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar todos os cards kanban"
ON public.timeline_node_kanban_cards FOR ALL
USING (public.is_admin());

CREATE POLICY "Clientes podem visualizar cards kanban de seus nós"
ON public.timeline_node_kanban_cards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.timeline_node_kanban_boards kb
    JOIN public.timeline_nodes tn ON kb.node_id = tn.id
    JOIN public.client_timelines ct ON tn.client_timeline_id = ct.id
    WHERE kb.id = board_id AND ct.client_id = auth.uid()
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_timeline_nodes_updated_at
BEFORE UPDATE ON public.timeline_nodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timeline_edges_updated_at
BEFORE UPDATE ON public.timeline_edges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timeline_node_comments_updated_at
BEFORE UPDATE ON public.timeline_node_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timeline_node_kanban_boards_updated_at
BEFORE UPDATE ON public.timeline_node_kanban_boards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timeline_node_kanban_cards_updated_at
BEFORE UPDATE ON public.timeline_node_kanban_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_timeline_nodes_client_timeline ON public.timeline_nodes(client_timeline_id);
CREATE INDEX idx_timeline_nodes_type ON public.timeline_nodes(node_type);
CREATE INDEX idx_timeline_edges_source ON public.timeline_edges(source_node_id);
CREATE INDEX idx_timeline_edges_target ON public.timeline_edges(target_node_id);
CREATE INDEX idx_timeline_node_comments_node ON public.timeline_node_comments(node_id);
CREATE INDEX idx_timeline_node_documents_node ON public.timeline_node_documents(node_id);
CREATE INDEX idx_timeline_node_links_node ON public.timeline_node_links(node_id);
CREATE INDEX idx_timeline_node_kanban_boards_node ON public.timeline_node_kanban_boards(node_id);
CREATE INDEX idx_timeline_node_kanban_cards_board ON public.timeline_node_kanban_cards(board_id);