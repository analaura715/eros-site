-- ==========================================
-- SCRIPT DE CRIAÇÃO DO MÓDULO DE CHAT INTERNO
-- ==========================================

-- 1. Criação das Tabelas

CREATE TABLE IF NOT EXISTS public.chat_conversas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT NOT NULL DEFAULT 'direta', -- 'direta' ou 'grupo'
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_participantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversa_id UUID REFERENCES public.chat_conversas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    entrou_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(conversa_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS public.chat_mensagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversa_id UUID REFERENCES public.chat_conversas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL DEFAULT 'texto', -- 'texto', 'audio', 'imagem', 'arquivo'
    conteudo TEXT,
    url_arquivo TEXT,
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Configuração de Permissões Básicas (RLS)
ALTER TABLE public.chat_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_mensagens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Políticas genéricas permissivas para uso interno da equipe
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_conversas' AND policyname='Ler conversas') THEN
    CREATE POLICY "Ler conversas" ON public.chat_conversas FOR SELECT USING (true);
    CREATE POLICY "Inserir conversas" ON public.chat_conversas FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_participantes' AND policyname='Ler participantes') THEN
    CREATE POLICY "Ler participantes" ON public.chat_participantes FOR SELECT USING (true);
    CREATE POLICY "Inserir participantes" ON public.chat_participantes FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_mensagens' AND policyname='Ler mensagens') THEN
    CREATE POLICY "Ler mensagens" ON public.chat_mensagens FOR SELECT USING (true);
    CREATE POLICY "Inserir mensagens" ON public.chat_mensagens FOR INSERT WITH CHECK (true);
  END IF;
END $$;
