-- Criar Tipos ENUM
CREATE TYPE user_role AS ENUM ('ADMIN', 'CLIENTE');
CREATE TYPE timeline_item_status AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO');
CREATE TYPE timeline_progress_status AS ENUM ('NO_PRAZO', 'ADIANTADO', 'ATRASADO');
CREATE TYPE template_item_category AS ENUM ('FASE', 'MES', 'FOCO', 'ENTREGAVEL', 'SESSAO', 'CONSULTORIA', 'TREINAMENTO');

-- Tabela de Perfis (Usuários)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  company_logo_url TEXT,
  role user_role NOT NULL DEFAULT 'CLIENTE',
  points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Modelos de Cronograma
CREATE TABLE timeline_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_months INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Itens dos Modelos de Cronograma
CREATE TABLE timeline_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES timeline_templates(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES timeline_template_items(id) ON DELETE CASCADE,
    category template_item_category NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    display_order INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Cronogramas dos Clientes (Instâncias)
CREATE TABLE client_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES timeline_templates(id),
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Itens dos Cronogramas dos Clientes
CREATE TABLE timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_timeline_id UUID NOT NULL REFERENCES client_timelines(id) ON DELETE CASCADE,
  template_item_id UUID REFERENCES timeline_template_items(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status timeline_item_status NOT NULL DEFAULT 'PENDENTE',
  progress_status timeline_progress_status,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Documentos
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  timeline_item_id UUID REFERENCES timeline_items(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Indicações
CREATE TABLE indications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  indicated_name VARCHAR(255) NOT NULL,
  indicated_email VARCHAR(255),
  indicated_phone VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
  points_awarded INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE indications ENABLE ROW LEVEL SECURITY;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Políticas RLS para profiles
CREATE POLICY "Admins podem gerenciar todos os perfis" ON profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Usuários podem ver e atualizar seus próprios perfis" ON profiles FOR ALL USING (auth.uid() = id);

-- Políticas RLS para timeline_templates
CREATE POLICY "Admins podem gerenciar templates" ON timeline_templates FOR ALL USING (public.is_admin());
CREATE POLICY "Usuários autenticados podem ler templates" ON timeline_templates FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas RLS para timeline_template_items
CREATE POLICY "Admins podem gerenciar itens de template" ON timeline_template_items FOR ALL USING (public.is_admin());
CREATE POLICY "Usuários autenticados podem ler itens de templates" ON timeline_template_items FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas RLS para client_timelines
CREATE POLICY "Admins podem gerenciar cronogramas de clientes" ON client_timelines FOR ALL USING (public.is_admin());
CREATE POLICY "Clientes podem ver seus próprios cronogramas" ON client_timelines FOR SELECT USING (auth.uid() = client_id);

-- Políticas RLS para timeline_items
CREATE POLICY "Admins podem gerenciar todos os itens" ON timeline_items FOR ALL USING (public.is_admin());
CREATE POLICY "Clientes podem ver os itens de seus cronogramas" ON timeline_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM client_timelines 
    WHERE id = client_timeline_id AND client_id = auth.uid()
  )
);

-- Políticas RLS para documents
CREATE POLICY "Admins podem gerenciar todos os documentos" ON documents FOR ALL USING (public.is_admin());
CREATE POLICY "Clientes podem ver seus próprios documentos" ON documents FOR ALL USING (auth.uid() = client_id);

-- Políticas RLS para indications
CREATE POLICY "Admins podem gerenciar todas as indicações" ON indications FOR ALL USING (public.is_admin());
CREATE POLICY "Clientes podem ver suas próprias indicações" ON indications FOR ALL USING (auth.uid() = client_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timeline_templates_updated_at BEFORE UPDATE ON timeline_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timeline_template_items_updated_at BEFORE UPDATE ON timeline_template_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_timelines_updated_at BEFORE UPDATE ON client_timelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timeline_items_updated_at BEFORE UPDATE ON timeline_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'CLIENTE')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();