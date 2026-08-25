-- 1. TABELA DE IMPLANTAÇÕES
CREATE TABLE IF NOT EXISTS implantacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Não Iniciada' CHECK (status IN ('Não Iniciada', 'Em Andamento', 'Concluída', 'Pausada')),
    modulos_selecionados JSONB DEFAULT '[]',
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_conclusao TIMESTAMP WITH TIME ZONE,
    responsavel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE HISTÓRICO DE IMPLANTAÇÃO
CREATE TABLE IF NOT EXISTS implantacao_historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    implantacao_id UUID REFERENCES implantacoes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- 'Anotação', 'Treinamento', 'Configuração', 'Mudança de Status'
    descricao TEXT NOT NULL,
    criado_por TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para implantacoes
ALTER TABLE implantacoes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='implantacoes' AND policyname='Permitir leitura pública implantacoes') THEN
    CREATE POLICY "Permitir leitura pública implantacoes" ON implantacoes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='implantacoes' AND policyname='Permitir inserção pública implantacoes') THEN
    CREATE POLICY "Permitir inserção pública implantacoes" ON implantacoes FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='implantacoes' AND policyname='Permitir atualização pública implantacoes') THEN
    CREATE POLICY "Permitir atualização pública implantacoes" ON implantacoes FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='implantacoes' AND policyname='Permitir exclusão pública implantacoes') THEN
    CREATE POLICY "Permitir exclusão pública implantacoes" ON implantacoes FOR DELETE USING (true);
  END IF;
END $$;

-- RLS para implantacao_historico
ALTER TABLE implantacao_historico ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='implantacao_historico' AND policyname='Permitir leitura pública implantacao_historico') THEN
    CREATE POLICY "Permitir leitura pública implantacao_historico" ON implantacao_historico FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='implantacao_historico' AND policyname='Permitir inserção pública implantacao_historico') THEN
    CREATE POLICY "Permitir inserção pública implantacao_historico" ON implantacao_historico FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='implantacao_historico' AND policyname='Permitir atualização pública implantacao_historico') THEN
    CREATE POLICY "Permitir atualização pública implantacao_historico" ON implantacao_historico FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='implantacao_historico' AND policyname='Permitir exclusão pública implantacao_historico') THEN
    CREATE POLICY "Permitir exclusão pública implantacao_historico" ON implantacao_historico FOR DELETE USING (true);
  END IF;
END $$;
