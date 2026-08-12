import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calculator, CheckCircle2, Calendar, User, FileText, Check, Copy, Send, Trash2, XCircle, CheckCircle, Handshake } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute('/_comercial/diagnosticos/$id')({
  component: DiagnosticoDetailComponent,
});

function DiagnosticoDetailComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [catalogoModulos, setCatalogoModulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [desconto, setDesconto] = useState<number>(0);
  const [isManual, setIsManual] = useState(false);
  const [manualMensalidade, setManualMensalidade] = useState<number>(0);
  const [manualSetup, setManualSetup] = useState<number>(0);

  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [recusarOpen, setRecusarOpen] = useState(false);
  const [fecharOpen, setFecharOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8">Carregando diagnóstico...</div>;
  if (!diagnostico) return <div className="p-8">Diagnóstico não encontrado.</div>;

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

  let valorTotalCalculado = baseCalculo + precoCnpj + precoNotas + precoVendaExterna + precoBoletos + precoFaturamento + precoBalanca + precoUsuarios + precoImportacao + precoFrutas + precoExportacao + precoModulos;
  let valorFinalAutomatico = Math.max(0, valorTotalCalculado - desconto);

  let valorMensalidadeFinal = isManual ? manualMensalidade : valorFinalAutomatico;
  let valorSetupFinal = isManual ? manualSetup : setupModulos;

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir este diagnóstico? Esta ação não pode ser desfeita.")) {
      const { error } = await supabase.from('diagnosticos').delete().eq('id', id);
      if (error) {
        toast.error("Erro ao excluir diagnóstico.");
      } else {
        toast.success("Diagnóstico excluído com sucesso.");
        navigate({ to: '/diagnosticos' });
      }
    }
  };

  const handleRecusar = async () => {
    if (!motivoRecusa) {
      toast.error("Por favor, informe o motivo da recusa.");
      return;
    }
    // Salvando na coluna resultado_proposta (você precisará criar essa coluna no Supabase)
    const { error } = await supabase.from('diagnosticos').update({ 
      resultado_proposta: 'recusado',
      motivo_recusa: motivoRecusa 
    }).eq('id', id);
    
    if (error) {
      toast.error("Erro ao recusar proposta. Verifique se as colunas resultado_proposta e motivo_recusa foram criadas no banco.");
    } else {
      toast.success("Proposta recusada com sucesso.");
      setRecusarOpen(false);
      navigate({ to: '/diagnosticos' });
    }
  };

  const handleFechar = async () => {
    // 1. Criar a empresa
    const cidadeParts = diagnostico.cidade_uf ? diagnostico.cidade_uf.split('-') : ['Não informada', ''];
    const nomeSeguro = diagnostico.razao_social || diagnostico.lead_nome || 'Empresa Nova';
    const payloadEmpresa = {
      cnpj: diagnostico.cnpj || '',
      nome: nomeSeguro,
      nome_fantasia: nomeSeguro,
      cidade: diagnostico.cidade_uf || 'Não informada',
      uf: cidadeParts.length > 1 ? cidadeParts[1].trim() : 'SP',
      telefone: diagnostico.telefone_whatsapp || '',
      segmento: 'Outro'
    };

    const { error: insertError } = await supabase.from('empresas').insert([payloadEmpresa]);
    if (insertError) {
      toast.error("Erro ao criar empresa.");
      console.error(insertError);
      return;
    }

    // 2. Atualizar diagnóstico
    const { error: updateError } = await supabase.from('diagnosticos').update({ 
      resultado_proposta: 'fechado' 
    }).eq('id', id);

    if (updateError) {
      toast.warning("Empresa criada, mas não foi possível atualizar o status do diagnóstico.");
    } else {
      toast.success("Parabéns! Proposta fechada e cliente cadastrado em Empresas.");
    }
    setFecharOpen(false);
    navigate({ to: '/empresas' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => history.back()} className="rounded-full shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">Resultado do Diagnóstico</h1>
              {diagnostico.respondido ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none border-0 font-medium">Respondido</Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pendente</Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
              <User className="h-3 w-3" /> Lead: <span className="font-medium text-slate-700">{diagnostico.lead_nome}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Gerado em: {format(new Date(diagnostico.created_at), "dd/MM/yyyy", { locale: ptBR })}
           </span>
           <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
             <Trash2 className="h-4 w-4 mr-2" />
             Excluir
           </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Seção de Pricing em Destaque */}
          <Card className="border-indigo-100 shadow-md bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
            <div className="h-1 w-full bg-indigo-500"></div>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-indigo-900 text-xl">Precificação (Pricing EROS)</CardTitle>
                </div>
                <CardDescription className="text-indigo-700/70">
                  {isManual ? 'Orçamento ajustado manualmente.' : 'Cálculo gerado automaticamente baseado nas respostas do lead.'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-white/60 p-2 rounded-lg border border-indigo-100">
                <Label htmlFor="manual-mode" className="text-indigo-800 font-semibold text-sm cursor-pointer">Orçamento Manual</Label>
                <Switch id="manual-mode" checked={isManual} onCheckedChange={setIsManual} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 items-stretch">
                {/* Breakdown */}
                <div className={`flex-1 space-y-3 p-5 rounded-lg border ${isManual ? 'bg-slate-50 border-slate-200 opacity-50 pointer-events-none' : 'bg-white/60 border-indigo-50'}`}>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Composição do Preço</h3>
                  
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-600">Base (Recursos, Implantação/Treinamento)</span>
                    <span className="font-medium text-slate-800">R$ {baseCalculo.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-600">Qtd CNPJs ({qtdCnpj})</span>
                    <span className="font-medium text-slate-800">R$ {precoCnpj.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-600">Volume Notas ({volumeNotas})</span>
                    <span className="font-medium text-slate-800">R$ {precoNotas.toFixed(2)}</span>
                  </div>
                  {precoVendaExterna > 0 && (
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-600">Venda Externa</span>
                    <span className="font-medium text-slate-800">R$ {precoVendaExterna.toFixed(2)}</span>
                  </div>
                  )}
                  {precoBoletos > 0 && (
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-600">Bancos p/ Boleto ({qtdBancos})</span>
                    <span className="font-medium text-slate-800">R$ {precoBoletos.toFixed(2)}</span>
                  </div>
                  )}
                  {precoExportacao > 0 && (
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-600">Exportação</span>
                    <span className="font-medium text-slate-800">R$ {precoExportacao.toFixed(2)}</span>
                  </div>
                  )}
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-600">Base Faturamento (R$ {faturamento.toLocaleString('pt-BR')})</span>
                    <span className="font-medium text-slate-800">R$ {precoFaturamento.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-600">Compra de Frutas (R$ {gastoFrutas.toLocaleString('pt-BR')})</span>
                    <span className="font-medium text-slate-800">R$ {precoFrutas.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-600">Usuários Previstos ({qtdUsuarios}) x R$ 20</span>
                    <span className="font-medium text-slate-800">R$ {precoUsuarios.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-600">Balança Rodoviária ({diagnostico.possui_balanca_rodoviaria || 'Não'})</span>
                    <span className="font-medium text-slate-800">R$ {precoBalanca.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-600">Importação de Dados ({diagnostico.precisa_importar_dados || 'Não'})</span>
                    <span className="font-medium text-slate-800">R$ {precoImportacao.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Módulos ({modulos.length})</span>
                    <span className="font-medium text-slate-800">R$ {precoModulos.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total Automático vs Manual */}
                <div className="w-full md:w-80 bg-indigo-600 rounded-xl p-6 text-white shadow-lg flex flex-col justify-center relative">
                  
                  {!isManual ? (
                    <>
                      <div className="text-center">
                        <span className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1 block">Total Base</span>
                        <div className={`text-xl font-bold mb-3 ${desconto > 0 ? 'text-indigo-300 line-through' : 'text-white'}`}>
                          R$ {valorTotalCalculado.toFixed(2)}
                        </div>

                        <div className="w-full mb-4 px-2">
                          <label className="text-xs text-indigo-200 block text-center mb-1">Aplicar Desconto (R$)</label>
                          <Input 
                            type="number"
                            value={desconto || ''}
                            onChange={e => setDesconto(Number(e.target.value))}
                            className="bg-indigo-700/50 border-indigo-400/50 text-white text-center font-semibold focus-visible:ring-indigo-300 h-8 max-w-[150px] mx-auto"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <span className="text-white text-sm font-bold uppercase tracking-wider mb-1 mt-2 block">Mensalidade Final</span>
                        <div className="text-4xl font-extrabold tracking-tight">
                          <span className="text-indigo-300 text-2xl font-normal mr-1">R$</span>{valorFinalAutomatico.toFixed(2)}
                        </div>
                        <p className="text-indigo-200 text-xs mt-3 text-center mb-6">
                          Setup: {setupModulos > 0 ? `R$ ${setupModulos.toFixed(2)}` : 'Isento'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col space-y-4">
                      <div className="text-center mb-2">
                        <Badge variant="secondary" className="bg-indigo-500 text-white mb-2">Modo Manual Ativado</Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-indigo-200 text-xs uppercase">Valor da Implantação / Setup (R$)</Label>
                        <Input 
                          type="number" 
                          value={manualSetup || ''} 
                          onChange={e => setManualSetup(Number(e.target.value))}
                          className="bg-white text-indigo-900 border-0 font-bold"
                          placeholder="Ex: 1500.00"
                        />
                      </div>
                      <div className="space-y-1 pb-4">
                        <Label className="text-indigo-200 text-xs uppercase">Valor da Mensalidade Final (R$)</Label>
                        <Input 
                          type="number" 
                          value={manualMensalidade || ''} 
                          onChange={e => setManualMensalidade(Number(e.target.value))}
                          className="bg-white text-indigo-900 border-0 font-bold"
                          placeholder="Ex: 850.00"
                        />
                      </div>
                    </div>
                  )}

                  <Link 
                    to="/proposta/$id" 
                    params={{ id: id }} 
                    search={{ 
                      desconto: !isManual ? desconto : 0, 
                      isManual: isManual ? 'true' : undefined,
                      mensalidade: isManual ? manualMensalidade : undefined,
                      setup: isManual ? manualSetup : undefined
                    }}
                  >
                    <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 border-0 shadow-sm font-bold mt-auto">
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Documento (A4)
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Respostas Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Dores e Sistemas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Sistema Atual</span>
                  <p className="font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                    {diagnostico.usa_sistema_gestao === 'Sim' ? diagnostico.qual_sistema_atual : 'Não utiliza ERP (Planilhas)'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">O que mais incomoda</span>
                  <p className="font-medium text-slate-800 bg-red-50/50 p-2 rounded border border-red-100">
                    {diagnostico.o_que_mais_incomoda || 'Não informado'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Maior Gargalo</span>
                  <p className="font-medium text-slate-800 bg-orange-50/50 p-2 rounded border border-orange-100">
                    {diagnostico.principal_gargalo || 'Não informado'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Processos Manuais</span>
                  <p className="font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                    {diagnostico.processos_manuais || 'Não informado'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Módulos Solicitados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {modulos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {modulos.map((mod: any) => (
                      <Badge key={mod.id} variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                        <Check className="h-3 w-3 mr-1" />
                        {mod.nome}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Nenhum módulo selecionado no diagnóstico.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Botões de Desfecho */}
          <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-end items-center gap-4">
            
            {/* Proposta Recusada */}
            <Dialog open={recusarOpen} onOpenChange={setRecusarOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full md:w-auto">
                  <XCircle className="w-4 h-4 mr-2" />
                  Proposta Recusada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-red-600 flex items-center gap-2"><XCircle className="w-5 h-5"/> Registrar Recusa</DialogTitle>
                  <DialogDescription>
                    O cliente decidiu não avançar. Informe o motivo para mantermos no histórico de negociações.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label>Motivo da Recusa</Label>
                  <Textarea 
                    className="mt-2" 
                    placeholder="Ex: Achou muito caro, escolheu o concorrente X, projeto adiado..."
                    value={motivoRecusa}
                    onChange={(e) => setMotivoRecusa(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setRecusarOpen(false)}>Cancelar</Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleRecusar}>Confirmar Recusa</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Proposta Fechada */}
            <Dialog open={fecharOpen} onOpenChange={setFecharOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md w-full md:w-auto">
                  <Handshake className="w-4 h-4 mr-2" />
                  Proposta Fechada (Virar Cliente)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-emerald-700 flex items-center gap-2"><CheckCircle className="w-5 h-5"/> Parabéns pelo Fechamento!</DialogTitle>
                  <DialogDescription>
                    Você está prestes a converter este lead em um Cliente (Empresa) ativo na plataforma.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3 bg-slate-50 p-4 rounded-md border border-slate-100 text-sm">
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Razão Social:</span> <span className="font-medium text-slate-800">{diagnostico.razao_social || diagnostico.lead_nome}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">CNPJ:</span> <span className="font-medium text-slate-800">{diagnostico.cnpj || 'Não informado'}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Cidade:</span> <span className="font-medium text-slate-800">{diagnostico.cidade_uf || 'Não informada'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Telefone:</span> <span className="font-medium text-slate-800">{diagnostico.telefone_whatsapp || 'Não informado'}</span></div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setFecharOpen(false)}>Cancelar</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleFechar}>Confirmar e Migrar Cliente</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>

        </div>
      </div>
    </div>
  );
}
