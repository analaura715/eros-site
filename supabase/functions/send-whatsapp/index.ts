import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configure aqui o seu provedor de WhatsApp (Ex: Twilio, Evolution API, Z-API)
const WHATSAPP_API_URL = Deno.env.get("WHATSAPP_API_URL") || "";
const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Tratamento de CORS para chamadas do navegador (se necessário)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    console.log("Payload recebido:", payload);

    let meeting = null;
    let isReminder = false;

    // Detectar se vem do Webhook (gatilho imediato) ou do Cron Job (lembrete)
    if (payload.type === "INSERT" && payload.table === "agenda") {
      meeting = payload.record;
      isReminder = false;
    } else if (payload.isReminder && payload.meeting) {
      meeting = payload.meeting;
      isReminder = true;
    } else {
      throw new Error("Payload inválido ou não suportado.");
    }

    if (!meeting.lead_id) {
      return new Response(
        JSON.stringify({ message: "Reunião não possui lead associado. Nenhuma mensagem enviada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Buscar o telefone do lead
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("nome, telefone")
      .eq("id", meeting.lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error("Erro ao buscar o lead: " + (leadError?.message || "Lead não encontrado"));
    }

    const telefone = lead.telefone;
    if (!telefone) {
      return new Response(
        JSON.stringify({ message: "Lead não possui telefone cadastrado. Nenhuma mensagem enviada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Formatar a data
    const dataInicio = new Date(meeting.data_inicio);
    const dataFormatada = dataInicio.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });

    // Montar a mensagem
    let mensagemText = "";
    if (isReminder) {
      mensagemText = `Olá ${lead.nome}! Passando para lembrar da nossa reunião agendada para amanhã, ${dataFormatada} às ${horaFormatada}. Nos vemos lá!`;
    } else {
      mensagemText = `Olá ${lead.nome}! Sua reunião (${meeting.titulo}) foi confirmada para ${dataFormatada} às ${horaFormatada}. Até breve!`;
    }

    console.log(`Enviando mensagem para ${telefone}: ${mensagemText}`);

    // === INTEGRAÇÃO COM A API DO WHATSAPP ===
    // Exemplo usando uma API genérica (ajuste de acordo com o provedor escolhido):
    if (WHATSAPP_API_URL && WHATSAPP_API_TOKEN) {
      const response = await fetch(WHATSAPP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify({
          number: telefone,
          text: mensagemText
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API do WhatsApp: ${errorText}`);
      }
    } else {
      console.log("ATENÇÃO: Variáveis WHATSAPP_API_URL ou WHATSAPP_API_TOKEN não configuradas. Mensagem não enviada de verdade (modo simulação).");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Processo de notificação concluído." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
