-- Adicionar campos de perfil da empresa à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS responsible_name TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS responsible_phone TEXT;

-- Garantir que a RLS permite aos usuários atualizar seus próprios perfis
-- Esta política substitui qualquer política de UPDATE anterior
-- para garantir que os novos campos sejam editáveis.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver e atualizar seus próprios perfis" ON public.profiles;

CREATE POLICY "Usuários podem ver e atualizar seus próprios perfis" 
ON public.profiles FOR ALL 
USING (auth.uid() = id);

-- Garantir que a política de Admin (que deve existir de 20250903) esteja correta
DROP POLICY IF EXISTS "Admins podem gerenciar todos os perfis" ON public.profiles;

CREATE POLICY "Admins podem gerenciar todos os perfis" 
ON public.profiles FOR ALL 
USING (public.is_admin());