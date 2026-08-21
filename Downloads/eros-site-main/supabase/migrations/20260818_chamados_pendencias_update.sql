-- SCRIPT DE ATUALIZAÇÃO E NOVO MÓDULO (CHAMADOS E PENDÊNCIAS)

-- PARTE 1: Reformulação dos Chamados
-- Criar a tabela se ela ainda não existir
CREATE TABLE IF NOT EXISTS suporte_chamados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number SERIAL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
    contato_nome TEXT,
    tipo TEXT,
    modulo TEXT,
    responsavel TEXT,
    status TEXT DEFAULT 'Aberto',
    prioridade TEXT DEFAULT 'Média',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configurações do Suporte (Cores, Tipos de Ticket, etc)
CREATE TABLE IF NOT EXISTS suporte_configuracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipos_ticket JSONB DEFAULT '[]'::jsonb,
    setores JSONB DEFAULT '[]'::jsonb,
    modulos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remover a coluna duração (caso exista) e adicionar as novas colunas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suporte_chamados' AND column_name='duracao') THEN
        ALTER TABLE suporte_chamados DROP COLUMN duracao;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suporte_chamados' AND column_name='data_atendimento') THEN
        ALTER TABLE suporte_chamados DROP COLUMN data_atendimento;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suporte_chamados' AND column_name='data_inicio') THEN
        ALTER TABLE suporte_chamados ADD COLUMN data_inicio DATE DEFAULT CURRENT_DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suporte_chamados' AND column_name='data_fim') THEN
        ALTER TABLE suporte_chamados ADD COLUMN data_fim DATE DEFAULT CURRENT_DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suporte_chamados' AND column_name='hora_inicio') THEN
        ALTER TABLE suporte_chamados ADD COLUMN hora_inicio TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suporte_chamados' AND column_name='hora_fim') THEN
        ALTER TABLE suporte_chamados ADD COLUMN hora_fim TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suporte_chamados' AND column_name='imagens') THEN
        ALTER TABLE suporte_chamados ADD COLUMN imagens TEXT[] DEFAULT '{}';
    END IF;
END$$;

-- Criar Storage Bucket para Imagens dos Chamados (Apenas se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chamados_imagens', 'chamados_imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage (Permitir tudo para autenticados e leitura pública se aplicável)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename='objects' AND policyname='Permitir upload imagens chamados') THEN
    CREATE POLICY "Permitir upload imagens chamados" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chamados_imagens');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename='objects' AND policyname='Permitir leitura imagens chamados') THEN
    CREATE POLICY "Permitir leitura imagens chamados" ON storage.objects FOR SELECT USING (bucket_id = 'chamados_imagens');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename='objects' AND policyname='Permitir delete imagens chamados') THEN
    CREATE POLICY "Permitir delete imagens chamados" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chamados_imagens');
  END IF;
END $$;

-- PARTE 2: Nova Tabela de Pendências / Backlog
CREATE TABLE IF NOT EXISTS venux_pendencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT CHECK (categoria IN ('Desenvolvimento', 'Reunião', 'Ideia', 'Pedido', 'Outros')) DEFAULT 'Ideia',
    status TEXT CHECK (status IN ('Pendente', 'Em Andamento', 'Concluído')) DEFAULT 'Pendente',
    prioridade TEXT CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')) DEFAULT 'Média',
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS para Pendências
ALTER TABLE venux_pendencias ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='venux_pendencias' AND policyname='Permitir leitura venux_pendencias') THEN
    CREATE POLICY "Permitir leitura venux_pendencias" ON venux_pendencias FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='venux_pendencias' AND policyname='Permitir inserção venux_pendencias') THEN
    CREATE POLICY "Permitir inserção venux_pendencias" ON venux_pendencias FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='venux_pendencias' AND policyname='Permitir atualização venux_pendencias') THEN
    CREATE POLICY "Permitir atualização venux_pendencias" ON venux_pendencias FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='venux_pendencias' AND policyname='Permitir exclusão venux_pendencias') THEN
    CREATE POLICY "Permitir exclusão venux_pendencias" ON venux_pendencias FOR DELETE USING (true);
  END IF;
END $$;
