import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Check, Building2, MapPin, Mail, Phone, CalendarDays } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { VenuxLogo } from "@/components/venux-logo";

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
        supabase.from('diagnosticos').select('*').eq('id', id).maybeSingle(),
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
              <VenuxLogo className="w-12 h-12" />
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

          {/* Introdução */}
          <section className="mb-10">
            <p className="text-slate-600 leading-relaxed text-sm mb-4">
              Agradecemos a oportunidade de apresentar nossa proposta comercial. Oferecemos uma plataforma completa de gestão, desenvolvida especialmente para o setor citrícola, com foco em eficiência operacional, controle financeiro e crescimento sustentável do seu negócio.
            </p>
            <p className="text-slate-600 leading-relaxed text-sm">
              Mais do que um sistema, oferecemos uma parceria comprometida com o sucesso da <strong>{diagnostico.razao_social || diagnostico.lead_nome || 'sua empresa'}</strong>.
            </p>
          </section>

          {/* Conhecimento do Negócio */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-indigo-950 mb-4">1. Conhecimento do Negócio</h2>
            <p className="text-slate-600 leading-relaxed text-sm mb-4">
              O setor citrícola exige controle rigoroso de pesagem, rastreabilidade de lotes, gestão de fornecedores e conformidade fiscal. Desenvolvemos nossa solução com foco nessas necessidades, garantindo que cada módulo esteja alinhado com a realidade do campo e da operação comercial de citros.
            </p>
          </section>

          {/* Módulos e Funcionalidades */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-indigo-950 mb-4">2. Módulos e Funcionalidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
              
              <div>
                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">I. Entrada de Produtor</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Controle de Entrada de produtor lote semanal</li>
                  <li>Emissão de Vale de entrega</li>
                  <li>Emissão Romaneio de entrega, classificação da fruta</li>
                  <li>Fechamento e pagamento do produtor com desconto do Funrural</li>
                </ul>

                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">II. Vendas e Orçamentos</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Emissão de orçamentos e pedidos de venda</li>
                  <li>Formação de carga e romaneio de entrega</li>
                  <li>Histórico de vendas por cliente e produto</li>
                </ul>

                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">III. Integração com Balança</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Módulo completo de controle de pesagem</li>
                  <li>Controle de compra e venda</li>
                  <li>Fechamento semanal de fornecedores</li>
                  <li>Histórico de movimentações e relatórios detalhados de pesagem</li>
                </ul>
                
                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">IV. Módulos Fiscais</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Emissão de NF-e conforme legislação vigente</li>
                  <li>Arquivamento digital seguro das notas emitidas</li>
                  <li>Fechamento automático dos documentos fiscais para contabilidade</li>
                </ul>
                
                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">V. Cadastro de Clientes e Fornecedores</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Cadastro de pessoa física e jurídica</li>
                  <li>Histórico de compras e preferências do cliente</li>
                  <li>Cadastro de ocorrências por cliente/fornecedor</li>
                  <li>Busca e atualização ágil de informações</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">VI. Entrada de Mercadoria Automática</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Importação automática de notas fiscais de entrada (XML)</li>
                  <li>Cadastro simplificado de produtos e fornecedores</li>
                  <li>Cálculo automático de impostos e tributos na entrada</li>
                </ul>

                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">VII. Financeiro</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Controle completo do fluxo de caixa</li>
                  <li>Contas a pagar e a receber com alertas de vencimento</li>
                  <li>Conciliação bancária</li>
                  <li>Controle de cheques (emitidos e recebidos)</li>
                  <li>Geração de boletos bancários</li>
                  <li>Múltiplos relatórios financeiros</li>
                </ul>
                
                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">VIII. Relatórios Analíticos</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>DRE – Demonstrativo de Resultado do Exercício</li>
                  <li>Fluxo de Caixa: entradas e saídas diárias, semanais e mensais</li>
                  <li>Contas a Receber e Pagar em aberto</li>
                  <li>Faturamento por cliente e por produto</li>
                  <li>Comparativo mensal e Relatório de inadimplência</li>
                </ul>

                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">IX. Telas Simples e Práticas</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Interface intuitiva, organizada e de fácil aprendizado</li>
                  <li>Navegação eficiente entre módulos</li>
                  <li>Personalização de dashboards conforme necessidade da operação</li>
                </ul>
              </div>

            </div>
          </section>

          {/* Investimento */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-indigo-950 mb-4">3. Investimento</h2>
            
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left pb-2 font-semibold text-slate-700">Descrição do Item</th>
                  <th className="text-center pb-2 font-semibold text-slate-700">Condição</th>
                  <th className="text-right pb-2 font-semibold text-slate-700">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {isManual && manualSetup > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-3 text-slate-600">Taxa de Adesão / Setup de Ambiente</td>
                    <td className="py-3 text-center text-slate-600">Única</td>
                    <td className="py-3 text-right text-slate-800 font-medium">
                      R$ {manualSetup.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                )}
                {!isManual && setupModulos > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-3 text-slate-600">Taxa de Adesão / Setup de Ambiente (Módulos Extra)</td>
                    <td className="py-3 text-center text-slate-600">Única</td>
                    <td className="py-3 text-right text-slate-800 font-medium">
                      R$ {setupModulos.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-slate-100">
                  <td className="py-3 text-slate-600">
                    Plano Professional: Mensalidade (suporte, atualizações e hospedagem)
                    {!isManual && desconto > 0 && <span className="block text-emerald-600 text-xs mt-1">Inclui Desconto Comercial Especial</span>}
                  </td>
                  <td className="py-3 text-center text-slate-600">Recorrente</td>
                  <td className="py-3 text-right text-slate-800 font-medium">
                    {!isManual && desconto > 0 && <span className="line-through text-slate-400 text-xs block">R$ {valorTotal.toFixed(2).replace('.', ',')}</span>}
                    R$ {valorFinal.toFixed(2).replace('.', ',')} / mês
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="text-xs text-slate-500 mb-6">* A implantação inclui 30 dias de acompanhamento técnico dedicado, sem custo adicional.</p>
            
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

          {/* Etapas de Implantação */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-indigo-950 mb-4">4. Etapas de Implantação</h2>
            <div className="space-y-4 text-sm text-slate-600">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Análise de Necessidades</h3>
                <p className="ml-6">Levantamento detalhado dos processos da empresa. Mapeamos cada etapa da operação para garantir que o sistema atenda 100% à sua realidade.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Customização</h3>
                <p className="ml-6">Adequação do sistema às particularidades do negócio. Configuramos módulos, relatórios e parâmetros conforme o seu fluxo de trabalho.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Treinamento</h3>
                <p className="ml-6">Capacitação completa da equipe para uso do sistema. Treinamento presencial ou remoto, no ritmo da sua equipe.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Suporte Pós-Implantação</h3>
                <p className="ml-6">Acompanhamento contínuo após a entrada em produção. Canal direto de suporte via WhatsApp e telefone durante todo o período de contrato.</p>
              </div>
            </div>
          </section>

          {/* Benefícios Adicionais */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-indigo-950 mb-4">5. Benefícios Adicionais</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> <strong>Atualizações regulares inclusas:</strong> sistema sempre atualizado com as melhores práticas e novas legislações.</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> <strong>Segurança de dados:</strong> tecnologia robusta para proteção e integridade das informações.</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> <strong>Escalabilidade:</strong> solução preparada para crescer junto com sua empresa.</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> <strong>Foco no setor citrícola:</strong> desenvolvido por quem conhece a realidade da citricultura.</li>
            </ul>
            <p className="text-sm text-slate-600 mt-6 font-medium">
              Estamos à disposição para discutir esta proposta e personalizar a solução conforme suas necessidades.
            </p>
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

