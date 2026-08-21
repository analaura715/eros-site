import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Check, MapPin, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { useSuporte } from "@/hooks/useSuporte";
import { Lock } from "lucide-react";

export const Route = createFileRoute('/_comercial/proposta/$id')({
  component: PropostaDocumento,
});

function PropostaDocumento() {
  const { id } = Route.useParams();
  const search: any = Route.useSearch();
  
  const isManual = search.isManual === 'true';
  const urlPlanoNome = search.plano_nome || 'Plano Professional';
  const urlPlanoValor = Number(search.plano_valor) || 0;
  const urlDesconto = Number(search.desconto) || 0;
  const urlSetup = Number(search.setup) || 0;
  const nomeAvulso = search.nome || 'Empresa (Orçamento Avulso)';
  
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [catalogoModulos, setCatalogoModulos] = useState<any[]>([]);
  const [configOrcamento, setConfigOrcamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Snapshots
  const [isFrozen, setIsFrozen] = useState(false);
  const { fetchSnapshot, congelarDiagnostico } = useSuporte();
  const { auth } = useStore();

  useEffect(() => {
    const fetchDados = async () => {
      if (id === 'avulso') {
        setDiagnostico({ razao_social: nomeAvulso, cidade_uf: 'Brasil', telefone_whatsapp: '-' });
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // 1. Tentar carregar Snapshot Congelado
      const snap = await fetchSnapshot(id);
      if (snap) {
        setIsFrozen(true);
        setDiagnostico(snap.payload_estatico.diagnostico);
        setCatalogoModulos(snap.payload_estatico.catalogoModulos);
        setConfigOrcamento(snap.payload_estatico.configOrcamento);
        setLoading(false);
        return;
      }

      // 2. Se não tem snapshot, busca em tempo real
      const [diagRes, modulosRes, configRes] = await Promise.all([
        supabase.from('diagnosticos').select('*').eq('id', id).maybeSingle(),
        supabase.from('catalogo_modulos').select('*'),
        supabase.from('configuracoes_orcamento').select('*').limit(1).maybeSingle()
      ]);
      
      if (diagRes.data) setDiagnostico(diagRes.data);
      if (modulosRes.data) setCatalogoModulos(modulosRes.data);
      if (configRes.data) setConfigOrcamento(configRes.data);
      setLoading(false);
    };
    fetchDados();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Gerando documento de proposta...</div>;
  if (!diagnostico) return <div className="p-8 text-center text-red-500">Diagnóstico não encontrado.</div>;

  const handleCongelar = async () => {
    if (id === 'avulso') {
      toast.error("Orçamentos avulsos não podem ser congelados.");
      return;
    }
    try {
      const payload = { diagnostico, catalogoModulos, configOrcamento, searchParams: search };
      await congelarDiagnostico(id, payload, auth?.name || "Usuário");
      setIsFrozen(true);
      toast.success("Proposta congelada com sucesso! Nenhuma alteração futura afetará este documento.");
    } catch (e) {
      toast.error("Erro ao congelar proposta.");
    }
  };

  const valorTotal = isManual ? (Number(search.plano_valor) || Number(search.mensalidade) || 0) : 0;
  const descontoBase = isManual ? (Number(search.desconto) || 0) : 0;
  const valorFinal = Math.max(0, valorTotal - descontoBase);
  const valorSetupExibicao = 0; // Fixed for now

  const modulosSelecionados = diagnostico?.modulos_selecionados || [];
  const modulos = catalogoModulos.filter(m => modulosSelecionados.includes(m.id));

  const handlePrint = () => {
    window.print();
  };

  const builder = configOrcamento?.formulario_builder || {};
  const textos = builder.textos_proposta || {};
  const templateProposta = builder.template_proposta;
  
  const textoIntroducao = textos.introducao || "Agradecemos a oportunidade de apresentar nossa proposta comercial...";
  const textoCenario = textos.conhecimento_negocio || "O setor exige controle rigoroso...";
  const textoSetup = textos.sobre_implantacao || "A Taxa de Implantação é um investimento único...";

  const parseVariables = (text: string) => {
    let t = text || '';
    t = t.replace(/{{nome_empresa}}/g, diagnostico.razao_social || diagnostico.lead_nome || 'sua empresa');
    t = t.replace(/{{cidade_uf}}/g, diagnostico.cidade_uf || '');
    t = t.replace(/{{cnpj}}/g, diagnostico.cnpj || '');
    t = t.replace(/{{valor_total}}/g, `R$ ${urlPlanoValor.toFixed(2).replace('.', ',')}`);
    t = t.replace(/{{valor_mensalidade}}/g, `R$ ${valorFinal.toFixed(2).replace('.', ',')}`);
    t = t.replace(/{{valor_implantacao}}/g, `R$ ${valorSetupExibicao.toFixed(2).replace('.', ',')}`);
    
    // Bold replacement
    const parts = t.split(/\*\*(.*?)\*\*/g);
    return (
      <>
        {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-slate-800 font-bold">{part}</strong> : part)}
      </>
    );
  };

  // ----- RENDERIZADORES DE BLOCO -----
  
  const renderHeaderBlock = (key: string) => (
    <header key={key} className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Eros Sistemas" className="h-24 w-auto object-contain mix-blend-multiply brightness-[1.15] contrast-[1.3]" />
      </div>
      <div className="text-right text-base font-bold text-slate-800 space-y-1">
        <p>Proposta Comercial ERP</p>
        <p>Data: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        <p>Validade: 7 dias</p>
      </div>
    </header>
  );

  const renderClientDataBlock = (key: string) => (
    <section key={key} className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-100 print:break-inside-avoid">
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
  );

  const renderTextBlock = (key: string, content: string) => (
    <section key={key} className="mb-8 print:break-inside-avoid text-slate-600 leading-relaxed text-sm">
      {content.split('\n').map((paragraph: string, i: number) => (
        <p key={i} className="mb-4 last:mb-0">
          {parseVariables(paragraph)}
        </p>
      ))}
    </section>
  );

  const renderModulesTableBlock = (key: string) => (
    <section key={key} className="mb-10">
      <h2 className="text-lg font-bold uppercase tracking-wide text-indigo-950 mb-4 print:break-after-avoid">Módulos e Funcionalidades</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
        <div>
          {modulos.some((m: any) => m.nome.toUpperCase().includes('ENTRADA DE PRODUTOR')) && (
            <>
              <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Entrada de Produtor</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Controle de Entrada de produtor lote semanal</li>
                <li>Emissão de Vale de entrega e Romaneio</li>
              </ul>
            </>
          )}
          <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Vendas e Orçamentos</h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Emissão de orçamentos e pedidos de venda</li>
            <li>Formação de carga e romaneio de entrega</li>
          </ul>
          {modulos.some((m: any) => m.nome.toUpperCase().includes('NOTA FISCAL') || m.nome.toUpperCase().includes('MDFE')) && (
            <>
              <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Módulos Fiscais</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Emissão de NF-e conforme legislação vigente</li>
                <li>Arquivamento digital seguro</li>
              </ul>
            </>
          )}
        </div>
        <div>
          {modulos.some((m: any) => ['FINANCEIRO GERAL', 'CONTAS A PAGAR', 'CONTAS A RECEBER'].includes(m.nome.toUpperCase())) && (
            <>
              <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Financeiro</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Controle completo do fluxo de caixa</li>
                <li>Contas a pagar e a receber</li>
              </ul>
            </>
          )}
          <h3 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-xs">Telas Simples e Práticas</h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Interface intuitiva, organizada e de fácil aprendizado</li>
          </ul>
        </div>
      </div>
    </section>
  );

  const renderInvestmentTableBlock = (key: string) => (
    <section key={key} className="mb-10 print:break-inside-avoid">
      <h2 className="text-lg font-bold uppercase tracking-wide text-indigo-950 mb-4">Investimento</h2>
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
                <td className="py-3 text-slate-600 font-medium text-lg">{urlPlanoNome}: Mensalidade</td>
                <td className="py-3 text-center text-slate-600">Recorrente</td>
                <td className="py-3 text-right text-slate-800 font-bold text-lg">R$ {urlPlanoValor.toFixed(2).replace('.', ',')}</td>
              </tr>
              {urlDesconto > 0 && (
                <tr className="border-b border-slate-100 bg-emerald-50/50">
                  <td className="py-3 text-emerald-700 font-medium pl-4">Desconto Especial Aplicado</td>
                  <td className="py-3 text-center text-emerald-700">Mensal</td>
                  <td className="py-3 text-right text-emerald-700 font-medium">- R$ {urlDesconto.toFixed(2).replace('.', ',')}</td>
                </tr>
              )}
            </>
          ) : (
            <tr className="border-b border-slate-100">
              <td className="py-3 text-slate-600">Plano Professional: Mensalidade</td>
              <td className="py-3 text-center text-slate-600">Recorrente</td>
              <td className="py-3 text-right text-slate-800 font-medium">R$ {valorFinal.toFixed(2).replace('.', ',')} / mês</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="bg-slate-800 text-white p-6 rounded-lg flex justify-center items-center print:border print:border-slate-800 mt-6">
        <div className="text-center">
          <p className="text-slate-300 text-xs uppercase tracking-wider font-bold mb-1">Mensalidade Final</p>
          <p className="text-3xl font-black text-emerald-400">R$ {valorFinal.toFixed(2).replace('.', ',')} <span className="text-sm font-normal text-slate-400">/mês</span></p>
        </div>
      </div>
    </section>
  );

  const renderStepsBlock = (key: string) => (
    <section key={key} className="mb-10 print:break-inside-avoid">
      <h2 className="text-lg font-bold uppercase tracking-wide text-indigo-950 mb-4">Etapas de Implantação</h2>
      <div className="space-y-4 text-sm text-slate-600">
        <div>
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Análise de Necessidades</h3>
          <p className="ml-6">Levantamento detalhado dos processos da empresa.</p>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Customização</h3>
          <p className="ml-6">Adequação do sistema às particularidades do negócio.</p>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Treinamento</h3>
          <p className="ml-6">Capacitação completa da equipe para uso do sistema.</p>
        </div>
      </div>
    </section>
  );

  const renderBenefitsBlock = (key: string) => (
    <section key={key} className="mb-10 print:break-inside-avoid">
      <h2 className="text-lg font-bold uppercase tracking-wide text-indigo-950 mb-4">Benefícios Adicionais</h2>
      <ul className="space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> <strong>Atualizações regulares inclusas</strong></li>
        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> <strong>Segurança de dados</strong></li>
        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> <strong>Escalabilidade</strong></li>
      </ul>
    </section>
  );

  const renderSignaturesBlock = (key: string) => (
    <section key={key} className="mt-16 pt-8 border-t-2 border-slate-200 print:break-inside-avoid">
      <div className="grid grid-cols-2 gap-12">
        <div className="text-center">
          <div className="border-t border-slate-400 pt-2 font-semibold text-slate-700">Representante Comercial</div>
          <div className="text-sm text-slate-500">Eros Sistemas</div>
        </div>
        <div className="text-center">
          <div className="border-t border-slate-400 pt-2 font-semibold text-slate-700">{diagnostico.razao_social || 'Contratante'}</div>
          <div className="text-sm text-slate-500">Representante Legal</div>
        </div>
      </div>
    </section>
  );

  // Renderizador principal dinâmico
  const renderDynamicTemplate = () => {
    if (!Array.isArray(templateProposta)) return null;
    return templateProposta.map((block: any) => {
      switch (block.type) {
        case 'header': return renderHeaderBlock(block.id);
        case 'client_data': return renderClientDataBlock(block.id);
        case 'text': return renderTextBlock(block.id, block.content);
        case 'modules_table': return renderModulesTableBlock(block.id);
        case 'investment_table': return renderInvestmentTableBlock(block.id);
        case 'steps': return renderStepsBlock(block.id);
        case 'benefits': return renderBenefitsBlock(block.id);
        case 'signatures': return renderSignaturesBlock(block.id);
        default: return null;
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-200 py-8 print:py-0 print:bg-white font-sans">
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        `}
      </style>
      
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden px-4">
        <Button variant="outline" onClick={() => history.back()} className="bg-white hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <div className="flex items-center gap-3">
          {isFrozen && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-100 px-3 py-1.5 rounded-md border border-amber-200">
              <Lock className="w-4 h-4" /> Proposta Congelada
            </div>
          )}
          {!isFrozen && (
            <Button variant="secondary" onClick={handleCongelar} className="bg-white text-slate-800 border-slate-200 hover:bg-slate-100 shadow-sm">
              <Lock className="w-4 h-4 mr-2" /> Congelar Proposta
            </Button>
          )}
          <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            <Printer className="w-4 h-4 mr-2" /> Gerar PDF
          </Button>
        </div>
      </div>

      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none print:mx-0 overflow-visible relative text-slate-800 pb-0 flex flex-col">
        <table className="w-full">
          <thead className="print:table-header-group"><tr><td><div className="h-[15mm]"></div></td></tr></thead>
          <tbody className="print:table-row-group">
            <tr>
              <td>
                <div className="p-12 print:p-8 print:pt-0">
                  {templateProposta && templateProposta.length > 0 ? (
                    renderDynamicTemplate()
                  ) : (
                    // FALLBACK LEGACY
                    <>
                      {renderHeaderBlock('legacy-header')}
                      {renderClientDataBlock('legacy-client')}
                      {renderTextBlock('legacy-intro', textoIntroducao)}
                      <h2 className="text-lg font-bold uppercase tracking-wide text-indigo-950 mb-4">1. Escopo e Cenário Mapeado</h2>
                      {renderTextBlock('legacy-cenario', textoCenario)}
                      {renderModulesTableBlock('legacy-modules')}
                      {renderInvestmentTableBlock('legacy-investment')}
                      {renderTextBlock('legacy-setup', textoSetup)}
                      {renderStepsBlock('legacy-steps')}
                      {renderBenefitsBlock('legacy-benefits')}
                    </>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot className="print:table-footer-group"><tr><td><div className="h-[35mm]"></div></td></tr></tfoot>
        </table>

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
