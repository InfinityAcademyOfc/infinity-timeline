-- Adicionar campos de perfil da empresa à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS responsible_name TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS responsible_phone TEXT;

-- Atualizar Políticas de Armazenamento para o bucket 'documents'

-- 1. Remover políticas antigas que podem conflitar (se existirem com esses nomes)
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload documents for clients" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;

-- 2. Política para visualização (Clientes veem seus docs/logos, Admins veem tudo)
CREATE POLICY "Allow access to own documents and logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND (
    -- Admins podem ver tudo no bucket 'documents'
    public.is_admin()
    -- Clientes podem ver arquivos diretamente referenciados na tabela documents
    OR EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.client_id = auth.uid() AND d.file_url = storage.objects.name
    )
    -- Clientes podem ver seu próprio logo
    OR name LIKE 'logos/' || auth.uid()::text || '-logo.%'
  )
);

-- 3. Política para Upload de Logos (Clientes podem fazer upload do próprio logo)
CREATE POLICY "Authenticated users can upload own logo"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'documents' AND
  name LIKE 'logos/' || auth.uid()::text || '-logo.%'
);

-- 4. Política para Upload de Documentos (Admins podem fazer upload para clientes)
CREATE POLICY "Admins can upload documents for clients"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND public.is_admin()
);

-- 5. Política de Gerenciamento Geral para Admins (Update/Delete)
CREATE POLICY "Admins can manage all documents"
ON storage.objects FOR ALL
USING ( bucket_id = 'documents' AND public.is_admin() );

-- Atualizar create_comment_notification para usar has_role
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

    SELECT public.has_role(NEW.author_id, 'ADMIN'::app_role) INTO is_author_admin;

    IF is_author_admin THEN
        IF EXISTS (SELECT 1 FROM profiles WHERE id = client_user_id AND notify_on_comment = true) THEN
            INSERT INTO notifications (user_id, message, link_to)
            VALUES (
                client_user_id,
                'Novo comentário do admin na tarefa: ' || timeline_title,
                '/timeline'
            );
        END IF;
    ELSE
        INSERT INTO notifications (user_id, message, link_to)
        SELECT ur.user_id, 'Novo comentário do cliente na tarefa: ' || timeline_title,
               '/admin/clients/' || client_user_id
        FROM public.user_roles ur
        JOIN public.profiles p ON ur.user_id = p.id
        WHERE ur.role = 'ADMIN'::app_role
        AND p.notify_on_comment = true;
    END IF;

    RETURN NEW;
END;
$function$;