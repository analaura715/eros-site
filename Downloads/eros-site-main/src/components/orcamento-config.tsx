import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, GripVertical, Edit2, X, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ModulosCrud } from "./modulos-crud";
export function OrcamentoConfig() {
  const [loading, setLoading] = useState(true);
  const [configId, setConfigId] = useState<string | null>(null);
  
  // States originais para Cancelar
  const [originalBaseCalculo, setOriginalBaseCalculo] = useState(0);
  const [originalSetupPadrao, setOriginalSetupPadrao] = useState(0);
  const [originalParams, setOriginalParams] = useState<any>({});

  // States
  const [baseCalculo, setBaseCalculo] = useState(0);
  const [setupPadrao, setSetupPadrao] = useState(0);
  
  const [editMode, setEditMode] = useState({
    pilar1: false,
    pilar2: false,
    pilar3: false,
    pilar4: false,
    pilarTextos: false,
  });
  
  // Parametros Gerais (Pilares 2, 3 e 4)
  const [params, setParams] = useState({
    implantacao_mensalidade: 0,
    implantacao_setup: 500,
    suporte_mensalidade: 150,
    suporte_setup: 0,
    
    // Pilar 4: Regime Tributário
    regime_simples_mensalidade: 0,
    regime_simples_setup: 0,
    regime_presumido_mensalidade: 0,
    regime_presumido_setup: 0,
    regime_real_mensalidade: 0,
    regime_real_setup: 0,
    
    // Pilar 4: Filiais
    filial_mensalidade: 150,
    filial_setup: 0,
    
    // Pilar 4: Notas Fiscais
    notas_limite: 1000,
    notas_mensalidade: 0,
    notas_setup: 0,
    
    // Pilar 4: Venda
    venda_interna_mensalidade: 0,
    venda_interna_setup: 0,
    venda_externa_mensalidade: 0,
    venda_externa_setup: 0,
    venda_ambas_mensalidade: 0,
    venda_ambas_setup: 0,
    
    // Pilar 4: Mercado
    mercado_interno_mensalidade: 0,
    mercado_interno_setup: 0,
    mercado_exportacao_mensalidade: 0,
    mercado_exportacao_setup: 0,
    mercado_ambos_mensalidade: 0,
    mercado_ambos_setup: 0,
    
    // Pilar 4: Usuários
    usuario_mensalidade: 49.90,
    usuario_setup: 0,
    
    // Pilar 4: Importação
    importacao_sim_mensalidade: 0,
    importacao_sim_setup: 500,
    importacao_nao_mensalidade: 0,
    importacao_nao_setup: 0,
  });

  // Textos da Proposta
  const [textosProposta, setTextosProposta] = useState({
    introducao: "Agradecemos a oportunidade de apresentar nossa solução para otimização e gestão estratégica do seu negócio. Mais do que um sistema, entregamos uma plataforma robusta projetada para acompanhar o crescimento da sua empresa com segurança e alta disponibilidade.",
    conhecimento_negocio: "Nossa tecnologia foi desenvolvida para atender operações que exigem controle rigoroso, fluxos bem definidos e acesso rápido a indicadores de performance, garantindo que sua equipe tenha as ferramentas certas para tomada de decisão em tempo real.",
    composicao_mensalidade: "Sua mensalidade garante muito mais do que apenas o acesso à plataforma. Ela contempla o licenciamento completo dos **Módulos Fundamentais**, hospedagem em infraestrutura de nuvem de alta performance (AWS/Google Cloud), rotinas automáticas de backup diário, monitoramento de disponibilidade 24/7 e atualizações contínuas de segurança e legislação.\n\nAlém disso, inclui nosso pacote completo de **Manutenção e Suporte Técnico Ativo**, garantindo que sua equipe tenha assistência especializada sempre que precisar, sem custos surpresas.",
    sobre_implantacao: "A Taxa de Implantação é um investimento único focado no sucesso da adoção da plataforma. Este valor cobre todo o processo de **Onboarding**, que inclui: levantamento e configuração tributária, parametrização de regras de negócio, importação de dados cadastrais (quando aplicável), mapeamento de fluxos operacionais e **treinamento completo** da sua equipe para garantir a máxima extração de valor do sistema desde o primeiro dia."
  });
  const [originalTextosProposta, setOriginalTextosProposta] = useState<any>({});

  // Fields (Form Builder)
  const [campos, setCampos] = useState<any[]>([]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.from('configuracoes_orcamento').select('*').limit(1).maybeSingle();
      if (error) throw error;
      
      if (data) {
        setConfigId(data.id);
        
        const base = data.base_calculo || 0;
        const setup = data.setup_padrao || 0;
        
        setBaseCalculo(base);
        setSetupPadrao(setup);
        setOriginalBaseCalculo(base);
        setOriginalSetupPadrao(setup);
        
        if (data.formulario_builder) {
          if (Array.isArray(data.formulario_builder)) {
            setCampos(data.formulario_builder);
          } else {
            setCampos(data.formulario_builder.campos || []);
            const p = { ...params, ...(data.formulario_builder.parametros || {}) };
            setParams(p);
            setOriginalParams(p);
            
            if (data.formulario_builder.textos_proposta) {
              const t = { ...textosProposta, ...data.formulario_builder.textos_proposta };
              setTextosProposta(t);
              setOriginalTextosProposta(t);
            } else {
              setOriginalTextosProposta(textosProposta);
            }
          }
        } else {
            setOriginalParams(params);
            setOriginalTextosProposta(textosProposta);
        }
      } else {
        setOriginalParams(params);
        setOriginalTextosProposta(textosProposta);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar configurações. O script SQL foi executado?");
    } finally {
      setLoading(false);
    }
  };

  const handleParamChange = (field: keyof typeof params, value: string) => {
    setParams(prev => ({ ...prev, [field]: Number(value) }));
  };

  const handleSavePilar = async (pilarKey: keyof typeof editMode) => {
    try {
      const payload = {
        base_calculo: baseCalculo,
        setup_padrao: setupPadrao,
        formulario_builder: {
          campos: campos,
          parametros: params,
          textos_proposta: textosProposta
        },
      };

      if (configId) {
        await supabase.from('configuracoes_orcamento').update(payload).eq('id', configId);
      } else {
        const { data } = await supabase.from('configuracoes_orcamento').insert([payload]).select().single();
        if (data) setConfigId(data.id);
      }
      
      setOriginalBaseCalculo(baseCalculo);
      setOriginalSetupPadrao(setupPadrao);
      setOriginalParams(params);
      setOriginalTextosProposta(textosProposta);
      setEditMode(prev => ({ ...prev, [pilarKey]: false }));
      
      toast.success("Configurações salvas com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar configurações.");
    }
  };

  const handleCancelPilar = (pilarKey: keyof typeof editMode) => {
    if (pilarKey === 'pilar1') {
      setBaseCalculo(originalBaseCalculo);
      setSetupPadrao(originalSetupPadrao);
    } else if (pilarKey === 'pilarTextos') {
      setTextosProposta(originalTextosProposta);
    } else {
      setParams(originalParams);
    }
    setEditMode(prev => ({ ...prev, [pilarKey]: false }));
  };

  const handleClearPilar = (pilarKey: keyof typeof editMode) => {
    if (pilarKey === 'pilar1') {
      setBaseCalculo(0);
      setSetupPadrao(0);
    } else if (pilarKey === 'pilar2') {
      setParams(p => ({ ...p, implantacao_mensalidade: 0, implantacao_setup: 0 }));
    } else if (pilarKey === 'pilar3') {
      setParams(p => ({ ...p, suporte_mensalidade: 0, suporte_setup: 0 }));
    } else if (pilarKey === 'pilar4') {
      setParams(p => ({
        ...p,
        regime_simples_mensalidade: 0, regime_simples_setup: 0,
        regime_presumido_mensalidade: 0, regime_presumido_setup: 0,
        regime_real_mensalidade: 0, regime_real_setup: 0,
        filial_mensalidade: 0, filial_setup: 0,
        notas_limite: 0, notas_mensalidade: 0, notas_setup: 0,
        venda_interna_mensalidade: 0, venda_interna_setup: 0,
        venda_externa_mensalidade: 0, venda_externa_setup: 0,
        venda_ambas_mensalidade: 0, venda_ambas_setup: 0,
        mercado_interno_mensalidade: 0, mercado_interno_setup: 0,
        mercado_exportacao_mensalidade: 0, mercado_exportacao_setup: 0,
        mercado_ambos_mensalidade: 0, mercado_ambos_setup: 0,
        usuario_mensalidade: 0, usuario_setup: 0,
        importacao_sim_mensalidade: 0, importacao_sim_setup: 0,
        importacao_nao_mensalidade: 0, importacao_nao_setup: 0,
      }));
    } else if (pilarKey === 'pilarTextos') {
      setTextosProposta({
        introducao: "",
        conhecimento_negocio: "",
        composicao_mensalidade: "",
        sobre_implantacao: ""
      });
    }
  };

  const renderActionButtons = (pilarKey: keyof typeof editMode) => {
    const isEditing = editMode[pilarKey];
    if (isEditing) {
      return (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleClearPilar(pilarKey)}>
            <RotateCcw className="w-4 h-4 mr-1" /> Limpar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleCancelPilar(pilarKey)}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleSavePilar(pilarKey)}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        </div>
      );
    }
    return (
      <Button variant="outline" size="sm" onClick={() => setEditMode(prev => ({ ...prev, [pilarKey]: true }))}>
        <Edit2 className="w-4 h-4 mr-2" /> Editar
      </Button>
    );
  };

  return (
    <Tabs defaultValue="motor" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
        <TabsTrigger value="motor">Motor de Preços</TabsTrigger>
        <TabsTrigger value="textos">Textos da Proposta</TabsTrigger>
      </TabsList>

      <TabsContent value="motor" className="space-y-6 pb-24">
      {/* PILAR 1: Valor Base */}
      <Card className="shadow-sm border rounded-2xl overflow-hidden bg-white dark:bg-card">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold">1</span>
              Valor Base (Módulos Fundamentais)
            </CardTitle>
            <CardDescription>
              Pacote base obrigatório que contempla os pilares fundamentais do sistema.
            </CardDescription>
          </div>
          {renderActionButtons('pilar1')}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Módulos Inclusos</h4>
              <div className="flex flex-wrap gap-2">
                {['Cadastro Cliente', 'Funcionário', 'Fornecedor', 'Transportador', 'CFOP', 'Banco', 'Conta Corrente', 'Produto', 'Grupo', 'Forma de Pagamento', 'Espécie', 'Entrada de Nota de Compras', 'Cadastro de Usuários', 'Envio de Doc. Fiscais Automático'].map(m => (
                  <span key={m} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wide rounded-md">{m}</span>
                ))}
              </div>
            </div>
            <div className="space-y-4 bg-slate-50 p-6 rounded-xl border">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Precificação Base</h4>
              <div className="space-y-2">
                <Label>Valor Mensalidade (R$)</Label>
                <Input disabled={!editMode.pilar1} type="number" value={baseCalculo} onChange={e => setBaseCalculo(Number(e.target.value))} className="bg-white disabled:bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Valor Implantação (R$)</Label>
                <Input disabled={!editMode.pilar1} type="number" value={setupPadrao} onChange={e => setSetupPadrao(Number(e.target.value))} className="bg-white disabled:bg-slate-100" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PILAR 2: Implantação */}
      <Card className="shadow-sm border rounded-2xl overflow-hidden bg-white dark:bg-card">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold">2</span>
              Módulo de Implantação
            </CardTitle>
            <CardDescription>
              Serviços prestados durante a entrada em produção.
            </CardDescription>
          </div>
          {renderActionButtons('pilar2')}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Serviços Inclusos</h4>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                <li>Configuração tributária</li>
                <li>Instalação do sistema</li>
                <li>Configurações de usuários</li>
                <li>Configurações fiscais e contábeis</li>
                <li>Treinamento</li>
                <li>Sistema online</li>
                <li>Nota de qualquer lugar</li>
              </ul>
            </div>
            <div className="space-y-4 bg-slate-50 p-6 rounded-xl border h-fit">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Precificação da Implantação</h4>
              <div className="space-y-2">
                <Label>Valor Mensalidade (R$)</Label>
                <Input disabled={!editMode.pilar2} type="number" value={params.implantacao_mensalidade} onChange={e => handleParamChange('implantacao_mensalidade', e.target.value)} className="bg-white disabled:bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Valor Implantação (R$)</Label>
                <Input disabled={!editMode.pilar2} type="number" value={params.implantacao_setup} onChange={e => handleParamChange('implantacao_setup', e.target.value)} className="bg-white disabled:bg-slate-100" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PILAR 3: Manutenção e Suporte */}
      <Card className="shadow-sm border rounded-2xl overflow-hidden bg-white dark:bg-card">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold">3</span>
              Manutenção e Suporte
            </CardTitle>
            <CardDescription>
              Taxa recorrente para atendimento e atualizações.
            </CardDescription>
          </div>
          {renderActionButtons('pilar3')}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Benefícios Inclusos</h4>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                <li>Suporte de segunda a sexta, 08:00 às 17:30</li>
                <li>Backups contínuos</li>
                <li>Atualizações do sistema</li>
                <li>Sistema sempre atualizado com dados seguindo as atualidades</li>
              </ul>
            </div>
            <div className="space-y-4 bg-slate-50 p-6 rounded-xl border h-fit">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Precificação do Suporte</h4>
              <div className="space-y-2">
                <Label>Valor Mensalidade (R$)</Label>
                <Input disabled={!editMode.pilar3} type="number" value={params.suporte_mensalidade} onChange={e => handleParamChange('suporte_mensalidade', e.target.value)} className="bg-white disabled:bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Valor Implantação (R$)</Label>
                <Input disabled={!editMode.pilar3} type="number" value={params.suporte_setup} onChange={e => handleParamChange('suporte_setup', e.target.value)} className="bg-white disabled:bg-slate-100" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* PILAR 4: Parâmetros da Empresa */}
      <Card className="shadow-sm border rounded-2xl overflow-hidden bg-white dark:bg-card">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold">4</span>
              Parâmetros da Empresa
            </CardTitle>
            <CardDescription>
              Fatores variáveis que acrescentam valor ao orçamento (defina a taxa ou valor extra para cada caso).
            </CardDescription>
          </div>
          {renderActionButtons('pilar4')}
        </CardHeader>
        <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-6">
              
              <div className="space-y-3 p-5 bg-slate-50 border rounded-lg">
                <Label className="font-bold text-slate-700 text-base">Regime Tributário</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-3 border rounded-md">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Simples Nacional</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Mensalidade</Label><Input disabled={!editMode.pilar4} type="number" value={params.regime_simples_mensalidade} onChange={e => handleParamChange('regime_simples_mensalidade', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Implantação</Label><Input disabled={!editMode.pilar4} type="number" value={params.regime_simples_setup} onChange={e => handleParamChange('regime_simples_setup', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 border rounded-md">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Lucro Presumido</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Mensalidade</Label><Input disabled={!editMode.pilar4} type="number" value={params.regime_presumido_mensalidade} onChange={e => handleParamChange('regime_presumido_mensalidade', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Implantação</Label><Input disabled={!editMode.pilar4} type="number" value={params.regime_presumido_setup} onChange={e => handleParamChange('regime_presumido_setup', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 border rounded-md">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Lucro Real</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Mensalidade</Label><Input disabled={!editMode.pilar4} type="number" value={params.regime_real_mensalidade} onChange={e => handleParamChange('regime_real_mensalidade', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Implantação</Label><Input disabled={!editMode.pilar4} type="number" value={params.regime_real_setup} onChange={e => handleParamChange('regime_real_setup', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-5 bg-slate-50 border rounded-lg">
                <Label className="font-bold text-slate-700 text-base">Volume Mensal de Notas Fiscais</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-3 border rounded-md flex flex-col justify-center">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Franquia Isenta (Nº Notas)</Label>
                    <Input disabled={!editMode.pilar4} type="number" value={params.notas_limite} onChange={e => handleParamChange('notas_limite', e.target.value)} className="disabled:bg-slate-100" />
                    <p className="text-[10px] text-muted-foreground mt-1">Limite mensal isento de cobrança adicional.</p>
                  </div>
                  <div className="bg-white p-3 border rounded-md col-span-2">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Taxa se ultrapassar o limite</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><Label className="text-xs">Valor Mensalidade (R$)</Label><Input disabled={!editMode.pilar4} type="number" value={params.notas_mensalidade} onChange={e => handleParamChange('notas_mensalidade', e.target.value)} className="disabled:bg-slate-100" /></div>
                      <div className="space-y-1"><Label className="text-xs">Valor Implantação (R$)</Label><Input disabled={!editMode.pilar4} type="number" value={params.notas_setup} onChange={e => handleParamChange('notas_setup', e.target.value)} className="disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-5 bg-slate-50 border rounded-lg">
                  <Label className="font-bold text-slate-700 text-base">Adicional por Filial/CNPJ Extra</Label>
                  <div className="bg-white p-3 border rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><Label className="text-xs">Valor Mensalidade (R$)</Label><Input disabled={!editMode.pilar4} type="number" value={params.filial_mensalidade} onChange={e => handleParamChange('filial_mensalidade', e.target.value)} className="disabled:bg-slate-100" /></div>
                      <div className="space-y-1"><Label className="text-xs">Valor Implantação (R$)</Label><Input disabled={!editMode.pilar4} type="number" value={params.filial_setup} onChange={e => handleParamChange('filial_setup', e.target.value)} className="disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-5 bg-slate-50 border rounded-lg">
                  <Label className="font-bold text-slate-700 text-base">Adicional por Usuário Extra</Label>
                  <div className="bg-white p-3 border rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><Label className="text-xs">Valor Mensalidade (R$)</Label><Input disabled={!editMode.pilar4} type="number" value={params.usuario_mensalidade} onChange={e => handleParamChange('usuario_mensalidade', e.target.value)} className="disabled:bg-slate-100" /></div>
                      <div className="space-y-1"><Label className="text-xs">Valor Implantação (R$)</Label><Input disabled={!editMode.pilar4} type="number" value={params.usuario_setup} onChange={e => handleParamChange('usuario_setup', e.target.value)} className="disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-5 bg-slate-50 border rounded-lg">
                <Label className="font-bold text-slate-700 text-base">Perfil de Venda</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-3 border rounded-md">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Apenas Interna (Estado)</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Mensalidade</Label><Input disabled={!editMode.pilar4} type="number" value={params.venda_interna_mensalidade} onChange={e => handleParamChange('venda_interna_mensalidade', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Setup</Label><Input disabled={!editMode.pilar4} type="number" value={params.venda_interna_setup} onChange={e => handleParamChange('venda_interna_setup', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 border rounded-md">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Apenas Externa / Fora</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Mensalidade</Label><Input disabled={!editMode.pilar4} type="number" value={params.venda_externa_mensalidade} onChange={e => handleParamChange('venda_externa_mensalidade', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Setup</Label><Input disabled={!editMode.pilar4} type="number" value={params.venda_externa_setup} onChange={e => handleParamChange('venda_externa_setup', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 border rounded-md">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Ambas</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Mensalidade</Label><Input disabled={!editMode.pilar4} type="number" value={params.venda_ambas_mensalidade} onChange={e => handleParamChange('venda_ambas_mensalidade', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Setup</Label><Input disabled={!editMode.pilar4} type="number" value={params.venda_ambas_setup} onChange={e => handleParamChange('venda_ambas_setup', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-5 bg-slate-50 border rounded-lg">
                <Label className="font-bold text-slate-700 text-base">Mercado de Atuação</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-3 border rounded-md">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Apenas Interno</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Mensalidade</Label><Input disabled={!editMode.pilar4} type="number" value={params.mercado_interno_mensalidade} onChange={e => handleParamChange('mercado_interno_mensalidade', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Setup</Label><Input disabled={!editMode.pilar4} type="number" value={params.mercado_interno_setup} onChange={e => handleParamChange('mercado_interno_setup', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 border rounded-md">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Apenas Exportação</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Mensalidade</Label><Input disabled={!editMode.pilar4} type="number" value={params.mercado_exportacao_mensalidade} onChange={e => handleParamChange('mercado_exportacao_mensalidade', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Setup</Label><Input disabled={!editMode.pilar4} type="number" value={params.mercado_exportacao_setup} onChange={e => handleParamChange('mercado_exportacao_setup', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 border rounded-md">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Ambos</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Mensalidade</Label><Input disabled={!editMode.pilar4} type="number" value={params.mercado_ambos_mensalidade} onChange={e => handleParamChange('mercado_ambos_mensalidade', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Setup</Label><Input disabled={!editMode.pilar4} type="number" value={params.mercado_ambos_setup} onChange={e => handleParamChange('mercado_ambos_setup', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-5 bg-slate-50 border rounded-lg">
                <Label className="font-bold text-slate-700 text-base">Necessita de Importação de Dados</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-3 border rounded-md">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Sim, precisa importar</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Mensalidade</Label><Input disabled={!editMode.pilar4} type="number" value={params.importacao_sim_mensalidade} onChange={e => handleParamChange('importacao_sim_mensalidade', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Setup</Label><Input disabled={!editMode.pilar4} type="number" value={params.importacao_sim_setup} onChange={e => handleParamChange('importacao_sim_setup', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 border rounded-md">
                    <Label className="text-sm font-semibold text-slate-600 block mb-2">Não, base limpa</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Mensalidade</Label><Input disabled={!editMode.pilar4} type="number" value={params.importacao_nao_mensalidade} onChange={e => handleParamChange('importacao_nao_mensalidade', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                      <div className="flex justify-between items-center"><Label className="text-xs text-slate-500">Setup</Label><Input disabled={!editMode.pilar4} type="number" value={params.importacao_nao_setup} onChange={e => handleParamChange('importacao_nao_setup', e.target.value)} className="w-24 h-8 disabled:bg-slate-100" /></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
        </CardContent>
      </Card>

      {/* PILAR 5: Módulos Adicionais (ModulosCrud) */}
      <Card className="shadow-sm border rounded-2xl overflow-hidden bg-white dark:bg-card">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold">5</span>
            Módulos Adicionais
          </CardTitle>
          <CardDescription>
            Catálogo de módulos opcionais que o cliente pode adicionar à proposta.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
            <ModulosCrud />
        </CardContent>
      </Card>
      
      {/* Escondendo a parte legada do construtor, pois agora 100% dos parâmetros estão mapeados acima 
      (Para não quebrar código, o estado 'campos' e 'addCampo' ainda existem mas estão invisíveis para evitar confusão) */}

      </TabsContent>

      <TabsContent value="textos" className="pb-24">
        <Card className="shadow-sm border rounded-2xl overflow-hidden bg-white dark:bg-card">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
                Textos e Descrições da Proposta Comercial (PDF)
              </CardTitle>
              <CardDescription>
                Configure os parágrafos descritivos que serão exibidos no momento da geração do PDF da proposta.
              </CardDescription>
            </div>
            {renderActionButtons('pilarTextos')}
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-700">1. Introdução e Agradecimento</Label>
              <p className="text-sm text-slate-500 mb-2">Este texto aparece logo no início da proposta, antes do cenário mapeado.</p>
              <Textarea 
                disabled={!editMode.pilarTextos} 
                className="min-h-[100px] disabled:bg-slate-50 disabled:text-slate-600"
                value={textosProposta.introducao} 
                onChange={e => setTextosProposta(p => ({ ...p, introducao: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-700">2. Conhecimento do Negócio</Label>
              <p className="text-sm text-slate-500 mb-2">Aparece após o cenário mapeado, detalhando que entendemos a necessidade do cliente.</p>
              <Textarea 
                disabled={!editMode.pilarTextos} 
                className="min-h-[100px] disabled:bg-slate-50 disabled:text-slate-600"
                value={textosProposta.conhecimento_negocio} 
                onChange={e => setTextosProposta(p => ({ ...p, conhecimento_negocio: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-700">3. Composição da Mensalidade</Label>
              <p className="text-sm text-slate-500 mb-2">Explicação técnica e comercial sobre os benefícios inclusos no pagamento recorrente.</p>
              <Textarea 
                disabled={!editMode.pilarTextos} 
                className="min-h-[120px] disabled:bg-slate-50 disabled:text-slate-600"
                value={textosProposta.composicao_mensalidade} 
                onChange={e => setTextosProposta(p => ({ ...p, composicao_mensalidade: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-700">4. Sobre a Implantação e Onboarding</Label>
              <p className="text-sm text-slate-500 mb-2">Explicação de valor sobre o setup, detalhando parametrização, treinamentos, etc.</p>
              <Textarea 
                disabled={!editMode.pilarTextos} 
                className="min-h-[120px] disabled:bg-slate-50 disabled:text-slate-600"
                value={textosProposta.sobre_implantacao} 
                onChange={e => setTextosProposta(p => ({ ...p, sobre_implantacao: e.target.value }))}
              />
            </div>

          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
