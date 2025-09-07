-- Tabela para armazenar KPIs e relatórios dos clientes
CREATE TABLE client_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  leads_generated INT,
  sales_count INT,
  cac NUMERIC(10, 2), -- Custo de Aquisição de Cliente
  ltv NUMERIC(10, 2), -- Lifetime Value
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE client_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar KPIs" ON client_kpis FOR ALL USING (is_admin());
CREATE POLICY "Clientes podem ver seus próprios KPIs" ON client_kpis FOR SELECT USING (auth.uid() = client_id);

-- Tabela para solicitações gerais dos clientes
CREATE TABLE client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  details TEXT,
  request_type VARCHAR(50), -- ex: 'PARCERIA', 'ADICIONAL_CRONOGRAMA'
  status VARCHAR(50) DEFAULT 'PENDENTE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar solicitações" ON client_requests FOR ALL USING (is_admin());
CREATE POLICY "Clientes podem criar e ver suas solicitações" ON client_requests FOR ALL USING (auth.uid() = client_id);

-- Criar buckets de storage para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Políticas para storage de documentos
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can upload documents for clients" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND is_admin());

CREATE POLICY "Admins can manage all documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'documents' AND is_admin());