-- Script para criação da tabela de Leads no Supabase

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Dados da Empresa
    cnpj TEXT,
    nome TEXT NOT NULL,
    nome_fantasia TEXT,
    inscricao_estadual TEXT,
    data_inicio_operacao DATE,
    segmento TEXT,
    
    -- Endereço
    cep TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    
    -- Contato da Empresa
    telefone TEXT,
    email TEXT,
    regime_tributario TEXT,
    observacoes TEXT,

    -- Dados Específicos do Lead ("Um pouco mais")
    origem TEXT, -- Ex: Inbound, Outbound, Indicação, Evento
    temperatura TEXT, -- Ex: Frio, Morno, Quente
    status TEXT DEFAULT 'Novo', -- Ex: Novo, Contato, Qualificado, Perdido
    contato_principal TEXT, -- Nome da pessoa de contato
    cargo_contato TEXT, -- Cargo da pessoa de contato
    receita_potencial DECIMAL(12,2) -- Valor estimado do Lead
);

-- Habilitar RLS e criar policies básicas para usuários logados
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver leads" 
ON public.leads FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem inserir leads" 
ON public.leads FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar leads" 
ON public.leads FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem deletar leads" 
ON public.leads FOR DELETE 
TO authenticated 
USING (true);
