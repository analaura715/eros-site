import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calculator, Calendar, User, FileText, Check, Trash2, XCircle, CheckCircle, Handshake } from "lucide-react";
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
  const [config, setConfig] = useState<any>(null);
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
      const [diagRes, configRes] = await Promise.all([
        supabase.from('diagnosticos').select('*').eq('id', id).maybeSingle(),
        supabase.from('configuracoes_orcamento').select('*').limit(1).maybeSingle()
      ]);
      
      if (diagRes.data) setDiagnostico(diagRes.data);
      if (configRes.data) setConfig(configRes.data);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando diagnóstico...</div>;
  if (!diagnostico) return <div className="p-8 text-center text-muted-foreground">Diagnóstico não encontrado.</div>;

  // CÁLCULO DINÂMICO DE ORÇAMENTO
  const respostas = diagnostico.respostas_dinamicas || {};
  const camposConfig = config?.formulario_builder || [];
  
  let baseCalculo = config?.base_calculo || 0;
  let valorTotalSetup = config?.setup_padrao || 0;
  
  let acréscimosMensais: { motivo: string; valor: number }[] = [];
  
  // Analisa as regras de cada pergunta e calcula o impacto no preço
  camposConfig.forEach((campo: any) => {
    const resposta = respostas[campo.id];
    if (resposta === undefined || resposta === null || resposta === '') return;

    if (campo.regra_tipo === 'soma_fixa') {
      let valor = Number(campo.regra_valor) || 0;
      if (valor > 0) {
        acréscimosMensais.push({ motivo: campo.pergunta, valor });
      }
    } 
    else if (campo.regra_tipo === 'multiplicador') {
      let numeroResposta = Number(String(resposta).replace(/\D/g, '')) || 0;
      let valorFator = Number(campo.regra_valor) || 0;
      let resultado = numeroResposta * valorFator;
      if (resultado > 0) {
        acréscimosMensais.push({ motivo: `${campo.pergunta} (${numeroResposta} x R$ ${valorFator})`, valor: resultado });
      }
    }
    else if (campo.regra_tipo === 'condicional_valor') {
      if (String(resposta).trim().toLowerCase() === String(campo.regra_condicao).trim().toLowerCase()) {
        let valor = Number(campo.regra_valor) || 0;
        if (valor > 0) {
          acréscimosMensais.push({ motivo: `${campo.pergunta} (${resposta})`, valor });
        }
      }
    }
  });

  const totalAcrescimos = acréscimosMensais.reduce((acc, curr) => acc + curr.valor, 0);
  const valorTotalMensal = baseCalculo + totalAcrescimos;
  const valorFinalAutomatico = Math.max(0, valorTotalMensal - desconto);

  const valorMensalidadeFinal = isManual ? manualMensalidade : valorFinalAutomatico;
  const valorSetupFinal = isManual ? manualSetup : valorTotalSetup;

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir?")) {
      const { error } = await supabase.from('diagnosticos').delete().eq('id', id);
      if (error) {
        toast.error("Erro ao excluir.");
      } else {
        toast.success("Excluído com sucesso.");
        navigate({ to: '/diagnosticos' });
      }
    }
  };

  const handleRecusar = async () => {
    if (!motivoRecusa) {
      toast.error("Informe o motivo.");
      return;
    }
    const { error } = await supabase.from('diagnosticos').update({ 
      resultado_proposta: 'recusado', motivo_recusa: motivoRecusa 
    }).eq('id', id);
    
    if (error) {
      toast.error("Erro ao recusar proposta.");
    } else {
      toast.success("Proposta recusada.");
      navigate({ to: '/diagnosticos' });
    }
  };

  const handleFechar = async () => {
    const nomeSeguro = diagnostico.razao_social || 'Empresa Nova';
    const payloadEmpresa = {
      cnpj: diagnostico.cnpj || '',
      nome: nomeSeguro,
      nome_fantasia: nomeSeguro,
      cidade: diagnostico.cidade_uf || 'Não informada',
      uf: 'SP',
      telefone: diagnostico.telefone_whatsapp || '',
      segmento: 'Outro'
    };

    await supabase.from('empresas').insert([payloadEmpresa]);
    await supabase.from('diagnosticos').update({ resultado_proposta: 'fechado' }).eq('id', id);

    toast.success("Parabéns! Cliente cadastrado.");
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
              {diagnostico.status === 'respondido' ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none border-0 font-medium">Respondido</Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pendente</Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
              <User className="h-3 w-3" /> Razão Social: <span className="font-medium text-slate-700">{diagnostico.razao_social}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Gerado em: {format(new Date(diagnostico.created_at), "dd/MM/yyyy", { locale: ptBR })}
           </span>
           <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
             <Trash2 className="h-4 w-4 mr-2" /> Excluir
           </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Esquerda: Calculo e Pricing */}
            <div className="md:col-span-2 space-y-6">
              <Card className="border-indigo-100 shadow-md overflow-hidden">
                <div className="h-1 w-full bg-indigo-500"></div>
                <CardHeader className="pb-2 flex flex-row items-center justify-between bg-white">
                  <div>
                    <CardTitle className="text-indigo-900 text-xl flex items-center gap-2"><Calculator className="h-5 w-5"/> Precificação (Motor Dinâmico)</CardTitle>
                    <CardDescription className="text-indigo-700/70">Valores calculados em tempo real com base nas configurações.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                    <Label htmlFor="manual-mode" className="text-indigo-800 text-sm font-semibold cursor-pointer">Orçamento Manual</Label>
                    <Switch id="manual-mode" checked={isManual} onCheckedChange={setIsManual} />
                  </div>
                </CardHeader>
                <CardContent className="bg-slate-50 border-t border-slate-100 p-6">
                  
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Composição do Preço</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                      <span className="text-slate-600">Base Calculada (Padrão)</span>
                      <span className="font-bold text-slate-800">R$ {baseCalculo.toFixed(2)}</span>
                    </div>
                    
                    {acréscimosMensais.map((acrescimo, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-indigo-100/50 pb-2">
                        <span className="text-slate-600">{acrescimo.motivo}</span>
                        <span className="font-medium text-slate-800">+ R$ {acrescimo.valor.toFixed(2)}</span>
                      </div>
                    ))}

                    {acréscimosMensais.length === 0 && (
                      <div className="text-sm text-slate-400 italic pb-2">Nenhum acréscimo dinâmico aplicado.</div>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-slate-500">Desconto Especial (R$)</Label>
                      <Input 
                        type="number" 
                        value={desconto || ''} 
                        onChange={e => setDesconto(Number(e.target.value))}
                        disabled={isManual}
                        className="w-32 text-right font-bold text-indigo-700" 
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-slate-700">Total Mensal</span>
                      <span className="text-2xl font-extrabold text-indigo-700">R$ {valorFinalAutomatico.toFixed(2)}</span>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Direita: Total e Ações */}
            <div className="space-y-6">
               <div className="w-full bg-indigo-600 rounded-xl p-6 text-white shadow-lg flex flex-col justify-center relative h-full min-h-[300px]">
                  {!isManual ? (
                    <div className="text-center flex-1 flex flex-col justify-center">
                      <span className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-2 block">Mensalidade Final Calculada</span>
                      <div className="text-4xl font-extrabold tracking-tight mb-6">
                        <span className="text-indigo-300 text-2xl font-normal mr-1">R$</span>{valorFinalAutomatico.toFixed(2)}
                      </div>
                      
                      <div className="bg-indigo-700/50 rounded-lg p-3">
                        <span className="text-indigo-200 text-xs uppercase block mb-1">Setup / Implantação (Único)</span>
                        <span className="font-bold">R$ {valorTotalSetup.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-4 flex-1 justify-center">
                      <Badge variant="secondary" className="bg-indigo-500 text-white w-fit mx-auto mb-2">Modo Manual</Badge>
                      <div className="space-y-1">
                        <Label className="text-indigo-200 text-xs uppercase">Implantação (R$)</Label>
                        <Input type="number" value={manualSetup || ''} onChange={e => setManualSetup(Number(e.target.value))} className="bg-white text-indigo-900 border-0 font-bold text-lg h-12" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-indigo-200 text-xs uppercase">Mensalidade (R$)</Label>
                        <Input type="number" value={manualMensalidade || ''} onChange={e => setManualMensalidade(Number(e.target.value))} className="bg-white text-indigo-900 border-0 font-bold text-xl h-14" />
                      </div>
                    </div>
                  )}

                  <Link 
                    to="/proposta/$id" 
                    params={{ id: id }} 
                    search={{ isManual: isManual ? 'true' : undefined, mensalidade: valorMensalidadeFinal, setup: valorSetupFinal }}
                    className="mt-6"
                  >
                    <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm font-bold h-12">
                      <FileText className="h-4 w-4 mr-2" /> Gerar Proposta (PDF)
                    </Button>
                  </Link>
               </div>
            </div>

          </div>

          {/* Dados Dinâmicos */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" /> Respostas do Lead
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CNPJ</span>
                  <p className="font-medium text-slate-800 text-sm bg-slate-50 p-2 rounded border">{diagnostico.cnpj || 'Não informado'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cidade</span>
                  <p className="font-medium text-slate-800 text-sm bg-slate-50 p-2 rounded border">{diagnostico.cidade_uf || 'Não informado'}</p>
                </div>
                
                {camposConfig.map((campo: any) => (
                  <div key={campo.id} className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider line-clamp-1" title={campo.pergunta}>{campo.pergunta}</span>
                    <p className="font-medium text-slate-800 text-sm bg-slate-50 p-2 rounded border line-clamp-2">
                      {respostas[campo.id] || 'Não informado'}
                    </p>
                  </div>
                ))}

              </div>
            </CardContent>
          </Card>

          {/* Botões de Desfecho */}
          <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-end items-center gap-4">
            <Dialog open={recusarOpen} onOpenChange={setRecusarOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <XCircle className="w-4 h-4 mr-2" /> Proposta Recusada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-red-600">Registrar Recusa</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label>Motivo da Recusa</Label>
                  <Textarea className="mt-2" value={motivoRecusa} onChange={(e) => setMotivoRecusa(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setRecusarOpen(false)}>Cancelar</Button>
                  <Button className="bg-red-600 text-white" onClick={handleRecusar}>Confirmar Recusa</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={fecharOpen} onOpenChange={setFecharOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                  <Handshake className="w-4 h-4 mr-2" /> Negócio Fechado
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-emerald-700">Parabéns pelo Fechamento!</DialogTitle>
                  <DialogDescription>O lead será promovido a Cliente.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setFecharOpen(false)}>Cancelar</Button>
                  <Button className="bg-emerald-600 text-white" onClick={handleFechar}>Confirmar Venda</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

        </div>
      </div>
    </div>
  );
}
