import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowRight, Building2, Package, Activity, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute('/_comercial/orcamento-avulso')({
  component: OrcamentoAvulsoPage,
});

function OrcamentoAvulsoPage() {
  const [catalogoModulos, setCatalogoModulos] = useState<any[]>([]);
  const [empresasSuggestions, setEmpresasSuggestions] = useState<string[]>([]);
  const [descontoMensalidade, setDescontoMensalidade] = useState<number>(0);
  const [descontoImplantacao, setDescontoImplantacao] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configParams, setConfigParams] = useState<any>({
    base_calculo: 700,
    setup_padrao: 0,
    parametros: {}
  });

  const [form, setForm] = useState({
    nome_empresa: '',
    qtd_cnpj: 1,
    regime_tributario: '',
    volume_mensal_notas: 0,
    venda_interna_externa: '',
    tipo_mercado: '',
    qtd_usuarios_previstos: 0,
    precisa_importar_dados: 'Não',
    modulos_selecionados: [] as string[],
    override_plano_nome: 'Plano Professional',
    override_mensalidade: '2.248,90',
    override_desconto: '423,80',
    override_setup: '650,00'
  });

  useEffect(() => {
    const fetchDados = async () => {
      const [modulosRes, empresasRes, leadsRes, configRes] = await Promise.all([
        supabase.from('catalogo_modulos').select('*').eq('ativo', true).order('nome'),
        supabase.from('empresas').select('nome, razao_social'),
        supabase.from('leads').select('nome, razao_social, empresa'),
        supabase.from('configuracoes_orcamento').select('*').limit(1).maybeSingle()
      ]);

      if (modulosRes.data) setCatalogoModulos(modulosRes.data);

      if (configRes.data) {
        setConfigParams({
          base_calculo: configRes.data.base_calculo || 700,
          setup_padrao: configRes.data.setup_padrao || 0,
          parametros: configRes.data.formulario_builder?.parametros || {}
        });
      }

      const nomes = new Set<string>();
      empresasRes.data?.forEach((e: any) => {
        if (e.nome) nomes.add(e.nome);
        if (e.razao_social) nomes.add(e.razao_social);
      });
      leadsRes.data?.forEach((l: any) => {
        if (l.nome) nomes.add(l.nome);
        if (l.razao_social) nomes.add(l.razao_social);
        if (l.empresa) nomes.add(l.empresa);
      });
      
      setEmpresasSuggestions(Array.from(nomes).filter(Boolean).sort());
      setLoading(false);
    };
    fetchDados();
  }, []);

  // Magica do Autocomplete: Se o nome bater com um Lead/Empresa existente, puxar o Diagnóstico
  useEffect(() => {
    if (!form.nome_empresa) return;
    
    if (empresasSuggestions.includes(form.nome_empresa)) {
      const matchDiag = async () => {
        const { data } = await supabase
          .from('diagnosticos')
          .select('*')
          .eq('razao_social', form.nome_empresa)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (data && data.respostas_dinamicas) {
           const r = data.respostas_dinamicas;
           setForm(prev => ({
             ...prev,
             qtd_cnpj: data.qtd_cnpj || prev.qtd_cnpj,
             volume_mensal_notas: data.volume_mensal_notas || prev.volume_mensal_notas,
             regime_tributario: r.regime_tributario || prev.regime_tributario,
             venda_interna_externa: data.venda_interna_externa || prev.venda_interna_externa,
             tipo_mercado: data.tipo_mercado || prev.tipo_mercado,
             qtd_usuarios_previstos: data.qtd_usuarios_previstos || prev.qtd_usuarios_previstos,
             precisa_importar_dados: data.precisa_importar_dados || prev.precisa_importar_dados,
             modulos_selecionados: data.modulos_selecionados || prev.modulos_selecionados
           }));
           toast.success('Diagnóstico do Lead carregado automaticamente!');
        }
      };
      matchDiag();
    }
  }, [form.nome_empresa, empresasSuggestions]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (field: string, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      setForm(prev => ({ ...prev, [field]: '' }));
      return;
    }
    const numberValue = parseInt(digits, 10) / 100;
    const formatted = numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setForm(prev => ({ ...prev, [field]: formatted }));
  };

  const handleModuloToggle = (moduloId: string, checked: boolean) => {
    setForm(prev => {
      const current = prev.modulos_selecionados;
      if (checked) {
        return { ...prev, modulos_selecionados: [...current, moduloId] };
      } else {
        return { ...prev, modulos_selecionados: current.filter(id => id !== moduloId) };
      }
    });
  };

  const filteredSuggestions = form.nome_empresa 
    ? empresasSuggestions.filter(s => s.toLowerCase().includes(form.nome_empresa.toLowerCase()))
    : empresasSuggestions;

  // Cálculos do Orçamento Integrado ao Motor!
  const p = configParams.parametros;
  let valorTotalMensal = configParams.base_calculo || 0;
  let valorTotalSetup = configParams.setup_padrao || 0;

  // Pilares Fixo 2 e 3
  valorTotalMensal += (p.implantacao_mensalidade || 0) + (p.suporte_mensalidade || 0);
  valorTotalSetup += (p.implantacao_setup || 0) + (p.suporte_setup || 0);

  // Pilar 4: Regime Tributário
  if (form.regime_tributario === 'Simples Nacional') {
    valorTotalMensal += p.regime_simples_mensalidade || 0;
    valorTotalSetup += p.regime_simples_setup || 0;
  } else if (form.regime_tributario === 'Lucro Presumido') {
    valorTotalMensal += p.regime_presumido_mensalidade || 0;
    valorTotalSetup += p.regime_presumido_setup || 0;
  } else if (form.regime_tributario === 'Lucro Real') {
    valorTotalMensal += p.regime_real_mensalidade || 0;
    valorTotalSetup += p.regime_real_setup || 0;
  }

  // Pilar 4: Filiais (cobra apenas excedentes, mínimo 1)
  let filiaisAdicionais = Math.max(0, (Number(form.qtd_cnpj) || 1) - 1);
  valorTotalMensal += filiaisAdicionais * (p.filial_mensalidade || 0);
  valorTotalSetup += filiaisAdicionais * (p.filial_setup || 0);

  // Pilar 4: Notas Fiscais
  let notas = Number(form.volume_mensal_notas) || 0;
  let limiteNotas = p.notas_limite || 1000;
  if (notas > limiteNotas) {
    valorTotalMensal += p.notas_mensalidade || 0;
    valorTotalSetup += p.notas_setup || 0;
  }

  // Pilar 4: Venda
  if (form.venda_interna_externa === 'Apenas Interna (Dentro do Estado)') {
    valorTotalMensal += p.venda_interna_mensalidade || 0;
    valorTotalSetup += p.venda_interna_setup || 0;
  } else if (form.venda_interna_externa === 'Apenas Externa' || form.venda_interna_externa === 'Fora do Estado') {
    valorTotalMensal += p.venda_externa_mensalidade || 0;
    valorTotalSetup += p.venda_externa_setup || 0;
  } else if (form.venda_interna_externa === 'Ambas' || form.venda_interna_externa === 'Ambos') {
    valorTotalMensal += p.venda_ambas_mensalidade || 0;
    valorTotalSetup += p.venda_ambas_setup || 0;
  }

  // Pilar 4: Mercado
  if (form.tipo_mercado === 'Interno') {
    valorTotalMensal += p.mercado_interno_mensalidade || 0;
    valorTotalSetup += p.mercado_interno_setup || 0;
  } else if (form.tipo_mercado === 'Exportação') {
    valorTotalMensal += p.mercado_exportacao_mensalidade || 0;
    valorTotalSetup += p.mercado_exportacao_setup || 0;
  } else if (form.tipo_mercado === 'Ambos') {
    valorTotalMensal += p.mercado_ambos_mensalidade || 0;
    valorTotalSetup += p.mercado_ambos_setup || 0;
  }

  // Pilar 4: Usuários Extras
  let usuariosExtra = Number(form.qtd_usuarios_previstos) || 0;
  valorTotalMensal += usuariosExtra * (p.usuario_mensalidade || 0);
  valorTotalSetup += usuariosExtra * (p.usuario_setup || 0);

  // Pilar 4: Importação
  if (form.precisa_importar_dados === 'Sim') {
    valorTotalMensal += p.importacao_sim_mensalidade || 0;
    valorTotalSetup += p.importacao_sim_setup || 0;
  } else {
    valorTotalMensal += p.importacao_nao_mensalidade || 0;
    valorTotalSetup += p.importacao_nao_setup || 0;
  }

  // Pilar 5: Módulos
  let selecionadosIds = form.modulos_selecionados;
  let modulos = catalogoModulos.filter(m => selecionadosIds.includes(m.id));
  valorTotalMensal += modulos.reduce((acc, curr) => acc + (curr.preco_mensalidade || 25), 0);
  valorTotalSetup += modulos.reduce((acc, curr) => acc + (curr.preco_setup || 0), 0);

  const parseCurrencyStr = (val: string | number) => {
    if (!val) return 0;
    const s = String(val);
    if (s.includes(',')) {
      return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(s.replace(/[^\d.-]/g, '')) || 0;
  };

  const handleGerarDocumento = () => {
    const nome = form.nome_empresa || 'Empresa Não Informada';
    const pNome = form.override_plano_nome;
    const pMens = parseCurrencyStr(form.override_mensalidade);
    const pDesc = parseCurrencyStr(form.override_desconto);
    const pSet = parseCurrencyStr(form.override_setup);
    
    let url = `/proposta/avulso?isManual=true&nome=${encodeURIComponent(nome)}`;
    
    if (pMens > 0) {
      url += `&plano_nome=${encodeURIComponent(pNome)}&plano_valor=${pMens}&desconto=${pDesc}&setup=${pSet}`;
    } else {
      url += `&setup=${valorTotalSetup}&mensalidade=${valorTotalMensal}&desconto=${descontoMensalidade}&desconto_setup=${descontoImplantacao}`;
    }

    window.location.href = url;
  };

  if (loading) return <div className="p-8">Carregando formulário...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50/50">
      <div className="flex-1 overflow-auto p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Lado Esquerdo: Formulário */}
        <div className="flex-1 space-y-6 max-w-4xl">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => window.history.back()} className="h-10 w-10 shrink-0 rounded-full bg-white shadow-sm hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-indigo-600" />
                Calculadora de Orçamento Inteligente
              </h1>
              <p className="text-slate-500 mt-1">Simule o orçamento dinâmico integrado ao Motor de Precificação e aos Diagnósticos.</p>
            </div>
          </div>

          <Card className="border shadow-sm">
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Identificação
              </h2>
            </div>
            <CardContent className="p-6">
              <div className="space-y-2 relative">
                <Label className="font-semibold text-slate-700">Nome da Empresa (Para a proposta)</Label>
                <div className="relative">
                  <Input 
                    value={form.nome_empresa} 
                    onChange={e => {
                      handleChange('nome_empresa', e.target.value);
                      setShowSuggestions(true);
                    }} 
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Busque ou digite o nome do Lead... (se existir, os dados serão preenchidos)" 
                  />
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredSuggestions.map((nome, idx) => (
                        <div 
                          key={idx} 
                          className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700"
                          onClick={() => {
                            handleChange('nome_empresa', nome);
                            setShowSuggestions(false);
                          }}
                        >
                          {nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione um lead da lista para carregar as respostas do diagnóstico automaticamente.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" /> Parâmetros da Empresa (Pilar 4)
              </h2>
            </div>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Regime Tributário:</Label>
                <Select value={form.regime_tributario} onValueChange={v => handleChange('regime_tributario', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                    <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade de Filiais/CNPJs:</Label>
                <Input type="number" min="1" value={form.qtd_cnpj} onChange={e => handleChange('qtd_cnpj', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Volume Mensal de Notas Fiscais:</Label>
                <Input type="number" min="0" value={form.volume_mensal_notas} onChange={e => handleChange('volume_mensal_notas', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Perfil de Venda:</Label>
                <Select value={form.venda_interna_externa} onValueChange={v => handleChange('venda_interna_externa', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apenas Interna">Apenas Interna (Dentro do estado)</SelectItem>
                    <SelectItem value="Apenas Externa">Apenas Externa (Fora do estado)</SelectItem>
                    <SelectItem value="Ambas">Ambas (Interna e Externa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mercado de Atuação:</Label>
                <Select value={form.tipo_mercado} onValueChange={v => handleChange('tipo_mercado', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mercado Interno">Mercado Interno</SelectItem>
                    <SelectItem value="Exportação">Exportação</SelectItem>
                    <SelectItem value="Ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Usuários Adicionais (Além dos gestores):</Label>
                <Input type="number" min="0" value={form.qtd_usuarios_previstos} onChange={e => handleChange('qtd_usuarios_previstos', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Precisa Importar Dados de Outro Sistema ou Planilha?</Label>
                <Select value={form.precisa_importar_dados} onValueChange={v => handleChange('precisa_importar_dados', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim, precisa importar</SelectItem>
                    <SelectItem value="Não">Não, base limpa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-500" /> Módulos (Pilar 5)
              </h2>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => setForm(f => ({...f, modulos_selecionados: catalogoModulos.map(m=>m.id)}))}>Todos</Button>
                <Button variant="outline" size="sm" onClick={() => setForm(f => ({...f, modulos_selecionados: []}))}>Nenhum</Button>
              </div>
            </div>
            <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
              <div className="p-6">
                <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase">Operacionais</h3>
                <div className="space-y-4">
                  {catalogoModulos.filter(m => m.categoria === 'Operacional').map(mod => (
                    <div key={mod.id} className="flex items-start space-x-3">
                      <Checkbox 
                        id={`mod-${mod.id}`} 
                        checked={form.modulos_selecionados.includes(mod.id)} 
                        onCheckedChange={(c) => handleModuloToggle(mod.id, !!c)}
                      />
                      <Label htmlFor={`mod-${mod.id}`} className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {mod.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase">Financeiros</h3>
                <div className="space-y-4">
                  {catalogoModulos.filter(m => m.categoria === 'Financeiro').map(mod => (
                    <div key={mod.id} className="flex items-start space-x-3">
                      <Checkbox 
                        id={`mod-${mod.id}`} 
                        checked={form.modulos_selecionados.includes(mod.id)} 
                        onCheckedChange={(c) => handleModuloToggle(mod.id, !!c)}
                      />
                      <Label htmlFor={`mod-${mod.id}`} className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {mod.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-indigo-50/50">
            <div className="bg-indigo-100/50 px-6 py-4 border-b border-indigo-100">
              <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> Sobrescrita Manual (Opcional)
              </h2>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Nome do Plano</Label>
                  <Input 
                    value={form.override_plano_nome} 
                    onChange={e => handleChange('override_plano_nome', e.target.value)} 
                    placeholder="Ex: Plano Professional" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Mensalidade (Base)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <Input 
                      className="pl-9"
                      value={form.override_mensalidade} 
                      onChange={e => handleCurrencyChange('override_mensalidade', e.target.value)} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Desconto Aplicado</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <Input 
                      className="pl-9"
                      value={form.override_desconto} 
                      onChange={e => handleCurrencyChange('override_desconto', e.target.value)} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Taxa de Implantação</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <Input 
                      className="pl-9"
                      value={form.override_setup} 
                      onChange={e => handleCurrencyChange('override_setup', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Lado Direito: Preview do Orçamento */}
        <div className="w-full lg:w-[400px] xl:w-[450px]">
          <div className="sticky top-0 space-y-6">
            <Card className="border-indigo-100 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 opacity-80" /> Resumo do Orçamento
                </h2>
                
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 mb-4">
                  <span className="text-indigo-100 text-xs font-medium uppercase tracking-wider block mb-1">Mensalidade (Total)</span>
                  <div className="text-3xl font-extrabold flex items-baseline">
                    <span className="text-lg font-medium mr-1 text-indigo-200">R$</span>
                    {valorTotalMensal.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                  <span className="text-indigo-100 text-xs font-medium uppercase tracking-wider block mb-1">Setup / Implantação (Único)</span>
                  <div className="text-2xl font-bold flex items-baseline">
                    {valorTotalSetup > 0 ? (
                      <>
                        <span className="text-base font-medium mr-1 text-indigo-200">R$</span>
                        {valorTotalSetup.toFixed(2)}
                      </>
                    ) : (
                      'Isento'
                    )}
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6 bg-slate-50 space-y-4">
                
                <div className="space-y-4 mb-4">
                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-sm">Desconto Mensalidade (R$)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      value={descontoMensalidade || ''} 
                      onChange={e => setDescontoMensalidade(Number(e.target.value))} 
                      className="bg-white"
                      placeholder="Ex: 100.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-sm">Desconto Implantação (R$)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      value={descontoImplantacao || ''} 
                      onChange={e => setDescontoImplantacao(Number(e.target.value))} 
                      className="bg-white"
                      placeholder="Ex: 500.00"
                    />
                  </div>
                </div>

                {(descontoMensalidade > 0 || descontoImplantacao > 0) && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-3 mb-6">
                    <h3 className="font-bold text-indigo-900 text-sm">Valores Finais com Desconto:</h3>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Mensalidade Final:</span>
                      <span className="font-bold text-indigo-700">R$ {Math.max(0, valorTotalMensal - descontoMensalidade).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Implantação Final:</span>
                      <span className="font-bold text-indigo-700">R$ {Math.max(0, valorTotalSetup - descontoImplantacao).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  size="lg" 
                  className="w-full h-14 text-base font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                  onClick={handleGerarDocumento}
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Gerar Documento A4
                </Button>
                <p className="text-center text-xs text-slate-500 mt-4">
                  Os valores acima aplicam automaticamente a configuração salva no <b>Motor de Precificação</b>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
