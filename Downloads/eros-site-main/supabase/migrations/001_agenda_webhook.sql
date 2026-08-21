-- Criação da função de gatilho que chamará a Edge Function usando a extensão HTTP do Supabase
-- Certifique-se de que a extensão "http" e "pg_net" estão habilitadas no seu banco de dados.

-- Habilitar a extensão pg_net se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION trigger_send_whatsapp_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url text;
  v_anon_key text;
  v_request_id bigint;
BEGIN
  -- Substitua pelas suas chaves reais do Supabase (URL e Service Role Key ou Anon Key)
  -- Recomendável guardar essas chaves de forma segura, mas para webhooks simples dentro do DB:
  -- Você deve pegar a URL do seu projeto e a chave anon/service_role
  v_supabase_url := current_setting('app.settings.supabase_url', true); 
  v_anon_key := current_setting('app.settings.supabase_anon_key', true);

  -- Se as variáveis não estiverem setadas no vault, você pode colocar a URL hardcoded abaixo para testes
  -- v_supabase_url := 'https://SEU_PROJETO.supabase.co';
  -- v_anon_key := 'SUA_CHAVE_ANON';

  IF v_supabase_url IS NULL OR v_anon_key IS NULL THEN
    RAISE WARNING 'Supabase URL ou Key não configurados no postgresql.conf customizado. O Webhook pode falhar.';
  END IF;

  SELECT net.http_post(
      url:=(v_supabase_url || '/functions/v1/send-whatsapp'),
      headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key
      ),
      body:=jsonb_build_object(
          'type', 'INSERT',
          'table', TG_TABLE_NAME,
          'record', row_to_json(NEW)
      )
  ) INTO v_request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criação do Trigger associado à tabela agenda
DROP TRIGGER IF EXISTS after_agenda_insert ON agenda;

CREATE TRIGGER after_agenda_insert
AFTER INSERT ON agenda
FOR EACH ROW
EXECUTE FUNCTION trigger_send_whatsapp_on_insert();
