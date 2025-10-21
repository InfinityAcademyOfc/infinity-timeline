-- =====================================================
-- FASE 1.1: CORRIGIR SISTEMA DE ROLES (CRÍTICO)
-- =====================================================

-- Criar enum para roles de aplicação
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('ADMIN', 'CLIENTE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Criar tabela de roles separada (segurança)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Criar políticas (drop first para recriar)
DROP POLICY IF EXISTS "Admins podem gerenciar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuários podem ver suas roles" ON public.user_roles;

CREATE POLICY "Admins podem gerenciar roles"
ON public.user_roles
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'ADMIN'::app_role
    )
);

CREATE POLICY "Usuários podem ver suas roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Criar função SECURITY DEFINER para checar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Criar função auxiliar is_admin usando has_role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'ADMIN'::app_role)
$$;

-- Migrar dados existentes da coluna role em profiles (apenas se user_roles estiver vazia)
INSERT INTO user_roles (user_id, role)
SELECT id, 
  CASE 
    WHEN role = 'ADMIN' THEN 'ADMIN'::app_role
    WHEN role = 'CLIENTE' THEN 'CLIENTE'::app_role
    ELSE 'CLIENTE'::app_role
  END
FROM profiles 
WHERE role IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = profiles.id)
ON CONFLICT (user_id, role) DO NOTHING;

-- =====================================================
-- FASE 1.2: CORRIGIR WARNINGS DE SEGURANÇA DO LINTER
-- =====================================================

-- Adicionar SET search_path a todas as functions de notificação

-- 1. create_comment_notification
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    client_user_id UUID;
    timeline_title TEXT;
    is_author_admin BOOLEAN;
BEGIN
    SELECT ct.client_id, ti.title INTO client_user_id, timeline_title
    FROM timeline_items ti
    JOIN client_timelines ct ON ti.client_timeline_id = ct.id
    WHERE ti.id = NEW.timeline_item_id;
    
    SELECT has_role(NEW.author_id, 'ADMIN'::app_role) INTO is_author_admin;
    
    IF is_author_admin THEN
        IF (SELECT notify_on_comment FROM profiles WHERE id = client_user_id) THEN
            INSERT INTO notifications (user_id, message, link_to)
            VALUES (
                client_user_id, 
                'Novo comentário do admin na tarefa: ' || timeline_title,
                '/timeline'
            );
        END IF;
    ELSE
        INSERT INTO notifications (user_id, message, link_to)
        SELECT p.id, 'Novo comentário do cliente na tarefa: ' || timeline_title, 
               '/admin/clients/' || client_user_id
        FROM profiles p
        WHERE has_role(p.id, 'ADMIN'::app_role) 
        AND p.notify_on_comment = true;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 2. create_progress_notification
CREATE OR REPLACE FUNCTION public.create_progress_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    client_user_id UUID;
    timeline_title TEXT;
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status OR NEW.progress_status IS DISTINCT FROM OLD.progress_status THEN
        SELECT ct.client_id, ti.title INTO client_user_id, timeline_title
        FROM timeline_items ti
        JOIN client_timelines ct ON ti.client_timeline_id = ct.id
        WHERE ti.id = NEW.id;
        
        IF (SELECT notify_on_progress FROM profiles WHERE id = client_user_id) THEN
            INSERT INTO notifications (user_id, message, link_to)
            VALUES (
                client_user_id,
                'Progresso atualizado na tarefa: ' || timeline_title,
                '/timeline'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 3. create_indication_notification
CREATE OR REPLACE FUNCTION public.create_indication_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO notifications (user_id, message, link_to)
    SELECT p.id, 'Nova indicação recebida de: ' || (SELECT full_name FROM profiles WHERE id = NEW.client_id),
           '/admin/clients/' || NEW.client_id
    FROM profiles p
    WHERE has_role(p.id, 'ADMIN'::app_role);
    
    RETURN NEW;
END;
$function$;

-- 4. create_request_notification
CREATE OR REPLACE FUNCTION public.create_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO notifications (user_id, message, link_to)
    SELECT p.id, 'Nova solicitação: ' || NEW.title,
           '/admin/clients/' || NEW.client_id
    FROM profiles p
    WHERE has_role(p.id, 'ADMIN'::app_role);
    
    RETURN NEW;
END;
$function$;

-- 5. create_document_notification
CREATE OR REPLACE FUNCTION public.create_document_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO notifications (user_id, message, link_to)
    VALUES (
        NEW.client_id,
        'Novo documento adicionado: ' || NEW.title,
        '/documents'
    );
    
    RETURN NEW;
END;
$function$;

-- 6. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;