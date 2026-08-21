CREATE TABLE IF NOT EXISTS suporte_configuracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipos_ticket JSONB DEFAULT '["Bug / Erro", "Dúvida de Uso", "Melhoria", "Acesso / Permissão", "Treinamento", "Implantação", "Outros"]',
    setores JSONB DEFAULT '["Suporte N1", "Suporte N2", "Infraestrutura", "Desenvolvimento", "Comercial"]',
    modulos JSONB DEFAULT '["Financeiro", "Relatórios", "Autenticação", "Estoque", "Vendas"]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir que sempre tenha apenas 1 linha
CREATE UNIQUE INDEX IF NOT EXISTS suporte_configuracoes_single_row ON suporte_configuracoes((true));

-- RLS
ALTER TABLE suporte_configuracoes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='suporte_configuracoes' AND policyname='Permitir leitura') THEN
    CREATE POLICY "Permitir leitura" ON suporte_configuracoes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='suporte_configuracoes' AND policyname='Permitir atualizacao') THEN
    CREATE POLICY "Permitir atualizacao" ON suporte_configuracoes FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='suporte_configuracoes' AND policyname='Permitir insercao') THEN
    CREATE POLICY "Permitir insercao" ON suporte_configuracoes FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Inserir a linha padrão se não existir
INSERT INTO suporte_configuracoes (tipos_ticket, setores, modulos)
SELECT 
  '["Bug / Erro", "Dúvida de Uso", "Melhoria", "Acesso / Permissão", "Treinamento", "Implantação", "Outros"]'::jsonb,
  '["Suporte N1", "Suporte N2", "Infraestrutura", "Desenvolvimento", "Comercial"]'::jsonb,
  '["Financeiro", "Relatórios", "Autenticação", "Estoque", "Vendas"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM suporte_configuracoes);
