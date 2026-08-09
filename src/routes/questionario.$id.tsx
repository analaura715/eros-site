import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { NexaLogo } from "@/components/nexa-logo";
import { CheckCircle2, Loader2, Send, ArrowRight, User, Hash, FileText } from "lucide-react";

export const Route = createFileRoute('/questionario/$id')({
  component: QuestionarioPublicoPage,
});

function QuestionarioPublicoPage() {
  const { id } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [diag, setDiag] = useState<any>(null);
  const [catalogoModulos, setCatalogoModulos] = useState<any[]>([]);

  // Form states
  const [hasStarted, setHasStarted] = useState(false);
  const [form, setForm] = useState({
    respondente_nome: '',
    respondente_cpf: '',
    
    razao_social: '',
    cnpj: '',
    cidade_uf: '',
    telefone_whatsapp: '',
    
    tempo_atuacao_anos: '',
    volume_diario_caixas: '',
    possui_balanca_rodoviaria: '',
    qtd_produtores_fornecedores: '',
    total_colaboradores: '',
    qtd_usuarios_previstos: '',
    computadores_acessando: '',
    precisa_importar_dados: '',
    faturamento_medio_mensal: '',
    gasto_mensal_compra_frutas: '',
    
    usa_sistema_gestao: '',
    qual_sistema_atual: '',
    o_que_mais_incomoda: '',
    processos_manuais: '',
    principal_gargalo: '',
    
    qtd_cnpj: 1,
    volume_mensal_notas: 0,
    venda_interna_externa: '',
    qtd_bancos_boleto: 0,
    tipo_mercado: '',

    modulos_selecionados: [] as string[]
  });

  useEffect(() => {
    const fetchDiagnostico = async () => {
      try {
        const [diagRes, modulosRes] = await Promise.all([
          supabase.from('diagnosticos').select('*').eq('id', id).single(),
          supabase.from('catalogo_modulos').select('*').eq('ativo', true).order('nome')
        ]);
        
        if (diagRes.error) throw diagRes.error;
        setDiag(diagRes.data);
        if (modulosRes.data) setCatalogoModulos(modulosRes.data);
        
        // Pre-fill
        setForm(prev => ({
          ...prev,
          razao_social: diagRes.data.razao_social || '',
          cnpj: diagRes.data.cnpj || '',
          cidade_uf: diagRes.data.cidade_uf || '',
          telefone_whatsapp: diagRes.data.telefone_whatsapp || '',
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDiagnostico();
  }, [id]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleModuloToggle = (moduloId: string, checked: boolean) => {
    setForm(prev => {
      const current = prev.modulos_selecionados || [];
      if (checked) {
        return { ...prev, modulos_selecionados: [...current, moduloId] };
      } else {
        return { ...prev, modulos_selecionados: current.filter(id => id !== moduloId) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const { error } = await supabase.from('diagnosticos').update({
        ...form,
        status: 'respondido'
      }).eq('id', id);
      
      if (error) throw error;
      
      toast.success('Diagnóstico enviado com sucesso!');
      setDiag({ ...diag, status: 'respondido' });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar o diagnóstico. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!diag) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Questionário não encontrado</h2>
          <p className="text-slate-500 mt-2">O link pode estar quebrado ou não existe mais.</p>
        </Card>
      </div>
    );
  }

  if (diag.status === 'respondido') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center p-8 border-green-100 bg-green-50/50">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800">Muito Obrigado!</h2>
          <p className="text-green-600/80 mt-2">Recebemos suas respostas. Em breve, um de nossos consultores entrará em contato.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 relative">
      {/* Elementos Decorativos de Fundo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Header Público */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NexaLogo className="w-10 h-10" />
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">nexa</span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
            Diagnóstico Oficial
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-10 relative z-10">
        
        {!hasStarted ? (
          /* TELA DE BOAS VINDAS */
          <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-blue-600 p-8 text-center text-white">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-90" />
                <h1 className="text-3xl font-bold tracking-tight mb-2">Diagnóstico de Viabilidade</h1>
                <p className="text-primary-foreground/80">
                  Preencha o formulário abaixo para iniciarmos o mapeamento das necessidades da sua operação.
                </p>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Seu Nome Completo
                  </Label>
                  <Input 
                    value={form.respondente_nome} 
                    onChange={e => handleChange('respondente_nome', e.target.value)} 
                    placeholder="Como podemos te chamar?"
                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary" /> Seu CPF
                  </Label>
                  <Input 
                    value={form.respondente_cpf} 
                    onChange={e => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length > 11) value = value.slice(0, 11);
                      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
                      handleChange('respondente_cpf', value.replace(/-$/, '').replace(/\.$/, ''));
                    }} 
                    placeholder="000.000.000-00"
                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary text-lg"
                  />
                </div>
                <Button 
                  className="w-full h-14 text-lg font-bold shadow-lg bg-primary hover:bg-primary/90 mt-4" 
                  onClick={() => {
                    if(!form.respondente_nome || form.respondente_nome.trim().length < 3) {
                      toast.error("Por favor, preencha seu nome corretamente.");
                      return;
                    }
                    if(!form.respondente_cpf || form.respondente_cpf.replace(/\D/g, '').length < 11) {
                      toast.error("Por favor, digite um CPF válido.");
                      return;
                    }
                    setHasStarted(true);
                  }}
                >
                  Iniciar Diagnóstico <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
            
            <p className="text-center text-xs text-slate-400 mt-6 font-medium">
              Suas informações estão seguras conosco e serão utilizadas apenas para fins comerciais.
            </p>
          </div>
        ) : (
          /* FORMULÁRIO PRINCIPAL */
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Bem-vindo(a), {form.respondente_nome.split(' ')[0]}!</h1>
              <p className="text-slate-500 text-lg">
                Confirme os dados da sua empresa abaixo e preencha as informações para traçarmos o melhor cenário.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. DADOS INSTITUCIONAIS */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
            <div className="bg-slate-50/80 px-8 py-5 border-b border-slate-100 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">1</div>
              <h2 className="text-xl font-bold text-slate-800">Dados Institucionais</h2>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold">Razão Social / Nome Fantasia</Label>
                  <Input value={form.razao_social} onChange={e => handleChange('razao_social', e.target.value)} required className="bg-slate-50 focus-visible:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold">CNPJ</Label>
                  <Input value={form.cnpj} onChange={e => handleChange('cnpj', e.target.value)} className="bg-slate-50 focus-visible:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold">Cidade / Estado (UF)</Label>
                  <Input value={form.cidade_uf} onChange={e => handleChange('cidade_uf', e.target.value)} className="bg-slate-50 focus-visible:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold">Telefone / WhatsApp</Label>
                  <Input value={form.telefone_whatsapp} onChange={e => handleChange('telefone_whatsapp', e.target.value)} className="bg-slate-50 focus-visible:ring-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. PORTE DA OPERAÇÃO */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
            <div className="bg-slate-50/80 px-8 py-5 border-b border-slate-100 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold">2</div>
              <h2 className="text-xl font-bold text-slate-800">Porte e Informações Financeiras</h2>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label>Quantidade de CNPJs (Matriz/Filiais):</Label>
                  <Input type="number" min="1" value={form.qtd_cnpj} onChange={e => handleChange('qtd_cnpj', Number(e.target.value))} className="bg-slate-50 focus-visible:ring-primary" />
                </div>
                
                <div className="space-y-2">
                  <Label>Faturamento médio mensal exato (R$):</Label>
                  <Input type="number" min="0" value={form.faturamento_medio_mensal} onChange={e => handleChange('faturamento_medio_mensal', e.target.value)} placeholder="Ex: 150000" className="bg-slate-50 focus-visible:ring-primary" />
                </div>

                <div className="space-y-2">
                  <Label>Gasto mensal aproximado em compra de frutas (R$):</Label>
                  <Input type="number" min="0" value={form.gasto_mensal_compra_frutas} onChange={e => handleChange('gasto_mensal_compra_frutas', e.target.value)} placeholder="Ex: 85000" className="bg-slate-50 focus-visible:ring-primary" />
                </div>

                <div className="space-y-2">
                  <Label>Volume Mensal de Notas Fiscais (NF-e):</Label>
                  <Input type="number" min="0" value={form.volume_mensal_notas} onChange={e => handleChange('volume_mensal_notas', Number(e.target.value))} placeholder="Ex: 150" className="bg-slate-50 focus-visible:ring-primary" />
                </div>

                <div className="space-y-2">
                  <Label>Perfil de Venda (Interna ou Externa):</Label>
                  <Select value={form.venda_interna_externa} onValueChange={v => handleChange('venda_interna_externa', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o local de venda" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dentro do Estado">Apenas dentro do Estado (Interna)</SelectItem>
                      <SelectItem value="Fora do Estado">Fora do Estado (Externa)</SelectItem>
                      <SelectItem value="Ambos">Ambos (Dentro e Fora)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Geração de Boletos - Quantos bancos integrados?</Label>
                  <Input type="number" min="0" value={form.qtd_bancos_boleto} onChange={e => handleChange('qtd_bancos_boleto', Number(e.target.value))} placeholder="Ex: 2" className="bg-slate-50 focus-visible:ring-primary" />
                </div>

                <div className="space-y-2">
                  <Label>Mercado de Atuação (Destino Final):</Label>
                  <Select value={form.tipo_mercado} onValueChange={v => handleChange('tipo_mercado', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o mercado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mercado Interno">Apenas Mercado Interno</SelectItem>
                      <SelectItem value="Exportação">Exportação</SelectItem>
                      <SelectItem value="Ambos">Ambos (Interno e Exportação)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Possui balança rodoviária na estrutura?</Label>
                  <Select value={form.possui_balanca_rodoviaria} onValueChange={v => handleChange('possui_balanca_rodoviaria', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade exata de pessoas (usuários) que usarão o sistema:</Label>
                  <Input type="number" min="1" value={form.qtd_usuarios_previstos} onChange={e => handleChange('qtd_usuarios_previstos', e.target.value)} placeholder="Ex: 5" className="bg-slate-50 focus-visible:ring-primary" />
                </div>

                <div className="space-y-2">
                  <Label>Precisa importar dados de Planilhas ou Sistemas?</Label>
                  <Select value={form.precisa_importar_dados} onValueChange={v => handleChange('precisa_importar_dados', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Computadores/estações acessando o sistema:</Label>
                  <Select value={form.computadores_acessando} onValueChange={v => handleChange('computadores_acessando', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 computador</SelectItem>
                      <SelectItem value="2">2 computadores</SelectItem>
                      <SelectItem value="3">3 computadores</SelectItem>
                      <SelectItem value="4">4 computadores</SelectItem>
                      <SelectItem value="5">5 computadores</SelectItem>
                      <SelectItem value="6">6 computadores</SelectItem>
                      <SelectItem value="7">7 computadores</SelectItem>
                      <SelectItem value="8">8 computadores</SelectItem>
                      <SelectItem value="9">9 computadores</SelectItem>
                      <SelectItem value="10">10 computadores</SelectItem>
                      <SelectItem value="10+">Mais de 10 computadores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. TECNOLOGIAS E PROCESSOS */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
            <div className="bg-slate-50/80 px-8 py-5 border-b border-slate-100 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold">3</div>
              <h2 className="text-xl font-bold text-slate-800">Tecnologia e Processos</h2>
            </div>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold">Utilizam algum sistema de gestão (ERP) atualmente?</Label>
                  <Select value={form.usa_sistema_gestao} onValueChange={v => handleChange('usa_sistema_gestao', v)}>
                    <SelectTrigger className="bg-slate-50 focus:ring-indigo-500"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold">Se sim, qual é o sistema / software atual?</Label>
                  <Input 
                    value={form.qual_sistema_atual} 
                    onChange={e => handleChange('qual_sistema_atual', e.target.value)} 
                    placeholder="Digite o nome do sistema (ou 'Nenhum')" 
                    className="bg-slate-50 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold">O que mais incomoda ou limita a operação no sistema atual?</Label>
                <Select value={form.o_que_mais_incomoda} onValueChange={v => handleChange('o_que_mais_incomoda', v)}>
                  <SelectTrigger className="bg-slate-50 focus:ring-indigo-500"><SelectValue placeholder="Selecione o principal incômodo..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lentidão">Lentidão e Travamentos</SelectItem>
                    <SelectItem value="Falta de integração">Falta de integração entre setores</SelectItem>
                    <SelectItem value="Falta de rastreabilidade">Falta de controle e rastreabilidade</SelectItem>
                    <SelectItem value="Relatórios ruins">Dificuldade em emitir relatórios</SelectItem>
                    <SelectItem value="Suporte ruim">Suporte lento ou ruim</SelectItem>
                    <SelectItem value="Processos manuais">Ainda preciso fazer muita coisa manual</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                    <SelectItem value="Nenhum">Nenhum</SelectItem>
                    <SelectItem value="Prefiro não responder">Prefiro não responder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold">Quais processos ainda são executados de forma manual (planilhas/papel)?</Label>
                <Select value={form.processos_manuais} onValueChange={v => handleChange('processos_manuais', v)}>
                  <SelectTrigger className="bg-slate-50 focus:ring-indigo-500"><SelectValue placeholder="Selecione o processo mais crítico..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pesagem">Controle de Pesagem</SelectItem>
                    <SelectItem value="Pagamentos">Acerto/Pagamento de Produtores</SelectItem>
                    <SelectItem value="Rastreabilidade">Etiquetas e Rastreabilidade</SelectItem>
                    <SelectItem value="Estoque">Controle de Estoque e Embaladeiras</SelectItem>
                    <SelectItem value="Financeiro">Financeiro e Fluxo de Caixa</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                    <SelectItem value="Nenhum">Nenhum</SelectItem>
                    <SelectItem value="Prefiro não responder">Prefiro não responder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3 p-5 rounded-xl border border-indigo-100 bg-indigo-50/30">
                <Label className="text-indigo-800 font-bold text-base">Qual é o principal gargalo ou maior dificuldade da operação hoje?</Label>
                <Textarea 
                  value={form.principal_gargalo} 
                  onChange={e => handleChange('principal_gargalo', e.target.value)} 
                  placeholder="Escreva livremente sobre as dificuldades do dia a dia..." 
                  className="bg-white border-indigo-200 focus-visible:ring-indigo-500 min-h-[100px] resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. MÓDULOS */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden mb-12">
            <div className="bg-slate-50/80 px-8 py-5 border-b border-slate-100 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-600 flex items-center justify-center font-bold">4</div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Módulos de Interesse</h2>
                <p className="text-sm text-slate-500">Marque as soluções que fazem mais sentido para a sua operação hoje.</p>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                
                {/* Operacionais */}
                <div className="p-6 bg-teal-50/20">
                  <h3 className="font-bold text-teal-800 mb-4 bg-teal-100/50 py-2 px-3 rounded text-sm text-center">MÓDULOS OPERACIONAIS & AGRÍCOLAS</h3>
                  <div className="space-y-4">
                    {catalogoModulos.filter(m => m.categoria === 'Operacional').map(mod => (
                      <div key={mod.id} className="flex flex-row items-start space-x-3 p-2 rounded hover:bg-white transition-colors">
                        <Checkbox 
                          id={`mod-${mod.id}`} 
                          checked={form.modulos_selecionados.includes(mod.id)} 
                          onCheckedChange={(c) => handleModuloToggle(mod.id, !!c)}
                          className="mt-0.5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                        />
                        <div className="space-y-1 leading-none">
                          <Label htmlFor={`mod-${mod.id}`} className="cursor-pointer font-medium text-slate-700">{mod.nome}</Label>
                          {mod.descricao && <p className="text-xs text-slate-500 mt-1">{mod.descricao}</p>}
                        </div>
                      </div>
                    ))}
                    {catalogoModulos.filter(m => m.categoria === 'Operacional').length === 0 && (
                      <p className="text-sm text-muted-foreground text-center">Nenhum módulo operacional cadastrado.</p>
                    )}
                  </div>
                </div>

                {/* Financeiros */}
                <div className="p-6 bg-slate-50/50">
                  <h3 className="font-bold text-slate-700 mb-4 bg-slate-200/50 py-2 px-3 rounded text-sm text-center">MÓDULOS FINANCEIROS & GESTÃO</h3>
                  <div className="space-y-4">
                    {catalogoModulos.filter(m => m.categoria === 'Financeiro').map(mod => (
                      <div key={mod.id} className="flex flex-row items-start space-x-3 p-2 rounded hover:bg-white transition-colors">
                        <Checkbox 
                          id={`mod-${mod.id}`} 
                          checked={form.modulos_selecionados.includes(mod.id)} 
                          onCheckedChange={(c) => handleModuloToggle(mod.id, !!c)}
                          className="mt-0.5"
                        />
                        <div className="space-y-1 leading-none">
                          <Label htmlFor={`mod-${mod.id}`} className="cursor-pointer font-medium text-slate-700">{mod.nome}</Label>
                          {mod.descricao && <p className="text-xs text-slate-500 mt-1">{mod.descricao}</p>}
                        </div>
                      </div>
                    ))}
                    {catalogoModulos.filter(m => m.categoria === 'Financeiro').length === 0 && (
                      <p className="text-sm text-muted-foreground text-center">Nenhum módulo financeiro cadastrado.</p>
                    )}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          <div className="pt-6 pb-12 flex justify-end">
            <Button type="submit" size="lg" className="w-full md:w-auto gap-3 px-10 py-7 text-lg shadow-xl shadow-primary/20 rounded-xl" disabled={submitting}>
              {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              {submitting ? 'Enviando...' : 'Finalizar e Enviar Diagnóstico'}
            </Button>
          </div>

        </form>
        </div>
        )}
      </main>
    </div>
  );
}
