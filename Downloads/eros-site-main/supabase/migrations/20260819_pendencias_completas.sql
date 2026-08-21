-- SCRIPT DE ATUALIZAÇÃO - PENDÊNCIAS MAIS COMPLETAS

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='venux_pendencias' AND column_name='data_inicio') THEN
        ALTER TABLE venux_pendencias ADD COLUMN data_inicio DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='venux_pendencias' AND column_name='data_fim') THEN
        ALTER TABLE venux_pendencias ADD COLUMN data_fim DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='venux_pendencias' AND column_name='hora_inicio') THEN
        ALTER TABLE venux_pendencias ADD COLUMN hora_inicio TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='venux_pendencias' AND column_name='hora_fim') THEN
        ALTER TABLE venux_pendencias ADD COLUMN hora_fim TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='venux_pendencias' AND column_name='responsavel') THEN
        ALTER TABLE venux_pendencias ADD COLUMN responsavel TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='venux_pendencias' AND column_name='cliente_id') THEN
        ALTER TABLE venux_pendencias ADD COLUMN cliente_id UUID REFERENCES empresas(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='venux_pendencias' AND column_name='imagens') THEN
        ALTER TABLE venux_pendencias ADD COLUMN imagens TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='venux_pendencias' AND column_name='criado_por_nome') THEN
        ALTER TABLE venux_pendencias ADD COLUMN criado_por_nome TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='venux_pendencias' AND column_name='observacao') THEN
        ALTER TABLE venux_pendencias ADD COLUMN observacao TEXT;
    END IF;
END$$;
