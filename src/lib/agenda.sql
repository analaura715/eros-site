-- Criação da tabela de Agenda
CREATE TABLE IF NOT EXISTS public.agenda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'Reunião', -- Reunião, Demonstração, Lembrete, Outro
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    resultado_reuniao TEXT,
    lembrete_anterior BOOLEAN DEFAULT false,
    lembrete_dia BOOLEAN DEFAULT false,
    horario_lembrete TEXT,
    email_secretaria TEXT,
    tel_secretaria TEXT
);

-- Configurando RLS (Row Level Security)
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Simplificadas para o protótipo, permitindo tudo)
CREATE POLICY "Permitir leitura de agenda para todos os usuários"
ON public.agenda FOR SELECT
USING (true);

CREATE POLICY "Permitir inserção na agenda para todos os usuários"
ON public.agenda FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir atualização na agenda para todos os usuários"
ON public.agenda FOR UPDATE
USING (true);

CREATE POLICY "Permitir exclusão na agenda para todos os usuários"
ON public.agenda FOR DELETE
USING (true);
