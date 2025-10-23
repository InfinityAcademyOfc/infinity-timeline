-- FASE 1: Adicionar campo de mensalidade e configurações do sistema

-- Adicionar campo de mensalidade ao perfil do cliente
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC DEFAULT 0;

-- Criar tabela de configurações globais do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir configurações padrão de pontos
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES 
  ('points_config', '{"indication_percentage": 0.25, "task_on_time": 25, "task_early": 50, "task_late": 0}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- RLS para system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar configurações do sistema"
ON public.system_settings FOR ALL
USING (public.is_admin());

CREATE POLICY "Usuários autenticados podem ler configurações"
ON public.system_settings FOR SELECT
USING (auth.role() = 'authenticated');

-- FASE 5: Adicionar tabela de links e campos extras aos itens

-- Criar tabela de links para itens da timeline
CREATE TABLE IF NOT EXISTS public.timeline_item_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_item_id UUID NOT NULL REFERENCES public.timeline_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.timeline_item_links ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para links
CREATE POLICY "Admins podem gerenciar links dos itens"
ON public.timeline_item_links FOR ALL
USING (public.is_admin());

CREATE POLICY "Clientes podem ver links dos seus itens"
ON public.timeline_item_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM timeline_items ti
    JOIN client_timelines ct ON ti.client_timeline_id = ct.id
    WHERE ti.id = timeline_item_links.timeline_item_id
    AND ct.client_id = auth.uid()
  )
);

-- Adicionar campos de percentagem e horas aos itens
ALTER TABLE public.timeline_items
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC,
ADD COLUMN IF NOT EXISTS actual_hours NUMERIC,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- FASE 7: Adicionar tabela de bônus personalizados

CREATE TABLE IF NOT EXISTS public.client_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  awarded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar bônus"
ON public.client_bonuses FOR ALL
USING (public.is_admin());

CREATE POLICY "Clientes podem ver seus próprios bônus"
ON public.client_bonuses FOR SELECT
USING (auth.uid() = client_id);

-- Trigger para atualizar updated_at em system_settings
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_system_settings_updated_at_trigger
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_system_settings_updated_at();