/*
!! ATENÇÃO !!
Este script cria um usuário Admin Master no sistema.
Copie e cole este script no Editor SQL do seu painel Supabase para executá-lo manualmente.

Instruções:
1. Acesse: https://supabase.com/dashboard/project/emdzsnwcyyrlaljrrjmc/sql/new
2. Cole este script completo
3. Execute o script
4. O Admin Master será criado com as credenciais abaixo

Credenciais:
Email: infinitymkt00@gmail.com
Senha: Doublem.2025$

⚠️ IMPORTANTE: Altere a senha após o primeiro login!
*/

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
    END IF;

    -- Inserir ou atualizar o perfil na tabela 'profiles'
    INSERT INTO public.profiles (id, full_name, email, role, points)
    VALUES (admin_user_id, 'Administrador Master', admin_email, 'CLIENTE', 0)
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    RAISE NOTICE 'Perfil criado/atualizado para: %', admin_email;

    -- Atribuir o role 'ADMIN' na tabela 'user_roles'
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'ADMIN'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE '✅ Usuário Admin Master criado com sucesso!';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Senha: %', admin_pass;
    RAISE NOTICE '⚠️ IMPORTANTE: Altere a senha após o primeiro login!';

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar Admin Master: %', SQLERRM;
END $$;
