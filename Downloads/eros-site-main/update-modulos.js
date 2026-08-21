import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ejlcknlgvnfqynlhovlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqbGNrbmxndm5mcXlubGhvdmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMzI5MjYsImV4cCI6MjEwMDgwODkyNn0.1_u7QcIxgIcPUNRIN3mawQ_W1VCLuCB2LqYcricQGgI';
const supabase = createClient(supabaseUrl, supabaseKey);

const novosModulos = [
  { nome: 'PESAGEM DA BALANÇA', categoria: 'Operacional', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'CLASSIFICAÇÃO DA FRUTA', categoria: 'Operacional', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'ENTRADA DE PRODUTOR', categoria: 'Operacional', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'EMISSÃO DE NOTA FISCAL', categoria: 'Operacional', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'EMISSÃO DE MDFE E CTE', categoria: 'Operacional', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'ETIQUETAS/EMBALADEIRAS', categoria: 'Operacional', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'GERAÇÃO DE BOLETO', categoria: 'Financeiro', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'CONTAS A PAGAR', categoria: 'Financeiro', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'CONTAS A RECEBER', categoria: 'Financeiro', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'FINANCEIRO GERAL', categoria: 'Financeiro', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'CONCILIAÇÃO BANCARIA', categoria: 'Financeiro', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'PAINEL DE RELATORIOS', categoria: 'Financeiro', preco_setup: 0, preco_mensalidade: 0, ativo: true },
  { nome: 'IMPRESSÃO DE CHEQUES', categoria: 'Financeiro', preco_setup: 0, preco_mensalidade: 0, ativo: true }
];

async function run() {
  console.log('Fetching old modules...');
  const { data: currentModulos, error: fetchError } = await supabase.from('catalogo_modulos').select('id');
  
  if (fetchError) {
    console.error('Error fetching modules:', fetchError);
    return;
  }
  
  for (const m of currentModulos) {
    await supabase.from('catalogo_modulos').delete().eq('id', m.id);
  }
  console.log('Old modules deleted');
  
  const { error: insertError } = await supabase.from('catalogo_modulos').insert(novosModulos);
  if (insertError) {
    console.error('Error inserting:', insertError);
  } else {
    console.log('New modules inserted successfully!');
  }
}

run();
