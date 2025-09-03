-- Corrigir linter: definir search_path na função de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Seeds iniciais: Templates e alguns itens base
-- Template 1: Sistema Escalável (12 Meses) - cabeçalho
WITH template1 AS (
  INSERT INTO timeline_templates (id, name, description, duration_months)
  VALUES ('a1b2c3d4-e5f6-7788-9900-aabbccddeeff', 'Cronograma de Execução Padrão - Sistema Escalável', 'Programa completo de 12 meses para estruturar e escalar operações.', 12)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
),
-- FASE 1
fase1 AS (
  INSERT INTO timeline_template_items (template_id, category, title, display_order)
  SELECT id, 'FASE', 'FASE 1: Adaptação, Diagnóstico e Ação Imediata (Meses 1-2)', 1 FROM template1
  RETURNING id, template_id
),
-- MÊS 1
mes1 AS (
  INSERT INTO timeline_template_items (template_id, parent_id, category, title, display_order)
  SELECT template_id, id, 'MES', 'Mês 1: Imersão, Planejamento e Geração de Leads', 1 FROM fase1
  RETURNING id, template_id
),
-- MÊS 2
mes2 AS (
  INSERT INTO timeline_template_items (template_id, parent_id, category, title, display_order)
  SELECT template_id, (SELECT id FROM fase1), 'MES', 'Mês 2: Execução e Validação Rápida', 2 FROM fase1
  RETURNING id, template_id
)
INSERT INTO timeline_template_items (template_id, parent_id, category, title, description, display_order)
SELECT template_id, id, 'FOCO', 'Foco Principal', 'Conduzir diagnóstico profundo e lançar base digital (paga e orgânica).', 1 FROM mes1
ON CONFLICT DO NOTHING;

INSERT INTO timeline_template_items (template_id, parent_id, category, title, description, display_order)
SELECT template_id, id, 'ENTREGAVEL', 'Diagnóstico 360° e Planejamento Estratégico', 'Documento + roadmap priorizado.', 2 FROM mes1
ON CONFLICT DO NOTHING;

INSERT INTO timeline_template_items (template_id, parent_id, category, title, description, display_order)
SELECT template_id, id, 'FOCO', 'Foco Principal', 'Acelerar execução das campanhas e validar hipóteses do funil.', 1 FROM mes2
ON CONFLICT DO NOTHING;

-- Template 2: Programa de Alavancagem (12 Meses)
WITH template2 AS (
  INSERT INTO timeline_templates (id, name, description, duration_months)
  VALUES ('f1e2d3c4-b5a6-7788-9900-ffeeddccbbaa', 'Cronograma de Execução - Programa de Alavancagem', 'Foco em velocidade e eficiência para resultados financeiros de curto prazo.', 12)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
),
fase1_t2 AS (
  INSERT INTO timeline_template_items (template_id, category, title, display_order)
  SELECT id, 'FASE', 'FASE 1: Ignição Rápida (Meses 1-3)', 1 FROM template2
  RETURNING id, template_id
),
mes1_t2 AS (
  INSERT INTO timeline_template_items (template_id, parent_id, category, title, display_order)
  SELECT template_id, id, 'MES', 'Mês 1: Estruturação e Lançamento Acelerado', 1 FROM fase1_t2
  RETURNING id, template_id
)
INSERT INTO timeline_template_items (template_id, parent_id, category, title, description, display_order)
SELECT template_id, id, 'FOCO', 'Foco Principal', 'Diagnóstico rápido e ativação da captação de leads imediatamente.', 1 FROM mes1_t2
ON CONFLICT DO NOTHING;

INSERT INTO timeline_template_items (template_id, parent_id, category, title, description, display_order)
SELECT template_id, id, 'ENTREGAVEL', 'Stack mínimo viável de aquisição', 'Landing page, pixel, formulários e CRM conectados.', 2 FROM mes1_t2
ON CONFLICT DO NOTHING;