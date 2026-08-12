import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Check, Building2, MapPin, Mail, Phone, CalendarDays } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NexaLogo } from "@/components/nexa-logo";

export const Route = createFileRoute('/_comercial/proposta/$id')({
  component: PropostaDocumento,
});

function PropostaDocumento() {
  const { id } = Route.useParams();
  const search: any = Route.useSearch();
  const desconto = Number(search.desconto) || 0;
  
  const isManual = search.isManual === 'true';
  const manualMensalidade = Number(search.mensalidade) || 0;
  const manualSetup = Number(search.setup) || 0;
  const nomeAvulso = search.nome || 'Empresa (Orçamento Avulso)';
  
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [catalogoModulos, setCatalogoModulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiagnostico = async () => {
      if (id === 'avulso') {
        setDiagnostico({
          razao_social: nomeAvulso,
          principal_gargalo: 'a necessidade de otimização e controle profissional',
          o_que_mais_incomoda: 'processos manuais e descentralizados',
          processos_manuais: 'planilhas diversas',
          cidade_uf: 'Brasil',
          telefone_whatsapp: '-'
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      const [diagRes, modulosRes] = await Promise.all([
        supabase.from('diagnosticos').select('*').eq('id', id).single(),
        supabase.from('catalogo_modulos').select('*')
      ]);
      
      if (diagRes.data) {
        setDiagnostico(diagRes.data);
      }
      if (modulosRes.data) {
        setCatalogoModulos(modulosRes.data);
      }
      setLoading(false);
    };
    fetchDiagnostico();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Gerando documento de proposta...</div>;
  if (!diagnostico) return <div className="p-8 text-center text-red-500">Diagnóstico não encontrado.</div>;

  // Cálculos do Orçamento - Novas Regras
  let baseCalculo = 1000;
  
  let qtdCnpj = diagnostico.qtd_cnpj ? Number(diagnostico.qtd_cnpj) : 1;
  let precoCnpj = qtdCnpj * 50;

  let volumeNotas = diagnostico.volume_mensal_notas ? Number(diagnostico.volume_mensal_notas) : 0;
  let precoNotas = Math.floor(volumeNotas / 30) * 50;

  let precoVendaExterna = (diagnostico.venda_interna_externa === 'Fora do Estado' || diagnostico.venda_interna_externa === 'Ambos') ? 50 : 0;

  let qtdBancos = diagnostico.qtd_bancos_boleto ? Number(diagnostico.qtd_bancos_boleto) : 0;
  let precoBoletos = qtdBancos * 50;

  let faturamento = diagnostico.faturamento_medio_mensal ? Number(diagnostico.faturamento_medio_mensal.replace(/\D/g, '')) : 0;
  let precoFaturamento = Math.floor(faturamento / 50000) * 100;

  let precoBalanca = diagnostico.possui_balanca_rodoviaria === 'Sim' ? 100 : 0;

  let qtdUsuarios = diagnostico.qtd_usuarios_previstos ? Number(String(diagnostico.qtd_usuarios_previstos).replace(/\D/g, '')) : 0;
  let precoUsuarios = qtdUsuarios * 20;

  let precoImportacao = diagnostico.precisa_importar_dados === 'Sim' ? 200 : 0;

  let gastoFrutas = diagnostico.gasto_mensal_compra_frutas ? Number(String(diagnostico.gasto_mensal_compra_frutas).replace(/\D/g, '')) : 0;
  let precoFrutas = Math.floor(gastoFrutas / 50000) * 50;

  let precoExportacao = (diagnostico.tipo_mercado === 'Exportação' || diagnostico.tipo_mercado === 'Ambos') ? 150 : 0;

  // Módulos dinâmicos
  let selecionadosIds = diagnostico.modulos_selecionados || [];
  let modulos = catalogoModulos.filter(m => selecionadosIds.includes(m.id));
  
  let precoModulos = modulos.reduce((acc, curr) => acc + (curr.preco_mensalidade || 0), 0);
  let setupModulos = modulos.reduce((acc, curr) => acc + (curr.preco_setup || 0), 0);
  
  let valorTotal = baseCalculo + precoCnpj + precoNotas + precoVendaExterna + precoBoletos + precoFaturamento + precoBalanca + precoUsuarios + precoImportacao + precoFrutas + precoExportacao + precoModulos;
  
  let valorFinal = Math.max(0, valorTotal - desconto);
  if (isManual) {
    valorFinal = manualMensalidade;
  }

  const handlePrint = () => {
    window.print();
  };

  const voltarUrl = id === 'avulso' ? '/diagnosticos' : '/diagnosticos';

  return (
    <div className="min-h-screen bg-slate-200 py-8 print:py-0 print:bg-white font-sans">
      
      {/* Controles apenas na tela */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden px-4">
        <Button variant="outline" onClick={() => history.back()} className="bg-white hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
          <Printer className="w-4 h-4 mr-2" />
          Gerar PDF / Imprimir
        </Button>
      </div>

      {/* Página A4 */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none print:mx-0 overflow-hidden relative text-slate-800">
        
        {/* Barra superior de destaque */}
        <div className="h-2 w-full bg-indigo-600"></div>

        <div className="p-12">
          
          {/* Cabeçalho */}
          <header className="flex justify-between items-start mb-12 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-3">
              <NexaLogo className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-black text-indigo-950 tracking-tight leading-none">EROS</h1>
                <p className="text-indigo-600 font-semibold text-sm tracking-widest mt-1">SISTEMAS</p>
              </div>
            </div>
            
            <div className="text-right text-sm text-slate-500 space-y-1">
              <p className="font-bold text-slate-800">Proposta Comercial ERP</p>
              <p>Data: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              <p>Validade: 7 dias</p>
            </div>
          </header>

          {/* Dados do Cliente */}
          <section className="mb-10 bg-slate-50 p-6 rounded-lg border border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-800 mb-4 border-b border-indigo-100 pb-2">Preparado Especialmente Para</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Empresa</p>
                <p className="font-semibold text-slate-900 text-lg">{diagnostico.razao_social || diagnostico.lead_nome}</p>
                {diagnostico.cnpj && <p className="text-slate-600">CNPJ: {diagnostico.cnpj}</p>}
              </div>
              <div>
                <p className="text-slate-500 mb-1">Localização e Contato</p>
                {diagnostico.cidade_uf && <p className="text-slate-700 flex items-center gap-1"><MapPin className="w-3 h-3"/> {diagnostico.cidade_uf}</p>}
                {diagnostico.telefone_whatsapp && <p className="text-slate-700 flex items-center gap-1"><Phone className="w-3 h-3"/> {diagnostico.telefone_whatsapp}</p>}
              </div>
            </div>
          </section>

          {/* Entendimento da Dor */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-indigo-950 mb-4">1. Entendimento do Cenário Atual</h2>
            <p className="text-slate-600 leading-relaxed text-sm mb-4">
              Agradecemos a oportunidade de apresentar o <strong>EROS</strong> para a sua operação. Analisando o diagnóstico preenchido, identificamos que o principal gargalo atual é <strong>"{diagnostico.principal_gargalo || 'a necessidade de otimização de processos'}"</strong>, agravado por problemas como <strong>"{diagnostico.o_que_mais_incomoda || 'falta de integração'}"</strong>.
            </p>
            <p className="text-slate-600 leading-relaxed text-sm">
              Nossa solução foi desenhada exatamente para mitigar processos manuais (como <em>{diagnostico.processos_manuais || 'controles paralelos'}</em>) e unificar toda a gestão em uma única plataforma robusta, rápida e segura.
            </p>
          </section>

          {/* Escopo da Solução */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-indigo-950 mb-4">2. Escopo da Solução Proposta</h2>
            
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm mb-3 uppercase tracking-wider">Infraestrutura e Acessos</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Licença para {qtdUsuarios || 1} usuários</li>
                  {diagnostico.qtd_cnpj && Number(diagnostico.qtd_cnpj) > 1 && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Atendimento Multi-Empresa ({diagnostico.qtd_cnpj} filiais)</li>}
                  {precoVendaExterna > 0 && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Módulo de Venda Interestadual (Fora do Estado)</li>}
                  {precoExportacao > 0 && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Adequação para Exportação de Produtos</li>}
                  {qtdBancos > 0 && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Homologação de Boletos ({qtdBancos} Bancos)</li>}
                  {diagnostico.possui_balanca_rodoviaria === 'Sim' && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Integração com Balança Rodoviária</li>}
                  {diagnostico.precisa_importar_dados === 'Sim' && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Importação de Dados do sistema legado</li>}
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Hospedagem em Nuvem Segura</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Backup Diário Automático</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 text-sm mb-3 uppercase tracking-wider">Módulos Inclusos</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  {id === 'avulso' ? (
                    <>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Todos os Módulos Base</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Módulos Financeiros</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Painel Gestor</li>
                    </>
                  ) : modulos.length > 0 ? modulos.map((m: any, i: number) => (
                    <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {m.nome}</li>
                  )) : (
                    <li className="text-slate-400 italic">Nenhum módulo extra selecionado.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Implantação e Treinamento */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-indigo-950 mb-4">3. Implantação e Treinamento</h2>
            <div className="bg-indigo-50/50 p-5 rounded-lg border border-indigo-100 flex gap-4">
              <CalendarDays className="w-8 h-8 text-indigo-500 shrink-0" />
              <div>
                <h3 className="font-bold text-indigo-900 text-sm mb-1">Garantia de Sucesso do Cliente</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Nossa equipe técnica realizará o setup completo do ambiente. Estão inclusas <strong>10 horas de treinamento remoto</strong> focado na realidade da sua equipe, além de acompanhamento nos primeiros dias de operação para garantir uma transição suave. O suporte técnico contínuo ocorre em horário comercial via plataforma dedicada.
                </p>
              </div>
            </div>
          </section>

          {/* Investimento */}
          <section className="mb-12">
            <h2 className="text-lg font-bold text-indigo-950 mb-4">4. Investimento</h2>
            
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left pb-2 font-semibold text-slate-700">Descrição do Item</th>
                  <th className="text-right pb-2 font-semibold text-slate-700">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 text-slate-600">Taxa de Adesão / Setup de Ambiente</td>
                  <td className="py-3 text-right text-slate-800 font-medium">
                    {isManual && manualSetup > 0 ? `R$ ${manualSetup.toFixed(2).replace('.', ',')}` : (!isManual && setupModulos > 0 ? `R$ ${setupModulos.toFixed(2).replace('.', ',')}` : 'Isento')}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 text-slate-600">Treinamento Inicial (10 horas)</td>
                  <td className="py-3 text-right text-slate-800 font-medium">Incluso</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 text-slate-600">
                    Mensalidade de Licenciamento, Hospedagem e Suporte
                    {!isManual && desconto > 0 && <span className="block text-emerald-600 text-xs mt-1">Inclui Desconto Comercial Especial</span>}
                  </td>
                  <td className="py-3 text-right text-slate-800 font-medium">
                    {!isManual && desconto > 0 && <span className="line-through text-slate-400 text-xs block">R$ {valorTotal.toFixed(2).replace('.', ',')}</span>}
                    R$ {valorFinal.toFixed(2).replace('.', ',')} / mês
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div className="bg-slate-800 text-white p-6 rounded-lg flex justify-between items-center print:border print:border-slate-800">
              <div>
                <p className="text-slate-300 text-xs uppercase tracking-widest font-bold mb-1">Total do Investimento Mensal</p>
                <p className="text-3xl font-black">R$ {valorFinal.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="text-right text-sm text-slate-300">
                <p>Pagamento via Boleto Bancário ou PIX.</p>
                <p>Reajuste anual pelo IGPM.</p>
              </div>
            </div>
          </section>

          {/* Assinaturas */}
          <section className="mt-20 flex justify-between gap-12">
            <div className="flex-1 text-center">
              <div className="border-t border-slate-400 pt-3">
                <p className="font-bold text-slate-800 text-sm">Equipe EROS</p>
                <p className="text-slate-500 text-xs mt-1">CNPJ: 00.000.000/0000-00</p>
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="border-t border-slate-400 pt-3">
                <p className="font-bold text-slate-800 text-sm">De Acordo ({diagnostico.razao_social || diagnostico.lead_nome})</p>
                <p className="text-slate-500 text-xs mt-1">Assinatura do Responsável</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
