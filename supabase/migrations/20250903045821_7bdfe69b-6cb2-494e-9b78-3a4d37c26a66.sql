-- Corrigir função is_admin para definir search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;