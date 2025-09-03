-- Inserir templates de forma mais direta
INSERT INTO timeline_templates (id, name, description, duration_months)
VALUES 
  ('a1b2c3d4-e5f6-7788-9900-aabbccddeeff', 'Cronograma de Execução Padrão - Sistema Escalável', 'Programa completo de 12 meses para estruturar e escalar operações.', 12),
  ('f1e2d3c4-b5a6-7788-9900-ffeeddccbbaa', 'Cronograma de Execução - Programa de Alavancagem', 'Foco em velocidade e eficiência para resultados financeiros de curto prazo.', 12)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;