-- Script para criar a tarefa agendada (Cron Job) que verifica reuniões em 24h
-- Requer a extensão pg_cron e pg_net

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION check_and_send_reminders()
RETURNS void AS $$
DECLARE
  v_supabase_url text;
  v_anon_key text;
  v_request_id bigint;
  meeting_record record;
BEGIN
  v_supabase_url := current_setting('app.settings.supabase_url', true); 
  v_anon_key := current_setting('app.settings.supabase_anon_key', true);

  -- Iterar por todas as reuniões que vão acontecer no dia seguinte
  -- Verifica se a data_inicio da reunião (convertida para DATE) é amanhã
  FOR meeting_record IN
    SELECT * FROM agenda
    WHERE date_trunc('day', data_inicio::timestamp AT TIME ZONE 'UTC') = date_trunc('day', (now() + interval '1 day') AT TIME ZONE 'UTC')
  LOOP
    -- Faz o POST para a Edge Function para cada reunião encontrada
    SELECT net.http_post(
        url:=(v_supabase_url || '/functions/v1/send-whatsapp'),
        headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key
        ),
        body:=jsonb_build_object(
            'isReminder', true,
            'meeting', row_to_json(meeting_record)
        )
    ) INTO v_request_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agendar a verificação para rodar todos os dias às 08:00 AM (Ajuste conforme o seu timezone no Supabase)
-- Se quiser testar de 1 em 1 minuto, troque '0 8 * * *' por '* * * * *'
SELECT cron.schedule(
    'whatsapp-reminders',
    '0 8 * * *', -- Roda todo dia às 8 da manhã (UTC)
    'SELECT check_and_send_reminders();'
);
