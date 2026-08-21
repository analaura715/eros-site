-- Tabela de Trilha de Auditoria (Audit Logs) para Segurança de Nível Corporativo
-- Registra eventos críticos de segurança garantindo imutabilidade

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL, -- Ex: 'LOGIN_SUCCESS', 'ROLE_CHANGED', 'TICKET_DELETED'
    module VARCHAR(255) NOT NULL, -- Ex: 'auth', 'suporte', 'comercial', 'rbac'
    target_id VARCHAR(255),       -- ID do recurso afetado (se aplicável)
    ip_address VARCHAR(45),       -- Endereço IP (pode ser truncado ou anonimizado)
    user_agent TEXT,              -- Informação sobre o navegador/dispositivo
    details JSONB,                -- Payload com informações adicionais da alteração (snapshot)
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'error'))
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Regras de Segurança RLS
-- 1. Apenas Super Admins podem LER a trilha de auditoria completa
CREATE POLICY "Admins podem ler auditoria" ON public.security_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

-- 2. NENHUM USUÁRIO pode ATUALIZAR ou DELETAR logs (IMUTABILIDADE)
CREATE POLICY "Impedir exclusão de logs" ON public.security_audit_logs FOR DELETE USING (false);
CREATE POLICY "Impedir alteração de logs" ON public.security_audit_logs FOR UPDATE USING (false);

-- 3. Inserções podem ser feitas pelo sistema/backend (service_role ou trigger authenticated)
CREATE POLICY "Permitir inserção de logs" ON public.security_audit_logs 
    FOR INSERT 
    WITH CHECK (true);
