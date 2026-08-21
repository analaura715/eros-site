-- Execute este comando no painel do Supabase, no menu "SQL Editor"

-- 1. TABELA DE ROLES (PERFIS)
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir Perfis Base
INSERT INTO roles (name, description) VALUES 
('Administrador', 'Acesso total ao sistema'),
('Desenvolvedor', 'Acesso técnico e debug'),
('Finanças', 'Acesso aos módulos financeiros'),
('Suporte', 'Acesso ao módulo de chamados e clientes'),
('Comercial', 'Acesso ao pipeline e leads'),
('Administrativo', 'Acesso geral administrativo')
ON CONFLICT (name) DO NOTHING;

-- 2. TABELA DE MÓDULOS (FUNCIONALIDADES)
CREATE TABLE IF NOT EXISTS modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir Módulos Base
INSERT INTO modules (name, description) VALUES 
('crm', 'Gestão de Leads e Pipeline'),
('suporte', 'Gestão de Chamados e Rotinas'),
('financeiro', 'Gestão Financeira'),
('usuarios', 'Gestão de Usuários e Permissões'),
('configuracoes', 'Configurações do Sistema')
ON CONFLICT (name) DO NOTHING;

-- 3. TABELA DE PERMISSÕES DOS PERFIS
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL CHECK (access_level IN ('liberado', 'somente_leitura', 'oculto')),
    UNIQUE(role_id, module_id)
);

-- 4. TABELA DE PERMISSÕES CUSTOMIZADAS POR USUÁRIO (OVERRIDE)
CREATE TABLE IF NOT EXISTS user_custom_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL CHECK (access_level IN ('herdar', 'liberado', 'somente_leitura', 'oculto')),
    UNIQUE(user_id, module_id)
);

-- 5. ATUALIZAR TABELA DE USUÁRIOS COM FOREIGN KEY DE ROLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='role_id') THEN
        ALTER TABLE usuarios ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. ATUALIZAR TABELA DE CONVITES COM FOREIGN KEY DE ROLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='convites' AND column_name='role_id') THEN
        ALTER TABLE convites ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 7. FUNÇÃO RPC: OBTER MATRIZ DE PERMISSÕES DO USUÁRIO
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_role_id UUID;
    v_permissions JSONB := '{}'::JSONB;
    v_module RECORD;
    v_role_perm TEXT;
    v_custom_perm TEXT;
    v_final_perm TEXT;
BEGIN
    -- Pegar o role_id do usuário
    SELECT role_id INTO v_role_id FROM usuarios WHERE id = p_user_id;

    -- Iterar por todos os módulos
    FOR v_module IN SELECT id, name FROM modules LOOP
        
        -- Pegar permissão do perfil
        SELECT access_level INTO v_role_perm FROM role_permissions 
        WHERE role_id = v_role_id AND module_id = v_module.id;
        
        -- Se não tiver permissão definida no perfil, assume 'oculto'
        IF v_role_perm IS NULL THEN
            v_role_perm := 'oculto';
        END IF;

        -- Pegar permissão customizada (override)
        SELECT access_level INTO v_custom_perm FROM user_custom_permissions 
        WHERE user_id = p_user_id AND module_id = v_module.id;
        
        -- Calcular a permissão final
        IF v_custom_perm IS NOT NULL AND v_custom_perm != 'herdar' THEN
            v_final_perm := v_custom_perm;
        ELSE
            v_final_perm := v_role_perm;
        END IF;

        -- Adicionar no JSON de retorno
        v_permissions := jsonb_set(v_permissions, ARRAY[v_module.name], to_jsonb(v_final_perm));
    END LOOP;

    RETURN v_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. POLÍTICAS DE RLS (ROW LEVEL SECURITY)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Inserts roles" ON roles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública modules" ON modules FOR SELECT USING (true);
CREATE POLICY "Inserts modules" ON modules FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública role_permissions" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "Atualizacao role_permissions" ON role_permissions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_custom_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública custom perms" ON user_custom_permissions FOR SELECT USING (true);
CREATE POLICY "Atualização publica custom perms" ON user_custom_permissions FOR ALL USING (true) WITH CHECK (true);
