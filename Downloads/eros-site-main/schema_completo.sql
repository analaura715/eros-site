-- Execute este comando no painel do Supabase, no menu "SQL Editor"

-- 1. TABELA DE EMPRESAS (atualizada com campo status)
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    nome_fantasia TEXT NOT NULL,
    inscricao_estadual TEXT,
    data_inicio_operacao DATE,
    segmento TEXT NOT NULL,
    cep TEXT NOT NULL,
    logradouro TEXT NOT NULL,
    numero TEXT NOT NULL,
    complemento TEXT,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL,
    uf TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT,
    regime_tributario TEXT,
    observacoes TEXT,
    status TEXT DEFAULT 'Em Negociação' CHECK (status IN ('Em Negociação', 'Prospectado', 'Ativo', 'Inativo')),
    status_atualizado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna status na tabela existente (caso já exista)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empresas' AND column_name='status') THEN
        ALTER TABLE empresas ADD COLUMN status TEXT DEFAULT 'Em Negociação' CHECK (status IN ('Em Negociação', 'Prospectado', 'Ativo', 'Inativo'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empresas' AND column_name='status_atualizado_em') THEN
        ALTER TABLE empresas ADD COLUMN status_atualizado_em TIMESTAMP WITH TIME ZONE;
    END IF;
END$$;

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='empresas' AND policyname='Permitir leitura pública empresas') THEN
    CREATE POLICY "Permitir leitura pública empresas" ON empresas FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='empresas' AND policyname='Permitir inserção pública empresas') THEN
    CREATE POLICY "Permitir inserção pública empresas" ON empresas FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='empresas' AND policyname='Permitir atualização pública empresas') THEN
    CREATE POLICY "Permitir atualização pública empresas" ON empresas FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='empresas' AND policyname='Permitir exclusão pública empresas') THEN
    CREATE POLICY "Permitir exclusão pública empresas" ON empresas FOR DELETE USING (true);
  END IF;
END $$;


-- 2. TABELA DE CONVITES
CREATE TABLE IF NOT EXISTS convites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave TEXT UNIQUE NOT NULL,
    cargo TEXT NOT NULL DEFAULT 'Padrão',
    criado_por UUID,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    usado_em TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='convites' AND policyname='Permitir leitura pública convites') THEN
    CREATE POLICY "Permitir leitura pública convites" ON convites FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='convites' AND policyname='Permitir inserção pública convites') THEN
    CREATE POLICY "Permitir inserção pública convites" ON convites FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='convites' AND policyname='Permitir atualização pública convites') THEN
    CREATE POLICY "Permitir atualização pública convites" ON convites FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='convites' AND policyname='Permitir exclusão pública convites') THEN
    CREATE POLICY "Permitir exclusão pública convites" ON convites FOR DELETE USING (true);
  END IF;
END $$;


-- 3. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    cargo TEXT NOT NULL DEFAULT 'Padrão',
    chave_acesso TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios' AND policyname='Permitir leitura pública usuarios') THEN
    CREATE POLICY "Permitir leitura pública usuarios" ON usuarios FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios' AND policyname='Permitir inserção pública usuarios') THEN
    CREATE POLICY "Permitir inserção pública usuarios" ON usuarios FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios' AND policyname='Permitir atualização pública usuarios') THEN
    CREATE POLICY "Permitir atualização pública usuarios" ON usuarios FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios' AND policyname='Permitir exclusão pública usuarios') THEN
    CREATE POLICY "Permitir exclusão pública usuarios" ON usuarios FOR DELETE USING (true);
  END IF;
END $$;


-- 4. TABELA DE CONFIGURAÇÕES DO SISTEMA (meta do mês e outras configs)
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_por UUID
);

ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='configuracoes_sistema' AND policyname='Permitir leitura pública configs') THEN
    CREATE POLICY "Permitir leitura pública configs" ON configuracoes_sistema FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='configuracoes_sistema' AND policyname='Permitir inserção pública configs') THEN
    CREATE POLICY "Permitir inserção pública configs" ON configuracoes_sistema FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='configuracoes_sistema' AND policyname='Permitir atualização pública configs') THEN
    CREATE POLICY "Permitir atualização pública configs" ON configuracoes_sistema FOR UPDATE USING (true);
  END IF;
END $$;

-- Valor inicial da meta do mês
INSERT INTO configuracoes_sistema (chave, valor) VALUES ('meta_clientes_mes', '5')
ON CONFLICT (chave) DO NOTHING;


-- 5. FUNÇÃO RPC: VALIDAR CONVITE
CREATE OR REPLACE FUNCTION validar_convite(p_chave TEXT)
RETURNS JSONB AS $$
DECLARE
    v_convite RECORD;
BEGIN
    SELECT * INTO v_convite FROM convites WHERE chave = p_chave;
    IF NOT FOUND THEN RETURN jsonb_build_object('valido', false, 'erro', 'Chave de acesso inválida ou inexistente.'); END IF;
    IF v_convite.usado_em IS NOT NULL THEN RETURN jsonb_build_object('valido', false, 'erro', 'Esta chave de acesso já foi utilizada.'); END IF;
    IF v_convite.expira_em < NOW() THEN RETURN jsonb_build_object('valido', false, 'erro', 'Esta chave de acesso já expirou.'); END IF;
    RETURN jsonb_build_object('valido', true, 'cargo', v_convite.cargo);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. FUNÇÃO RPC: EXCLUIR USUÁRIO
CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM usuarios WHERE id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. TRIGGER PARA CRIAR USUÁRIO AUTOMATICAMENTE APÓS CADASTRO NO SUPABASE AUTH
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_chave TEXT;
    v_cargo TEXT := 'Padrão';
BEGIN
    v_chave := NEW.raw_user_meta_data->>'chave_acesso';
    
    IF v_chave IS NOT NULL THEN
        SELECT cargo INTO v_cargo FROM convites WHERE chave = v_chave;
        UPDATE convites SET usado_em = NOW() WHERE chave = v_chave;
    END IF;

    INSERT INTO public.usuarios (id, nome, email, cargo, chave_acesso)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(v_cargo, 'Padrão'),
        v_chave
    )
    ON CONFLICT (id) DO UPDATE 
    SET nome = EXCLUDED.nome, cargo = EXCLUDED.cargo;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS setor_atuacao TEXT;
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
