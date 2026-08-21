-- ==============================================================================
-- VENUX ERP - SCHEMA DE CONTROLE DE USUÁRIOS E GESTÃO DE PERMISSÕES (ACL/RBAC)
-- ==============================================================================

-- 1. Criação/Atualização da tabela USUARIOS (se já existir, usar ALTER TABLE)
-- Aqui assumimos a criação do zero ou recriação para o padrão ERP.
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id), -- Vinculo com Supabase Auth
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status CHAR(1) DEFAULT 'A', -- 'A' Ativo, 'I' Inativo
    
    -- Parâmetros Operacionais e Regras de Negócio
    senha_adm VARCHAR(255), -- Senha rápida (PIN/Hash) para autorizações SUPER
    is_super_usuario BOOLEAN DEFAULT FALSE, -- Flag Master (ignora restrições)
    pode_alterar_desconto BOOLEAN DEFAULT FALSE,
    pode_abrir_pdv BOOLEAN DEFAULT FALSE,
    usa_tef BOOLEAN DEFAULT FALSE,
    
    -- Vínculos Cadastrais
    vendedor_id UUID, -- Referência para tabela de vendedores (se existir)
    conta_caixa_id UUID, -- Referência para tabela de contas (se existir)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela Mestre: MODULOS_SISTEMA (Rotas, Menus e Ações)
CREATE TABLE IF NOT EXISTS public.modulos_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_menu VARCHAR(50) UNIQUE NOT NULL, -- Ex: 'COM01', 'SUP02'
    descricao VARCHAR(255) NOT NULL, -- Ex: 'Pipeline de Vendas'
    categoria VARCHAR(100) NOT NULL, -- Ex: 'Comercial'
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Carga Inicial de Módulos (Exemplo Mapeado do Venux)
INSERT INTO public.modulos_sistema (codigo_menu, descricao, categoria)
VALUES 
    ('COM01', 'Dashboard Comercial', 'Comercial (CRM)'),
    ('COM02', 'Empresas', 'Comercial (CRM)'),
    ('COM03', 'Leads', 'Comercial (CRM)'),
    ('COM04', 'Pipeline', 'Comercial (CRM)'),
    ('COM05', 'Agenda', 'Comercial (CRM)'),
    ('COM06', 'Histórico', 'Comercial (CRM)'),
    ('COM07', 'Diagnósticos / Documentos', 'Comercial (CRM)'),
    
    ('SUP01', 'Painel / Dashboard', 'Suporte & Chamados'),
    ('SUP02', 'Chamados', 'Suporte & Chamados'),
    ('SUP03', 'Tarefas', 'Suporte & Chamados'),
    ('SUP04', 'Rotina de Contatos', 'Suporte & Chamados'),
    ('SUP05', 'Clientes do Suporte', 'Suporte & Chamados'),
    
    ('USR01', 'Membros da Equipe', 'Gestão de Usuários'),
    ('USR02', 'Convites', 'Gestão de Usuários'),
    ('USR03', 'Controle de Permissões (ERP)', 'Gestão de Usuários')
ON CONFLICT (codigo_menu) DO NOTHING;

-- 3. Tabela Associativa: USUARIO_PERMISSOES
CREATE TABLE IF NOT EXISTS public.usuario_permissoes (
    id_usuario UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    id_modulo UUID REFERENCES public.modulos_sistema(id) ON DELETE CASCADE,
    habilitar CHAR(1) DEFAULT 'N', -- 'S' ou 'N'
    super CHAR(1) DEFAULT 'N', -- 'S' ou 'N' (Exige senha de Supervisor)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id_usuario, id_modulo)
);

-- Criar VIEW para facilitar o LEFT JOIN do Frontend (Endpoint 2 do Requisito)
-- Essa View retorna a grid de módulos para um determinado usuário. 
-- Como o Supabase chama via RPC ou Select direto, podemos usar essa estrutura:
CREATE OR REPLACE VIEW vw_permissoes_grid AS
SELECT 
    m.id AS id_modulo,
    m.codigo_menu,
    m.descricao,
    m.categoria,
    u.id AS id_usuario,
    COALESCE(up.habilitar, 'N') AS habilitar,
    COALESCE(up.super, 'N') AS super
FROM 
    public.modulos_sistema m
CROSS JOIN 
    public.usuarios u
LEFT JOIN 
    public.usuario_permissoes up ON m.id = up.id_modulo AND u.id = up.id_usuario
WHERE 
    m.ativo = TRUE;

-- Procedure / Function para atualizar permissões em lote (Bulk Upsert)
CREATE OR REPLACE FUNCTION save_user_permissions(
    p_id_usuario UUID,
    p_permissoes JSONB -- Array de objetos: [{"id_modulo": "uuid", "habilitar": "S", "super": "N"}]
) RETURNS void AS $$
DECLARE
    perm_record RECORD;
BEGIN
    FOR perm_record IN SELECT * FROM jsonb_to_recordset(p_permissoes) AS x(id_modulo UUID, habilitar CHAR, super CHAR)
    LOOP
        INSERT INTO public.usuario_permissoes (id_usuario, id_modulo, habilitar, super, updated_at)
        VALUES (p_id_usuario, perm_record.id_modulo, perm_record.habilitar, perm_record.super, now())
        ON CONFLICT (id_usuario, id_modulo) DO UPDATE 
        SET habilitar = EXCLUDED.habilitar,
            super = EXCLUDED.super,
            updated_at = now();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Configuração RLS (Opcional, deve ser ajustado conforme a regra do projeto)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_permissoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso básicas (exemplo aberto para admins)
CREATE POLICY "Enable all for authenticated users" ON public.usuarios FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.modulos_sistema FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.usuario_permissoes FOR ALL TO authenticated USING (true);
