-- ==========================================
-- SCRIPT DE CRIAÇÃO DA TRILHA DE AUDITORIA
-- ==========================================

-- 1. Criação da Tabela lead_activity_logs

CREATE TABLE IF NOT EXISTS public.lead_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL, -- Usuário que realizou a ação
    action_type TEXT NOT NULL, -- Ex: 'creation', 'status_change', 'field_update', 'activity'
    category TEXT NOT NULL, -- 'success', 'warning', 'info', 'danger', 'neutral'
    old_value JSONB, -- Estado anterior (ex: {"status": "Morno"})
    new_value JSONB, -- Novo estado (ex: {"status": "Quente"})
    description TEXT NOT NULL, -- Descrição textual formatada
    metadata JSONB, -- Metadados adicionais
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Configuração de Row Level Security (RLS)

ALTER TABLE public.lead_activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_activity_logs' AND policyname='Ler logs') THEN
    CREATE POLICY "Ler logs" ON public.lead_activity_logs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_activity_logs' AND policyname='Permitir inserção de logs') THEN
    CREATE POLICY "Permitir inserção de logs" ON public.lead_activity_logs FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 3. Atualização na Tabela Implantacoes
ALTER TABLE IF EXISTS public.implantacoes 
ADD COLUMN IF NOT EXISTS checklist_status JSONB DEFAULT '{}'::jsonb;

-- 4. Atualização na Tabela Agenda
ALTER TABLE IF EXISTS public.agenda
ADD COLUMN IF NOT EXISTS modalidade TEXT DEFAULT 'Remoto',
ADD COLUMN IF NOT EXISTS local_link TEXT,
ADD COLUMN IF NOT EXISTS mensagem_cliente_imediata TEXT,
ADD COLUMN IF NOT EXISTS mensagem_cliente_lembrete TEXT,
ADD COLUMN IF NOT EXISTS mensagem_equipe TEXT;
