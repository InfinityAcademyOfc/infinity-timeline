-- ============================================
-- CORREÇÃO: Sistema de Roles e Admin Master (v2)
-- ============================================

-- 1. Atualizar o trigger handle_new_user para usar a tabela user_roles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir perfil do usuário
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'CLIENTE'::user_role
  );
  
  -- Inserir role padrão na tabela user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'CLIENTE'::app_role);
  
  RETURN new;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Configurar conta Admin Master
DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'infinitymkt00@gmail.com';
    admin_pass TEXT := 'Doublem.2025$';
    existing_user_id UUID;
BEGIN
    -- Verificar se o usuário já existe
    SELECT id INTO existing_user_id
    FROM auth.users
    WHERE email = admin_email;

    IF existing_user_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário já existe com ID: %', existing_user_id;
        admin_user_id := existing_user_id;
        
        -- Atualizar perfil se necessário
        UPDATE public.profiles
        SET full_name = 'Administrador Master',
            email = admin_email
        WHERE id = admin_user_id;
        
        -- Garantir que o role ADMIN existe na tabela user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'ADMIN'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Remover role CLIENTE se existir
        DELETE FROM public.user_roles 
        WHERE user_id = admin_user_id AND role = 'CLIENTE'::app_role;
    ELSE
        -- Criar o usuário na autenticação do Supabase
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            admin_email,
            crypt(admin_pass, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Administrador Master"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO admin_user_id;

        RAISE NOTICE 'Usuário criado com ID: %', admin_user_id;
        
        -- Inserir perfil
        INSERT INTO public.profiles (id, full_name, email, role, points)
        VALUES (admin_user_id, 'Administrador Master', admin_email, 'CLIENTE', 0)
        ON CONFLICT (id) DO UPDATE
        SET full_name = EXCLUDED.full_name,
            email = EXCLUDED.email;
        
        -- Inserir role ADMIN na tabela user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'ADMIN'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    RAISE NOTICE '✅ Conta Admin Master configurada com sucesso!';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Senha: %', admin_pass;
    RAISE NOTICE 'Role ADMIN configurado na tabela user_roles';

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao configurar Admin Master: %', SQLERRM;
END $$;