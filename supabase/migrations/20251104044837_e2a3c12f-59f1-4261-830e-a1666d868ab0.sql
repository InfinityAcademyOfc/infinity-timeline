-- ====================================================================
-- FASE 1: CORREÇÕES CRÍTICAS DE BANCO DE DADOS (CORRIGIDO)
-- ====================================================================

-- PASSO 1: Remover policies que dependem de profiles.role
DROP POLICY IF EXISTS "Admins podem ver todo o histórico" ON public.point_history;

-- PASSO 2: Remover coluna 'role' obsoleta de profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- PASSO 3: Criar função helper is_client
CREATE OR REPLACE FUNCTION public.is_client(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_id_param AND role = 'CLIENTE'::app_role
  );
$$;

-- PASSO 4: Recriar policy de point_history usando is_admin()
CREATE POLICY "Admins podem ver todo o histórico"
ON public.point_history
FOR ALL
TO authenticated
USING (public.is_admin());

-- PASSO 5: Popular templates com itens reais
DO $$
DECLARE
  template1_id uuid;
  template2_id uuid;
  fase_id uuid;
  mes_id uuid;
BEGIN
  -- Buscar IDs dos templates existentes
  SELECT id INTO template1_id FROM timeline_templates WHERE name = 'Cronograma de Execução Padrão' LIMIT 1;
  SELECT id INTO template2_id FROM timeline_templates WHERE name = 'Programa de Alavancagem' LIMIT 1;

  -- Se não existirem templates, criar
  IF template1_id IS NULL THEN
    INSERT INTO timeline_templates (name, duration_months, description)
    VALUES ('Cronograma de Execução Padrão', 12, 'Template padrão de execução para novos clientes')
    RETURNING id INTO template1_id;
  END IF;

  IF template2_id IS NULL THEN
    INSERT INTO timeline_templates (name, duration_months, description)
    VALUES ('Programa de Alavancagem', 12, 'Programa intensivo de alavancagem de resultados')
    RETURNING id INTO template2_id;
  END IF;

  -- Limpar itens existentes dos templates (se houver)
  DELETE FROM timeline_template_items WHERE template_id IN (template1_id, template2_id);

  -- ===== TEMPLATE 1: Cronograma de Execução Padrão =====
  
  -- FASE 1: Setup Inicial
  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template1_id, 'FASE', 'Fase 1: Setup Inicial', 'Configuração e preparação da infraestrutura', 0, NULL)
  RETURNING id INTO fase_id;

  -- Mês 1
  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template1_id, 'MES', 'Mês 1', 'Primeiro mês - Fundamentos', 1, fase_id)
  RETURNING id INTO mes_id;

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES 
    (template1_id, 'ENTREGAVEL', 'Kickoff Meeting', 'Reunião inicial de alinhamento estratégico', 2, mes_id),
    (template1_id, 'ENTREGAVEL', 'Briefing Completo', 'Documento detalhado de requisitos e objetivos', 3, mes_id),
    (template1_id, 'ENTREGAVEL', 'Análise de Mercado', 'Pesquisa de concorrência e público-alvo', 4, mes_id),
    (template1_id, 'ENTREGAVEL', 'Definição de Personas', 'Criação de personas do público-alvo', 5, mes_id);

  -- Mês 2
  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template1_id, 'MES', 'Mês 2', 'Segundo mês - Estruturação', 6, fase_id)
  RETURNING id INTO mes_id;

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES 
    (template1_id, 'ENTREGAVEL', 'Identidade Visual', 'Criação ou refinamento da identidade visual', 7, mes_id),
    (template1_id, 'ENTREGAVEL', 'Setup de Ferramentas', 'Configuração de plataformas e ferramentas', 8, mes_id),
    (template1_id, 'ENTREGAVEL', 'Calendário Editorial', 'Planejamento de conteúdo mensal', 9, mes_id);

  -- Mês 3
  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template1_id, 'MES', 'Mês 3', 'Terceiro mês - Lançamento', 10, fase_id)
  RETURNING id INTO mes_id;

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES 
    (template1_id, 'ENTREGAVEL', 'Website/Landing Page', 'Desenvolvimento e lançamento do site', 11, mes_id),
    (template1_id, 'ENTREGAVEL', 'Campanhas Iniciais', 'Primeiras campanhas de marketing', 12, mes_id),
    (template1_id, 'ENTREGAVEL', 'Relatório Mensal', 'Primeiro relatório de resultados', 13, mes_id);

  -- FASE 2: Estruturação
  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template1_id, 'FASE', 'Fase 2: Estruturação', 'Consolidação de processos e estratégias', 14, NULL)
  RETURNING id INTO fase_id;

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES 
    (template1_id, 'MES', 'Mês 4', 'Quarto mês - Otimização', 15, fase_id),
    (template1_id, 'MES', 'Mês 5', 'Quinto mês - Expansão', 16, fase_id),
    (template1_id, 'MES', 'Mês 6', 'Sexto mês - Consolidação', 17, fase_id);

  -- FASE 3: Otimização
  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template1_id, 'FASE', 'Fase 3: Otimização', 'Refinamento e melhoria contínua', 18, NULL)
  RETURNING id INTO fase_id;

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES 
    (template1_id, 'MES', 'Mês 7', 'Sétimo mês - Performance', 19, fase_id),
    (template1_id, 'MES', 'Mês 8', 'Oitavo mês - Análise', 20, fase_id),
    (template1_id, 'MES', 'Mês 9', 'Nono mês - Ajustes', 21, fase_id);

  -- FASE 4: Escala
  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template1_id, 'FASE', 'Fase 4: Escala', 'Crescimento e expansão dos resultados', 22, NULL)
  RETURNING id INTO fase_id;

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES 
    (template1_id, 'MES', 'Mês 10', 'Décimo mês - Aceleração', 23, fase_id),
    (template1_id, 'MES', 'Mês 11', 'Décimo primeiro mês - Maximização', 24, fase_id),
    (template1_id, 'MES', 'Mês 12', 'Décimo segundo mês - Encerramento', 25, fase_id);

  -- ===== TEMPLATE 2: Programa de Alavancagem =====
  
  -- FASE 1: Diagnóstico
  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template2_id, 'FASE', 'Fase 1: Diagnóstico', 'Análise profunda e planejamento estratégico', 0, NULL)
  RETURNING id INTO fase_id;

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template2_id, 'MES', 'Mês 1', 'Primeiro mês - Diagnóstico', 1, fase_id)
  RETURNING id INTO mes_id;

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES 
    (template2_id, 'ENTREGAVEL', 'Auditoria Completa', 'Auditoria de marketing e vendas atual', 2, mes_id),
    (template2_id, 'ENTREGAVEL', 'Mapeamento de Processos', 'Documentação de processos existentes', 3, mes_id),
    (template2_id, 'ENTREGAVEL', 'Plano Estratégico', 'Planejamento estratégico de 12 meses', 4, mes_id);

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES 
    (template2_id, 'MES', 'Mês 2', 'Segundo mês - Implementação', 5, fase_id),
    (template2_id, 'MES', 'Mês 3', 'Terceiro mês - Validação', 6, fase_id);

  -- FASE 2: Aceleração
  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template2_id, 'FASE', 'Fase 2: Aceleração', 'Implementação acelerada de estratégias', 7, NULL)
  RETURNING id INTO fase_id;

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES 
    (template2_id, 'MES', 'Mês 4', 'Quarto mês - Automação', 8, fase_id),
    (template2_id, 'MES', 'Mês 5', 'Quinto mês - Otimização', 9, fase_id),
    (template2_id, 'MES', 'Mês 6', 'Sexto mês - Escalabilidade', 10, fase_id);

  -- FASE 3: Maximização
  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template2_id, 'FASE', 'Fase 3: Maximização', 'Maximização de resultados e ROI', 11, NULL)
  RETURNING id INTO fase_id;

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES 
    (template2_id, 'MES', 'Mês 7', 'Sétimo mês - Performance Máxima', 12, fase_id),
    (template2_id, 'MES', 'Mês 8', 'Oitavo mês - ROI Focus', 13, fase_id),
    (template2_id, 'MES', 'Mês 9', 'Nono mês - Sustentabilidade', 14, fase_id);

  -- FASE 4: Consolidação
  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES (template2_id, 'FASE', 'Fase 4: Consolidação', 'Consolidação e planejamento futuro', 15, NULL)
  RETURNING id INTO fase_id;

  INSERT INTO timeline_template_items (template_id, category, title, description, display_order, parent_id)
  VALUES 
    (template2_id, 'MES', 'Mês 10', 'Décimo mês - Estabilização', 16, fase_id),
    (template2_id, 'MES', 'Mês 11', 'Décimo primeiro mês - Handoff', 17, fase_id),
    (template2_id, 'MES', 'Mês 12', 'Décimo segundo mês - Fechamento', 18, fase_id);

  RAISE NOTICE 'Templates populados com sucesso!';
  RAISE NOTICE 'Template 1: % itens criados', (SELECT COUNT(*) FROM timeline_template_items WHERE template_id = template1_id);
  RAISE NOTICE 'Template 2: % itens criados', (SELECT COUNT(*) FROM timeline_template_items WHERE template_id = template2_id);
END $$;

-- PASSO 6: Configurar Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public-assets', 'public-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS policies para public-assets
CREATE POLICY "Public assets are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-assets');

CREATE POLICY "Admins can upload public assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets' AND public.is_admin());

CREATE POLICY "Admins can update public assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets' AND public.is_admin());

CREATE POLICY "Admins can delete public assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets' AND public.is_admin());

-- RLS policies para documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND 
  (public.is_admin() OR auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND public.is_admin());

CREATE POLICY "Admins can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND public.is_admin());

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND public.is_admin());

-- PASSO 7: Adicionar índices de performance
CREATE INDEX IF NOT EXISTS idx_client_timelines_client_id ON client_timelines(client_id);
CREATE INDEX IF NOT EXISTS idx_timeline_items_client_timeline_id ON timeline_items(client_timeline_id);
CREATE INDEX IF NOT EXISTS idx_timeline_items_status ON timeline_items(status);
CREATE INDEX IF NOT EXISTS idx_timeline_items_progress_status ON timeline_items(progress_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_indications_client_id ON indications(client_id);
CREATE INDEX IF NOT EXISTS idx_indications_status ON indications(status);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_point_history_client_id ON point_history(client_id);
CREATE INDEX IF NOT EXISTS idx_timeline_comments_timeline_item_id ON timeline_comments(timeline_item_id);
CREATE INDEX IF NOT EXISTS idx_timeline_comments_author_id ON timeline_comments(author_id);

-- Comentários
COMMENT ON FUNCTION public.is_client IS 'Verifica se um usuário tem o role de CLIENTE na tabela user_roles';
COMMENT ON INDEX idx_client_timelines_client_id IS 'Performance: Busca rápida de timelines por cliente';
COMMENT ON INDEX idx_notifications_user_unread IS 'Performance: Busca rápida de notificações não lidas por usuário';