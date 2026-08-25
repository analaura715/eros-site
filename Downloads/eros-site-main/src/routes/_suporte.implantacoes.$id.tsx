import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Calendar, MapPin, PlayCircle, Clock, Plus, Settings, CheckSquare, ListTodo } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute('/_suporte/implantacoes/$id')({
  component: ImplantacaoDetailComponent,
});

const MODULOS_DISPONIVEIS = [
  { 
    id: 'cadastro', 
    nome: '1. Cadastros',
    processos: [
      {
        nome: 'Cadastros Base do Sistema',
        tarefas: [
          'A - Empresa',
          'B - Contador',
          'C - Cliente',
          'D - Fornecedor',
          'G - Transportador',
          'H - Produto e Insumos',
          'J - Unidade de Medida',
          'L - Banco',
          'M - Conta Corrente',
          'N - Classificação de Despesas',
          'O - Centro de Custo',
          'P - Forma de Pagamento',
          'Q - Espécie',
          'R - Cadastro de CFOP'
        ]
      }
    ]
  },
  {
    id: 'movimentacao_financeira',
    nome: '2. Movimentação Financeira',
    processos: [
      {
        nome: 'Rotinas Financeiras',
        tarefas: [
          'Contas á Pagar',
          'Contas á Receber',
          'Movimento Bancário',
          'Emissor de Cheque Avulso',
          'Relação de Pagamento',
          'Relação de Recebimento',
          'D - Importador arquivo .REM',
          'Conciliação Bancária',
          'Conciliação Bancária por Arquivo .OFX',
          'Cadastro de Cheques'
        ]
      }
    ]
  },
  {
    id: 'entradas',
    nome: '3. Entradas',
    processos: [
      {
        nome: 'Processos de Entrada',
        tarefas: [
          'Entrada de Produtor',
          'Pesagem Balança',
          'Classificação da Entrada'
        ]
      }
    ]
  },
  {
    id: 'saidas',
    nome: '4. Saídas',
    processos: [
      {
        nome: 'Processos de Saída',
        tarefas: [
          'Venda',
          'Nota',
          'MDF-e'
        ]
      }
    ]
  },
  {
    id: 'relatorios',
    nome: '5. Relatórios',
    processos: [
      {
        nome: 'Análise e Emissão',
        tarefas: [
          'Apresentação de Relatórios'
        ]
      }
    ]
  },
  {
    id: 'painel_web',
    nome: '6. Painel Web',
    processos: [
      {
        nome: 'Operação Web',
        tarefas: [
          'Treinamento Painel Web'
        ]
      }
    ]
  }
];

function ImplantacaoDetailComponent() {
  const { id } = Route.useParams();
  const [implantacao, setImplantacao] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaNota, setNovaNota] = useState('');
  
  // checklistState guarda um objeto onde a chave é "moduloId-indexTarefa" e valor boolean
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const fetchImplantacao = async () => {
    setLoading(true);
    const { data: implData, error: implError } = await supabase
      .from('implantacoes')
      .select('*, empresas(*)')
      .eq('id', id)
      .maybeSingle();

    if (!implError && implData) {
      setImplantacao(implData);
      setChecklistState(implData.checklist_status || {}); // Carrega do DB
      
      const { data: histData } = await supabase
        .from('implantacao_historico')
        .select('*')
        .eq('implantacao_id', id)
        .order('created_at', { ascending: false });
        
      setHistorico(histData || []);
    } else {
      toast.error('Erro ao buscar implantação.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchImplantacao();
  }, [id]);

  const handleUpdateStatus = async (novoStatus: string) => {
    const { error } = await supabase.from('implantacoes').update({ status: novoStatus }).eq('id', id);
    if (!error) {
      toast.success('Status atualizado!');
      
      await supabase.from('implantacao_historico').insert([{
        implantacao_id: id,
        tipo: 'Mudança de Status',
        descricao: `O status da implantação foi alterado para: ${novoStatus}`,
        criado_por: 'Usuário'
      }]);
      
      fetchImplantacao();
    } else {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleSalvarNota = async () => {
    if (!novaNota.trim()) return;
    
    const { error } = await supabase.from('implantacao_historico').insert([{
      implantacao_id: id,
      tipo: 'Anotação',
      descricao: novaNota,
      criado_por: 'Usuário'
    }]);

    if (!error) {
      toast.success('Nota salva com sucesso!');
      setNovaNota('');
      fetchImplantacao();
    } else {
      toast.error('Erro ao salvar nota.');
    }
  };

  const handleToggleModulo = async (moduloId: string, checked: boolean) => {
    let mods = implantacao.modulos_selecionados || [];
    if (checked) {
      mods = [...mods, moduloId];
    } else {
      mods = mods.filter((m: string) => m !== moduloId);
    }

    const { error } = await supabase.from('implantacoes').update({ modulos_selecionados: mods }).eq('id', id);
    if (!error) {
      setImplantacao({ ...implantacao, modulos_selecionados: mods });
      toast.success('Módulos atualizados.');
    } else {
      toast.error('Erro ao atualizar módulos.');
    }
  };

  const handleToggleTask = async (taskKey: string, checked: boolean, taskName: string) => {
    const newState = { ...checklistState, [taskKey]: checked };
    setChecklistState(newState);

    // Save to DB (Optimistic Update)
    const { error } = await supabase.from('implantacoes').update({ checklist_status: newState }).eq('id', id);
    
    if (error) {
      toast.error('Erro ao salvar progresso.');
      setChecklistState(checklistState); // revert
    } else {
      // Registrar log no histórico para prestação de contas
      if (checked) {
        await supabase.from('implantacao_historico').insert([{
          implantacao_id: id,
          tipo: 'Anotação',
          descricao: `✅ Tarefa concluída: ${taskName}`,
          criado_por: 'Sistema'
        }]);
        fetchImplantacao();
      }
    }
  };

  if (loading) return <div className="p-8 flex items-center justify-center h-full"><span className="animate-pulse font-medium text-muted-foreground">Carregando dados da implantação...</span></div>;
  if (!implantacao) return <div className="p-8 text-center text-muted-foreground">Implantação não encontrada.</div>;

  const empresa = implantacao.empresas;
  const modulosSelecionados = implantacao.modulos_selecionados || [];

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background overflow-hidden max-h-screen">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => history.back()} className="rounded-full hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{empresa?.nome}</h1>
              <Badge variant="default" className={`font-normal ${
                implantacao.status === 'Concluída' ? 'bg-emerald-500/15 text-emerald-700' :
                implantacao.status === 'Em Andamento' ? 'bg-blue-500/15 text-blue-700' :
                implantacao.status === 'Pausada' ? 'bg-amber-500/15 text-amber-700' :
                'bg-slate-500/15 text-slate-700'
              }`}>
                {implantacao.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Implantação</span>
              {empresa?.cidade && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {empresa.cidade} - {empresa.uf}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={implantacao.status} onValueChange={handleUpdateStatus}>
            <SelectTrigger className="w-[180px] bg-white h-9 shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Não Iniciada">Não Iniciada</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Pausada">Pausada</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col xl:flex-row flex-1 overflow-hidden">
        
        {/* Esquerda: Configurações e Módulos */}
        <aside className="w-full xl:w-[340px] border-b xl:border-b-0 xl:border-r bg-card flex flex-col gap-6 p-6 overflow-y-auto shrink-0">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Settings className="h-4 w-4 text-primary" /> Módulos Contratados
            </h3>
            <div className="flex flex-col gap-3">
              {MODULOS_DISPONIVEIS.map(mod => (
                <label key={mod.id} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  modulosSelecionados.includes(mod.id) ? 'bg-primary/5 border-primary/20' : 'bg-muted/20 border-transparent hover:border-border'
                }`}>
                  <Checkbox 
                    checked={modulosSelecionados.includes(mod.id)}
                    onCheckedChange={(checked) => handleToggleModulo(mod.id, checked as boolean)}
                  />
                  <span className="text-sm font-medium leading-none">
                    {mod.nome}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" /> Prazos
            </h3>
            <div className="space-y-4">
              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Data de Início</span>
                <span className="text-sm">{implantacao.data_inicio ? format(new Date(implantacao.data_inicio), 'dd/MM/yyyy HH:mm') : 'Não definida'}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Previsão / Conclusão</span>
                <span className="text-sm">{implantacao.data_conclusao ? format(new Date(implantacao.data_conclusao), 'dd/MM/yyyy') : 'Não definida'}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Centro: Histórico e Checklist */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 dark:bg-background p-6">
          <div className="max-w-4xl w-full mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Coluna 1: Checklist de Implantação */}
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
                Checklist da Implantação
              </h3>
              
              <div className="flex flex-col gap-4">
                {modulosSelecionados.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl border border-dashed text-center">
                    Selecione módulos na barra lateral para gerar o checklist.
                  </div>
                ) : (
                  MODULOS_DISPONIVEIS.filter(m => modulosSelecionados.includes(m.id)).map(modulo => {
                    const totalTarefas = modulo.processos.reduce((acc, p) => acc + p.tarefas.length, 0);
                    const concluidas = modulo.processos.reduce((acc, p, pIdx) => {
                      return acc + p.tarefas.filter((_, tIdx) => checklistState[`${modulo.id}-${pIdx}-${tIdx}`]).length;
                    }, 0);
                    const progresso = totalTarefas === 0 ? 0 : Math.round((concluidas / totalTarefas) * 100);

                    return (
                      <Card key={modulo.id} className="shadow-sm border-muted-foreground/20 overflow-hidden">
                        <div className="bg-muted/40 p-3 border-b flex items-center justify-between">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <ListTodo className="h-4 w-4 text-primary" /> {modulo.nome}
                          </h4>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            progresso === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'
                          }`}>
                            {progresso}%
                          </span>
                        </div>
                        <CardContent className="p-0">
                          <div className="flex flex-col">
                            {modulo.processos.map((processo, pIdx) => (
                              <div key={pIdx} className="border-b last:border-0 border-muted-foreground/20">
                                <div className="bg-slate-50/80 dark:bg-muted/20 px-4 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-muted-foreground/10 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                  {processo.nome}
                                </div>
                                <div className="flex flex-col">
                                  {processo.tarefas.map((tarefa, tIdx) => {
                                    const key = `${modulo.id}-${pIdx}-${tIdx}`;
                                    const isChecked = !!checklistState[key];
                                    return (
                                      <label key={tIdx} className={`flex items-center gap-3 p-3.5 border-b border-muted-foreground/10 last:border-0 cursor-pointer transition-colors hover:bg-muted/20 ${isChecked ? 'bg-emerald-50/30' : ''}`}>
                                        <Checkbox 
                                          checked={isChecked}
                                          onCheckedChange={(checked) => handleToggleTask(key, checked as boolean, tarefa)}
                                          className={isChecked ? 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500' : ''}
                                        />
                                        <span className={`text-sm ${isChecked ? 'text-muted-foreground line-through opacity-70' : 'text-foreground font-medium'}`}>
                                          {tarefa}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>

            {/* Coluna 2: Histórico / Diário de Bordo */}
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Diário de Bordo
              </h3>
              
              {/* Input de Nova Nota */}
              <div className="relative">
                <Textarea 
                  value={novaNota}
                  onChange={e => setNovaNota(e.target.value)}
                  placeholder="Registre um treinamento, anotação ou reunião realizada..."
                  className="min-h-[100px] resize-none pb-12 shadow-sm bg-white dark:bg-card border-muted-foreground/20 focus-visible:ring-1"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <Button size="sm" onClick={handleSalvarNota} disabled={!novaNota.trim()} className="shadow-sm h-8">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar
                  </Button>
                </div>
              </div>

              {/* Lista de Histórico */}
              <div className="flex flex-col gap-0 mt-2 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {historico.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-white dark:bg-card rounded-xl border border-dashed relative z-10">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  historico.map((item) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                      {/* Ícone central */}
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10 ${
                        item.descricao.includes('✅ Tarefa concluída') ? 'text-emerald-500' :
                        item.tipo === 'Mudança de Status' ? 'text-amber-500' : 'text-primary'
                      }`}>
                        {item.descricao.includes('✅ Tarefa concluída') ? <CheckSquare className="h-4 w-4" /> :
                         item.tipo === 'Mudança de Status' ? <Settings className="h-4 w-4" /> :
                         <Clock className="h-4 w-4" />}
                      </div>
                      
                      {/* Card do histórico */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {item.tipo}
                          </span>
                          <time className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            {format(new Date(item.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                          </time>
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                          {item.descricao}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
