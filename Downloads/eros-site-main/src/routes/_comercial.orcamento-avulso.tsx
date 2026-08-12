import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowRight, Building2, Package, Activity, FileText } from "lucide-react";

export const Route = createFileRoute('/_comercial/orcamento-avulso')({
  component: OrcamentoAvulsoPage,
});

function OrcamentoAvulsoPage() {
  const [catalogoModulos, setCatalogoModulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nome_empresa: '',
    qtd_cnpj: 1,
    faturamento_medio_mensal: '',
    gasto_mensal_compra_frutas: '',
    volume_mensal_notas: 0,
    venda_interna_externa: '',
    qtd_bancos_boleto: 0,
    tipo_mercado: '',
    possui_balanca_rodoviaria: 'Não',
    qtd_usuarios_previstos: '',
    precisa_importar_dados: 'Não',
    modulos_selecionados: [] as string[]
  });

  useEffect(() => {
    const fetchModulos = async () => {
      const { data } = await supabase.from('catalogo_modulos').select('*').eq('ativo', true).order('nome');
      if (data) setCatalogoModulos(data);
      setLoading(false);
    };
    fetchModulos();
  }, []);

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

  // Cálculos do Orçamento - Regras Oficiais
  let baseCalculo = 700;
  
  let qtdCnpj = Number(form.qtd_cnpj) || 1;
  let precoCnpj = qtdCnpj * 50;

  let volumeNotas = Number(form.volume_mensal_notas) || 0;
  let precoNotas = Math.floor(volumeNotas / 10) * 10;

  let precoVendaExterna = (form.venda_interna_externa === 'Fora do Estado' || form.venda_interna_externa === 'Ambos') ? 30 : 0;

  let qtdBancos = Number(form.qtd_bancos_boleto) || 0;
  let precoBoletos = qtdBancos * 70;

  const parseCurrencyStr = (val: string | number) => {
    if (!val) return 0;
    const s = String(val);
    if (s.includes(',')) {
      return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(s.replace(/[^\d.-]/g, '')) || 0;
  };

  let faturamento = parseCurrencyStr(form.faturamento_medio_mensal);
  let precoFaturamento = Math.floor(faturamento / 30000) * 5;

  let precoBalanca = form.possui_balanca_rodoviaria === 'Sim' ? 250 : 0;

  let qtdUsuarios = Number(String(form.qtd_usuarios_previstos).replace(/\D/g, '')) || 0;
  let precoUsuarios = qtdUsuarios * 25;

  let precoImportacao = form.precisa_importar_dados === 'Sim' ? 150 : 0;

  let gastoFrutas = parseCurrencyStr(form.gasto_mensal_compra_frutas);
  let precoFrutas = Math.floor(gastoFrutas / 10000) * 5;

  let precoExportacao = (form.tipo_mercado === 'Exportação' || form.tipo_mercado === 'Ambos') ? 200 : 0;

  let selecionadosIds = form.modulos_selecionados;
  let modulos = catalogoModulos.filter(m => selecionadosIds.includes(m.id));
  
  let precoModulos = modulos.length * 25;
  let setupModulos = modulos.reduce((acc, curr) => acc + (curr.preco_setup || 0), 0);

  let valorTotalMensal = baseCalculo + precoCnpj + precoNotas + precoVendaExterna + precoBoletos + precoFaturamento + precoUsuarios + precoFrutas + precoExportacao + precoModulos;
  let valorTotalSetup = precoBalanca + precoImportacao + setupModulos;

  const handleGerarDocumento = () => {
    const nome = form.nome_empresa || 'Empresa Não Informada';
    window.location.href = `/proposta/avulso?isManual=true&nome=${encodeURIComponent(nome)}&setup=${valorTotalSetup}&mensalidade=${valorTotalMensal}`;
  };

  if (loading) return <div className="p-8">Carregando formulário...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50/50">
      <div className="flex-1 overflow-auto p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Lado Esquerdo: Formulário */}
        <div className="flex-1 space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-indigo-600" />
              Calculadora de Orçamento Avulso
            </h1>
            <p className="text-slate-500 mt-1">Preencha as métricas operacionais para gerar uma proposta na hora.</p>
          </div>

          <Card className="border shadow-sm">
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Identificação
              </h2>
            </div>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Nome da Empresa (Para a proposta)</Label>
                <Input 
                  value={form.nome_empresa} 
                  onChange={e => handleChange('nome_empresa', e.target.value)} 
                  placeholder="Ex: Frutas Brasil Ltda" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" /> Volumetria Operacional
              </h2>
            </div>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Quantidade de CNPJs:</Label>
                <Input type="number" min="1" value={form.qtd_cnpj} onChange={e => handleChange('qtd_cnpj', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Faturamento médio mensal (R$):</Label>
                <Input type="text" value={form.faturamento_medio_mensal} onChange={e => handleCurrencyChange('faturamento_medio_mensal', e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Gasto mensal em frutas (R$):</Label>
                <Input type="text" value={form.gasto_mensal_compra_frutas} onChange={e => handleCurrencyChange('gasto_mensal_compra_frutas', e.target.value)} placeholder="0,00" />
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
                    <SelectItem value="Dentro do Estado">Apenas dentro do Estado (Interna)</SelectItem>
                    <SelectItem value="Fora do Estado">Fora do Estado (Externa)</SelectItem>
                    <SelectItem value="Ambos">Ambos (Dentro e Fora)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Qtd Bancos p/ Boleto:</Label>
                <Input type="number" min="0" value={form.qtd_bancos_boleto} onChange={e => handleChange('qtd_bancos_boleto', Number(e.target.value))} />
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
                <Label>Qtd de Usuários (Pessoas):</Label>
                <Input type="number" min="0" value={form.qtd_usuarios_previstos} onChange={e => handleChange('qtd_usuarios_previstos', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Possui Balança Rodoviária?</Label>
                <Select value={form.possui_balanca_rodoviaria} onValueChange={v => handleChange('possui_balanca_rodoviaria', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Precisa Importar Dados?</Label>
                <Select value={form.precisa_importar_dados} onValueChange={v => handleChange('precisa_importar_dados', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-500" /> Módulos
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
                  <span className="text-indigo-100 text-xs font-medium uppercase tracking-wider block mb-1">Mensalidade</span>
                  <div className="text-3xl font-extrabold flex items-baseline">
                    <span className="text-lg font-medium mr-1 text-indigo-200">R$</span>
                    {valorTotalMensal.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                  <span className="text-indigo-100 text-xs font-medium uppercase tracking-wider block mb-1">Setup / Implantação (Taxa Única)</span>
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
              
              <CardContent className="p-6 bg-slate-50">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-base font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                  onClick={handleGerarDocumento}
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Gerar Documento A4
                </Button>
                <p className="text-center text-xs text-slate-500 mt-4">
                  Os valores acima já aplicam automaticamente todas as regras de precificação vigentes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
