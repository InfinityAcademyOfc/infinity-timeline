-- Fix recursive RLS policy on user_roles causing infinite recursion
-- 1) Drop the problematic policy that references user_roles inside itself
DROP POLICY IF EXISTS "Admins podem gerenciar roles" ON public.user_roles;

-- 2) Create non-recursive, function-based policies using is_admin()
--    Split by command to avoid SELECT recursion and keep least privilege
CREATE POLICY "Admins podem inserir roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins podem atualizar roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins podem deletar roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin());