-- Script de Atualização: Módulo de Suporte e Acompanhamento

-- 1. ADICIONAR COLUNAS DE ROTINA NA TABELA DE EMPRESAS (Se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empresas' AND column_name='dias_cadencia') THEN
        ALTER TABLE empresas ADD COLUMN dias_cadencia INTEGER DEFAULT 30;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empresas' AND column_name='ultimo_contato_em') THEN
        ALTER TABLE empresas ADD COLUMN ultimo_contato_em TIMESTAMP WITH TIME ZONE;
    END IF;
END$$;


-- 2. TABELA DE CHAMADOS (TICKETS)
CREATE TABLE IF NOT EXISTS suporte_chamados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number SERIAL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    contato_nome TEXT,
    tipo TEXT CHECK (tipo IN ('Bug / Erro', 'Dúvida de Uso', 'Melhoria', 'Acesso / Permissão', 'Treinamento', 'Implantação', 'Outros')),
    modulo TEXT,
    responsavel TEXT,
    duracao TEXT,
    status TEXT DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Andamento', 'Resolvido', 'Cancelado')),
    prioridade TEXT DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE suporte_chamados ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='suporte_chamados' AND policyname='Permitir leitura pública suporte_chamados') THEN
    CREATE POLICY "Permitir leitura pública suporte_chamados" ON suporte_chamados FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='suporte_chamados' AND policyname='Permitir inserção pública suporte_chamados') THEN
    CREATE POLICY "Permitir inserção pública suporte_chamados" ON suporte_chamados FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='suporte_chamados' AND policyname='Permitir atualização pública suporte_chamados') THEN
    CREATE POLICY "Permitir atualização pública suporte_chamados" ON suporte_chamados FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='suporte_chamados' AND policyname='Permitir exclusão pública suporte_chamados') THEN
    CREATE POLICY "Permitir exclusão pública suporte_chamados" ON suporte_chamados FOR DELETE USING (true);
  END IF;
END $$;


-- 3. TABELA DE ROTINAS DE CONTATO (CHECK-INS)
CREATE TABLE IF NOT EXISTS suporte_rotinas_contato (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    data_contato TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_interacao TEXT, -- "Reunião", "WhatsApp", "E-mail", "Telefone", "Visita Técnica"
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE suporte_rotinas_contato ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='suporte_rotinas_contato' AND policyname='Permitir leitura pública suporte_rotinas_contato') THEN
    CREATE POLICY "Permitir leitura pública suporte_rotinas_contato" ON suporte_rotinas_contato FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='suporte_rotinas_contato' AND policyname='Permitir inserção pública suporte_rotinas_contato') THEN
    CREATE POLICY "Permitir inserção pública suporte_rotinas_contato" ON suporte_rotinas_contato FOR INSERT WITH CHECK (true);
  END IF;
END $$;


-- 4. TABELA DE DIAGNÓSTICOS SNAPSHOTS (IMUTABILIDADE)
CREATE TABLE IF NOT EXISTS diagnosticos_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diagnostico_id UUID REFERENCES diagnosticos(id) ON DELETE CASCADE UNIQUE,
    payload_estatico JSONB NOT NULL,
    versao TEXT DEFAULT '1.0',
    congelado_por TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE diagnosticos_snapshots ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='diagnosticos_snapshots' AND policyname='Permitir leitura pública diagnosticos_snapshots') THEN
    CREATE POLICY "Permitir leitura pública diagnosticos_snapshots" ON diagnosticos_snapshots FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='diagnosticos_snapshots' AND policyname='Permitir inserção pública diagnosticos_snapshots') THEN
    CREATE POLICY "Permitir inserção pública diagnosticos_snapshots" ON diagnosticos_snapshots FOR INSERT WITH CHECK (true);
  END IF;
END $$;
