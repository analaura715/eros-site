import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Check, Building2, MapPin, Mail, Phone, CalendarDays } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute('/_comercial/proposta/$id')({
  component: PropostaDocumento,
});

function PropostaDocumento() {
  const { id } = Route.useParams();
  const search: any = Route.useSearch();
  const desconto = Number(search.desconto) || 0;
  
  const isManual = search.isManual === 'true';
  const manualMensalidade = Number(search.mensalidade) || 0;
  
  // Custom Overrides from Avulso Form
  const urlPlanoNome = search.plano_nome || 'Plano Professional';
  const urlPlanoValor = Number(search.plano_valor) || 0;
  const urlDesconto = Number(search.desconto) || 0;
  const urlSetup = Number(search.setup) || 0;
  
  const manualSetup = urlSetup > 0 ? urlSetup : (Number(search.setup) || 0);
  const nomeAvulso = search.nome || 'Empresa (Orçamento Avulso)';
  
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [catalogoModulos, setCatalogoModulos] = useState<any[]>([]);
  const [configOrcamento, setConfigOrcamento] = useState<any>(null);
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
      const [diagRes, modulosRes, configRes] = await Promise.all([
        supabase.from('diagnosticos').select('*').eq('id', id).maybeSingle(),
        supabase.from('catalogo_modulos').select('*'),
        supabase.from('configuracoes_orcamento').select('*').limit(1).maybeSingle()
      ]);
      
      if (diagRes.data) {
        setDiagnostico(diagRes.data);
      }
      if (modulosRes.data) {
        setCatalogoModulos(modulosRes.data);
      }
      if (configRes.data) {
        setConfigOrcamento(configRes.data);
      }
      setLoading(false);
    };
    fetchDiagnostico();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Gerando documento de proposta...</div>;
  if (!diagnostico) return <div className="p-8 text-center text-red-500">Diagnóstico não encontrado.</div>;

  // Lógica Simplificada: Utiliza os valores repassados pela URL (calculados pelos motores)
  let valorTotal = isManual ? (Number(search.plano_valor) || Number(search.mensalidade) || 0) : 0;
  let valorTotalSetup = 0; // isManual ? (Number(search.setup) || 0) : 0; // FORÇADO ZERO POR ENQUANTO
  let descontoBase = isManual ? (Number(search.desconto) || 0) : 0;
  let descontoSetup = 0; // isManual ? (Number(search.desconto_setup) || 0) : 0;

  let valorFinal = Math.max(0, valorTotal - descontoBase);
  let valorSetupExibicao = 0; // Math.max(0, valorTotalSetup - descontoSetup);

  const modulosSelecionados = diagnostico?.modulos_selecionados || [];
  const modulos = catalogoModulos.filter(m => modulosSelecionados.includes(m.id));

  const handlePrint = () => {
    window.print();
  };

  const voltarUrl = id === 'avulso' ? '/diagnosticos' : '/diagnosticos';

  const textos = configOrcamento?.formulario_builder?.textos_proposta || {};
  
  const textoIntroducao = textos.introducao || "Agradecemos a oportunidade de apresentar nossa proposta comercial. Oferecemos uma plataforma completa de gestão, desenvolvida especialmente para o setor citrícola, com foco em eficiência operacional, controle financeiro e crescimento sustentável do seu negócio.\n\nMais do que um sistema, oferecemos uma parceria comprometida com o sucesso da **{nome_empresa}**.";
  const textoCenario = textos.conhecimento_negocio || "O setor citrícola exige controle rigoroso de pesagem, rastreabilidade de lotes, gestão de fornecedores e conformidade fiscal. Com base no diagnóstico realizado, desenhamos um ambiente tecnológico perfeitamente dimensionado para a volumetria e as particularidades da sua operação:";
  const textoMensalidade = textos.composicao_mensalidade || "A mensalidade contempla o licenciamento de uso, o acesso a todos os **Módulos Fundamentais** (essenciais para a estruturação básica e fluidez da operação), hospedagem em nuvem de alta performance, rotinas automáticas de backup, atualizações contínuas (melhorias e conformidade legal) e **suporte técnico e manutenção** ativos.";
  const textoSetup = textos.sobre_implantacao || "A Taxa de Implantação é um investimento único referente aos serviços de onboarding, que englobam o setup inicial da infraestrutura, configuração e parametrização do ambiente, modelagem dos fluxos operacionais mapeados e o treinamento robusto da sua equipe para uso pleno do ERP.";

  // Helper para renderizar negrito com asteriscos e substituir variáveis
  const renderText = (text: string, nomeEmpresa?: string, isDarkTheme = false) => {
    let t = text;
    if (nomeEmpresa) {
      t = t.replace('{nome_empresa}', nomeEmpresa);
    }
    // simple bold replace
    const parts = t.split(/\*\*(.*?)\*\*/g);
    return (
      <>
        {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className={isDarkTheme ? "text-slate-200 font-bold" : "text-slate-800 font-bold"}>{part}</strong> : part)}
      </>
    );
  };


  return (
    <div className="min-h-screen bg-slate-200 py-8 print:py-0 print:bg-white font-sans">
      <style type="text/css" media="print">
        {`
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        `}
      </style>
      
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
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none print:mx-0 overflow-visible relative text-slate-800 pb-0 flex flex-col">
        
        {/* Omitida a barra roxa para manter um visual de papel timbrado limpo */}

        {/* Usando tabela para forçar margens de impressão em todas as páginas */}
        <table className="w-full">
          <thead className="print:table-header-group">
            <tr><td><div className="h-[15mm]"></div></td></tr>
          </thead>
          <tbody className="print:table-row-group">
            <tr>
              <td>
                <div className="p-12 print:p-8 print:pt-0">
          
          {/* Cabeçalho */}
          <header className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Eros Sistemas" className="h-24 w-auto object-contain mix-blend-multiply brightness-[1.15] contrast-[1.3]" />
            </div>
            
            <div className="text-right text-base font-bold text-slate-800 space-y-1">
              <p>Proposta Comercial ERP</p>
              <p>Data: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              <p>Validade: 7 dias</p>
            </div>
          </header>

          {/* Dados do Cliente */}
          <section className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-100 print:break-inside-avoid">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 mb-3 border-b border-indigo-100 pb-2">Preparado Especialmente Para</h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 mb-0.5">Empresa</p>
                <p className="font-bold text-slate-900 text-sm">{diagnostico.razao_social || diagnostico.lead_nome}</p>
                {diagnostico.cnpj && <p className="text-slate-600 mt-0.5">CNPJ: {diagnostico.cnpj}</p>}
              </div>
              <div>
                <p className="text-slate-500 mb-1">Localização e Contato</p>
                {diagnostico.cidade_uf && <p className="text-slate-700 flex items-center gap-1"><MapPin className="w-3 h-3"/> {diagnostico.cidade_uf}</p>}
                {diagnostico.telefone_whatsapp && <p className="text-slate-700 flex items-center gap-1"><Phone className="w-3 h-3"/> {diagnostico.telefone_whatsapp}</p>}
              </div>
            </div>
          </section>

          {/* Introdução */}
          <section className="mb-10 print:break-inside-avoid">
            {textoIntroducao.split('\n').map((paragraph: string, i: number) => (
              <p key={i} className="text-slate-600 leading-relaxed text-sm mb-4">
                {renderText(paragraph, diagnostico.razao_social || diagnostico.lead_nome || 'sua empresa')}
              </p>
            ))}
          </section>

          {/* Conhecimento do Negócio e Cenário */}
          <section className="mb-10">
            <h2 className="text-lg font-bold uppercase tracking-wide text-indigo-950 mb-4">1. Escopo e Cenário Mapeado</h2>
            <p className="text-slate-600 leading-relaxed text-sm mb-6">
              {renderText(textoCenario)}
            </p>
          </section>

          {/* Módulos e Funcionalidades */}
          <section className="mb-10">
            <h2 className="text-lg font-bold uppercase tracking-wide text-indigo-950 mb-4 print:break-after-avoid">2. Módulos e Funcionalidades</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
              
              <div>
                {modulos.some((m: any) => m.nome.toUpperCase().includes('ENTRADA DE PRODUTOR')) && (
                  <>
                    <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Entrada de Produtor</h3>
                    <ul className="list-disc pl-5 space-y-1 mb-4">
                      <li>Controle de Entrada de produtor lote semanal</li>
                      <li>Emissão de Vale de entrega</li>
                      <li>Emissão Romaneio de entrega, classificação da fruta</li>
                      <li>Fechamento e pagamento do produtor com desconto do Funrural</li>
                    </ul>
                  </>
                )}

                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Vendas e Orçamentos</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Emissão de orçamentos e pedidos de venda</li>
                  <li>Formação de carga e romaneio de entrega</li>
                  <li>Histórico de vendas por cliente e produto</li>
                </ul>


                
                {modulos.some((m: any) => m.nome.toUpperCase().includes('NOTA FISCAL') || m.nome.toUpperCase().includes('MDFE')) && (
                  <>
                    <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Módulos Fiscais</h3>
                    <ul className="list-disc pl-5 space-y-1 mb-4">
                      <li>Emissão de NF-e conforme legislação vigente</li>
                      <li>Arquivamento digital seguro das notas emitidas</li>
                      <li>Fechamento automático dos documentos fiscais para contabilidade</li>
                    </ul>
                  </>
                )}
                
                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Cadastro de Clientes e Fornecedores</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Cadastro de pessoa física e jurídica</li>
                  <li>Histórico de compras e preferências do cliente</li>
                  <li>Cadastro de ocorrências por cliente/fornecedor</li>
                  <li>Busca e atualização ágil de informações</li>
                </ul>
              </div>

              <div>
                {(diagnostico.precisa_importar_dados === 'Sim' || modulos.some((m: any) => m.nome.toUpperCase().includes('ENTRADA DE PRODUTOR'))) && (
                  <>
                    <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Entrada de Mercadoria Automática</h3>
                    <ul className="list-disc pl-5 space-y-1 mb-4">
                      <li>Importação automática de notas fiscais de entrada (XML)</li>
                      <li>Cadastro simplificado de produtos e fornecedores</li>
                      <li>Cálculo automático de impostos e tributos na entrada</li>
                    </ul>
                  </>
                )}

                {modulos.some((m: any) => ['FINANCEIRO GERAL', 'CONTAS A PAGAR', 'CONTAS A RECEBER', 'CONCILIAÇÃO BANCARIA', 'GERAÇÃO DE BOLETO'].includes(m.nome.toUpperCase())) && (
                  <>
                    <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Financeiro</h3>
                    <ul className="list-disc pl-5 space-y-1 mb-4">
                      <li>Controle completo do fluxo de caixa</li>
                      <li>Contas a pagar e a receber com alertas de vencimento</li>
                      <li>Conciliação bancária</li>
                      <li>Controle de cheques (emitidos e recebidos)</li>
                      <li>Geração de boletos bancários</li>
                      <li>Múltiplos relatórios financeiros</li>
                    </ul>
                  </>
                )}
                
                {modulos.some((m: any) => m.nome.toUpperCase().includes('RELATORIO')) && (
                  <>
                    <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Relatórios Analíticos</h3>
                    <ul className="list-disc pl-5 space-y-1 mb-4">
                      <li>DRE – Demonstrativo de Resultado do Exercício</li>
                      <li>Fluxo de Caixa: entradas e saídas diárias, semanais e mensais</li>
                      <li>Contas a Receber e Pagar em aberto</li>
                      <li>Faturamento por cliente e por produto</li>
                      <li>Comparativo mensal e Relatório de inadimplência</li>
                    </ul>
                  </>
                )}

                <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Telas Simples e Práticas</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Interface intuitiva, organizada e de fácil aprendizado</li>
                  <li>Navegação eficiente entre módulos</li>
                  <li>Personalização de dashboards conforme necessidade da operação</li>
                </ul>
              </div>

            </div>
          </section>

          {/* Investimento */}
          <section className="mb-10 print:break-inside-avoid">
            <h2 className="text-lg font-bold uppercase tracking-wide text-indigo-950 mb-4">3. Investimento</h2>
            
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left pb-2 font-semibold text-slate-700">Descrição do Item</th>
                  <th className="text-center pb-2 font-semibold text-slate-700">Condição</th>
                  <th className="text-right pb-2 font-semibold text-slate-700">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {urlPlanoValor > 0 ? (
                  <>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 text-slate-600 font-medium text-lg">
                        {urlPlanoNome}: Mensalidade (suporte, atualizações e hospedagem)
                      </td>
                      <td className="py-3 text-center text-slate-600">Recorrente</td>
                      <td className="py-3 text-right text-slate-800 font-bold text-lg">
                        R$ {urlPlanoValor.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                    {urlDesconto > 0 && (
                      <tr className="border-b border-slate-100 bg-emerald-50/50">
                        <td className="py-3 text-emerald-700 font-medium pl-4">
                          Desconto Especial Aplicado
                        </td>
                        <td className="py-3 text-center text-emerald-700">Mensal</td>
                        <td className="py-3 text-right text-emerald-700 font-medium">
                          - R$ {urlDesconto.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    )}
                    {valorSetupExibicao > 0 && (
                      <tr className="border-b border-slate-100">
                        <td className="py-3 text-slate-600 pl-4">Taxa de Implantação</td>
                        <td className="py-3 text-center text-slate-600">Única</td>
                        <td className="py-3 text-right text-slate-800 font-medium">
                          R$ {valorSetupExibicao.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    )}
                  </>
                ) : (
                  <>
                    {valorTotalSetup > 0 && (
                      <tr className="border-b border-slate-100">
                        <td className="py-3 text-slate-600">
                          Taxa de Adesão / Setup de Ambiente
                          {descontoSetup > 0 && <span className="block text-emerald-600 text-xs mt-1">Inclui Desconto (R$ {descontoSetup.toFixed(2).replace('.', ',')})</span>}
                        </td>
                        <td className="py-3 text-center text-slate-600">Única</td>
                        <td className="py-3 text-right text-slate-800 font-medium">
                          {descontoSetup > 0 && <span className="line-through text-slate-400 text-xs block">R$ {valorTotalSetup.toFixed(2).replace('.', ',')}</span>}
                          R$ {valorSetupExibicao.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    )}

                    <tr className="border-b border-slate-100">
                      <td className="py-3 text-slate-600">
                        Plano Professional: Mensalidade (suporte, atualizações e hospedagem)
                        {descontoBase > 0 && <span className="block text-emerald-600 text-xs mt-1">Inclui Desconto Comercial Especial (R$ {descontoBase.toFixed(2).replace('.', ',')})</span>}
                      </td>
                      <td className="py-3 text-center text-slate-600">Recorrente</td>
                      <td className="py-3 text-right text-slate-800 font-medium">
                        {descontoBase > 0 && <span className="line-through text-slate-400 text-xs block">R$ {valorTotal.toFixed(2).replace('.', ',')}</span>}
                        R$ {valorFinal.toFixed(2).replace('.', ',')} / mês
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
              <div className="bg-slate-800 text-white p-6 rounded-lg flex justify-center items-center print:border print:border-slate-800 mt-6">
                <div className="text-center">
                  <p className="text-slate-300 text-xs uppercase tracking-wider font-bold mb-1">Mensalidade Final</p>
                  <p className="text-3xl font-black text-emerald-400">
                    R$ {valorFinal.toFixed(2).replace('.', ',')} <span className="text-sm font-normal text-slate-400">/mês</span>
                  </p>
                </div>
                {valorSetupExibicao > 0 && (
                  <div className="border-l border-slate-600 pl-10 ml-10 text-center">
                    <p className="text-slate-300 text-xs uppercase tracking-wider font-bold mb-1">Implantação Única</p>
                    <p className="text-3xl font-black text-white">
                      R$ {valorSetupExibicao.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                )}
              </div>
              {valorSetupExibicao > 0 && (
                <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-100">
                  {textoSetup.split('\n').map((paragraph: string, i: number) => (
                    <span key={i} className="block mb-1 last:mb-0">
                      {renderText(paragraph)}
                    </span>
                  ))}
                </div>
              )}
          </section>

          {/* Etapas de Implantação */}
          <section className="mb-10 print:break-inside-avoid">
            <h2 className="text-lg font-bold uppercase tracking-wide text-indigo-950 mb-4">4. Etapas de Implantação</h2>
            <div className="space-y-4 text-sm text-slate-600">
              <div>
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Análise de Necessidades</h3>
                <p className="ml-6">Levantamento detalhado dos processos da empresa. Mapeamos cada etapa da operação para garantir que o sistema atenda 100% à sua realidade.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Customização</h3>
                <p className="ml-6">Adequação do sistema às particularidades do negócio. Configuramos módulos, relatórios e parâmetros conforme o seu fluxo de trabalho.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Treinamento</h3>
                <p className="ml-6">Capacitação completa da equipe para uso do sistema. Treinamento presencial ou remoto, no ritmo da sua equipe.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Suporte Pós-Implantação</h3>
                <p className="ml-6">Acompanhamento contínuo após a entrada em produção. Canal direto de suporte via WhatsApp e telefone durante todo o período de contrato.</p>
              </div>
            </div>
          </section>

          {/* Benefícios Adicionais */}
          <section className="mb-10 print:break-inside-avoid">
            <h2 className="text-lg font-bold uppercase tracking-wide text-indigo-950 mb-4">5. Benefícios Adicionais</h2>
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

          {/* Omitida a seção de assinaturas */}

                </div>
              </td>
            </tr>
          </tbody>
          <tfoot className="print:table-footer-group">
            <tr><td><div className="h-[35mm]"></div></td></tr>
          </tfoot>
        </table>

        {/* Rodapé Eros fixo na impressão */}
        <footer className="print:fixed print:bottom-0 print:left-0 w-full bg-emerald-600 text-emerald-50 py-6 px-12 text-sm flex justify-between items-center mt-auto">
          <div className="space-y-1">
            <p className="font-bold text-white uppercase tracking-wide">EROS SISTEMAS</p>
            <p className="opacity-90 text-xs">CNPJ: 27.303.431/0001-83</p>
          </div>
          <div className="text-right space-y-1">
            <p className="font-medium text-white">contato@erossistemas.com.br</p>
            <p className="opacity-90 text-xs">www.erossistemas.com.br</p>
          </div>
        </footer>

      </div>
    </div>
  );
}

