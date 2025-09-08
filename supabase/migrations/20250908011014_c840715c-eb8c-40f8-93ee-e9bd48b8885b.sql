-- Tabela para histórico de pontos (para extrato)
CREATE TABLE point_history (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_change INT NOT NULL, -- pode ser positivo ou negativo
  reason TEXT NOT NULL, -- ex: "Tarefa Concluída", "Indicação Aprovada"
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins podem ver todo o histórico" ON point_history FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN' );
CREATE POLICY "Clientes podem ver seu próprio histórico" ON point_history FOR SELECT USING (auth.uid() = client_id);

-- Tabela de Notificações
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Para quem é a notificação
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link_to TEXT, -- ex: /timeline/item-id-123
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem gerenciar suas próprias notificações" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Adicionar preferências de notificação na tabela de perfis
ALTER TABLE profiles
ADD COLUMN notify_on_comment BOOLEAN DEFAULT TRUE,
ADD COLUMN notify_on_progress BOOLEAN DEFAULT TRUE;

-- Funções para criar notificações automaticamente
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    client_user_id UUID;
    admin_user_id UUID;
    timeline_title TEXT;
BEGIN
    -- Buscar o client_id do cronograma
    SELECT ct.client_id, ti.title INTO client_user_id, timeline_title
    FROM timeline_items ti
    JOIN client_timelines ct ON ti.client_timeline_id = ct.id
    WHERE ti.id = NEW.timeline_item_id;
    
    -- Se o comentário foi feito por um admin, notificar o cliente
    IF (SELECT role FROM profiles WHERE id = NEW.author_id) = 'ADMIN' THEN
        INSERT INTO notifications (user_id, message, link_to)
        VALUES (
            client_user_id, 
            'Novo comentário na tarefa: ' || timeline_title,
            '/timeline'
        );
    ELSE
        -- Se o comentário foi feito pelo cliente, notificar todos os admins
        INSERT INTO notifications (user_id, message, link_to)
        SELECT id, 'Novo comentário do cliente na tarefa: ' || timeline_title, '/admin/clients/' || client_user_id
        FROM profiles 
        WHERE role = 'ADMIN';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_notification_trigger
AFTER INSERT ON timeline_comments
FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- Função para notificações de progresso
CREATE OR REPLACE FUNCTION create_progress_notification()
RETURNS TRIGGER AS $$
DECLARE
    client_user_id UUID;
BEGIN
    -- Buscar o client_id do cronograma
    SELECT ct.client_id INTO client_user_id
    FROM client_timelines ct
    WHERE ct.id = NEW.client_timeline_id;
    
    -- Notificar o cliente sobre mudança de status
    IF OLD.progress_status IS DISTINCT FROM NEW.progress_status AND NEW.progress_status IS NOT NULL THEN
        INSERT INTO notifications (user_id, message, link_to)
        VALUES (
            client_user_id,
            'Status atualizado para "' || NEW.progress_status || '" na tarefa: ' || NEW.title,
            '/timeline'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER progress_notification_trigger
AFTER UPDATE ON timeline_items
FOR EACH ROW EXECUTE FUNCTION create_progress_notification();

-- Função para notificações de indicações
CREATE OR REPLACE FUNCTION create_indication_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar todos os admins sobre nova indicação
    INSERT INTO notifications (user_id, message, link_to)
    SELECT id, 'Nova indicação recebida: ' || NEW.indicated_name, '/admin/clients/' || NEW.client_id
    FROM profiles 
    WHERE role = 'ADMIN';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER indication_notification_trigger
AFTER INSERT ON indications
FOR EACH ROW EXECUTE FUNCTION create_indication_notification();

-- Função para notificações de solicitações
CREATE OR REPLACE FUNCTION create_request_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar todos os admins sobre nova solicitação
    INSERT INTO notifications (user_id, message, link_to)
    SELECT id, 'Nova solicitação: ' || NEW.title, '/admin/clients/' || NEW.client_id
    FROM profiles 
    WHERE role = 'ADMIN';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER request_notification_trigger
AFTER INSERT ON client_requests
FOR EACH ROW EXECUTE FUNCTION create_request_notification();

-- Função para notificações de documentos
CREATE OR REPLACE FUNCTION create_document_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar cliente sobre novo documento
    INSERT INTO notifications (user_id, message, link_to)
    VALUES (
        NEW.client_id,
        'Novo documento disponível: ' || NEW.title,
        '/documents'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_notification_trigger
AFTER INSERT ON documents
FOR EACH ROW EXECUTE FUNCTION create_document_notification();