-- Limpar role CLIENTE duplicado da conta Admin Master
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'infinitymkt00@gmail.com')
AND role = 'CLIENTE'::app_role;