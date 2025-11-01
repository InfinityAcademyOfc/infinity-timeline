-- Garantir que a tabela profiles tem todos os campos necessários para empresa
-- e remover a coluna role obsoleta se ainda existir

-- Adicionar campos da empresa se não existirem
DO $$ 
BEGIN
  -- Verificar e adicionar company_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
    ALTER TABLE public.profiles ADD COLUMN company_name TEXT;
  END IF;

  -- Verificar e adicionar cnpj
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cnpj') THEN
    ALTER TABLE public.profiles ADD COLUMN cnpj TEXT;
  END IF;

  -- Verificar e adicionar responsible_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'responsible_name') THEN
    ALTER TABLE public.profiles ADD COLUMN responsible_name TEXT;
  END IF;

  -- Verificar e adicionar responsible_phone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'responsible_phone') THEN
    ALTER TABLE public.profiles ADD COLUMN responsible_phone TEXT;
  END IF;

  -- Verificar e adicionar company_logo_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_logo_url') THEN
    ALTER TABLE public.profiles ADD COLUMN company_logo_url TEXT;
  END IF;

  -- Verificar e adicionar address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE public.profiles ADD COLUMN address TEXT;
  END IF;
END $$;

-- Garantir que o trigger handle_new_user está correto e insere apenas na user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_role app_role;
    meta_role TEXT;
BEGIN
    -- 1. Insere o perfil básico (SEM a coluna 'role' obsoleta)
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data ->> 'full_name'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Determina o role a partir dos metadados
    meta_role := new.raw_user_meta_data ->> 'role';

    IF meta_role = 'ADMIN' THEN
        new_role := 'ADMIN'::app_role;
    ELSE
        new_role := 'CLIENTE'::app_role;
    END IF;

    -- 3. Insere o role na tabela user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, new_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN new;
END;
$$;

-- Criar função auxiliar para obter roles de um usuário
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id_param UUID)
RETURNS TABLE(role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_id_param;
$$;