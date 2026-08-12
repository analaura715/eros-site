import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, Briefcase, Pencil, MessageCircle, FileText, CheckCircle2, TrendingUp, ChevronRight, Loader2, SearchX, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute('/_comercial/dashboard')({
  component: DashboardComponent,
});

function DashboardComponent() {
  const navigate = useNavigate();
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  
  const [loadingLeads, setLoadingLeads] = useState(true);
  
  const [metaCount, setMetaCount] = useState<number>(() => {
    const saved = localStorage.getItem('venux_meta');
    return saved ? parseInt(saved) : 5;
  });
  const [editMeta, setEditMeta] = useState<number>(metaCount);
  
  // Dashboard Data State
  const [clientesNovos, setClientesNovos] = useState(0);
  const [leadsHoje, setLeadsHoje] = useState<any[]>([]);
  const [qtdDemonstracoes, setQtdDemonstracoes] = useState(0);
  const [qtdNegociacao, setQtdNegociacao] = useState(0);
  const [pipelineData, setPipelineData] = useState<any[]>([]);

  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [activeLeadLog, setActiveLeadLog] = useState<any>(null);
  const [logText, setLogText] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingLeads(true);
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

      // 1. Clientes Novos (Empresas criadas este mês, indicando fechamento de negócio)
      const { count: empresasCount } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', primeiroDiaMes);
      
      setClientesNovos(empresasCount || 0);

      // 2. Buscar Leads para montar os KPIs e Funil
      const { data: leads } = await supabase.from('leads').select('*');

      if (leads) {
        // P/ Contatar Hoje
        const paraHoje = leads.filter(lead => {
          if (!lead.data_proximo_contato) return false;
          return isSameDay(new Date(lead.data_proximo_contato), hoje);
        });
        setLeadsHoje(paraHoje);

        // Demonstrações Marcadas
        const demos = leads.filter(l => l.status === 'Reunião agendada').length;
        setQtdDemonstracoes(demos);

        // Em Negociação
        const negociacao = leads.filter(l => l.status === 'Em negociação').length;
        setQtdNegociacao(negociacao);

        // Pipeline Stages
        setPipelineData([
          { name: "Prospectada", count: leads.filter(l => l.status === 'Prospectada').length, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700" },
          { name: "Em Contato", count: leads.filter(l => l.status === 'Em contato' || l.status === 'Entrar em contato').length, color: "bg-indigo-500", light: "bg-indigo-50", text: "text-indigo-700" },
          { name: "Reunião Agendada", count: demos, color: "bg-yellow-500", light: "bg-yellow-50", text: "text-yellow-700" },
          { name: "Proposta Enviada", count: leads.filter(l => l.status === 'Proposta enviada').length, color: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700" },
          { name: "Em Negociação", count: negociacao, color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700" },
        ]);
      }
      setLoadingLeads(false);
    };

    fetchDashboardData();
  }, []);

  const metaProgress = Math.min(Math.round((clientesNovos / metaCount) * 100), 100);
  const faltam = Math.max(metaCount - clientesNovos, 0);

  const handleWhatsapp = (lead: any) => {
    const phone = lead.telefone?.replace(/\D/g, '') || '';
    if (!phone) {
      toast.error("Telefone não cadastrado.");
      return;
    }
    const nome = lead.contato_principal?.split(' ')[0] || lead.nome?.split(' ')[0] || 'Cliente';
    const text = encodeURIComponent(`Olá ${nome}, tudo bem?`);
    window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
  };

  const handleOpenLog = (lead: any) => {
    setActiveLeadLog(lead);
    setLogText("");
    setIsLogDialogOpen(true);
  };

  const handleSaveLog = () => {
    if (!logText.trim()) return;
    toast.success("Histórico registrado com sucesso!");
    setIsLogDialogOpen(false);
  };

  const handleCompleteTask = (id: string) => {
    setCompletingTask(id);
    setTimeout(() => {
      setCompletedTasks(prev => [...prev, id]);
      setCompletingTask(null);
      toast.success("Tarefa concluída!");
    }, 800);
  };

  return (
    <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Comercial</h1>
          <p className="text-muted-foreground font-medium">Visão geral das operações e prioridades do dia.</p>
        </div>
        
        <div className="flex items-center">
          <Select defaultValue="mes">
            <SelectTrigger className="w-[180px] bg-white rounded-xl shadow-sm border-gray-200">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Meta do Mês */}
        <Card 
          className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer"
          onClick={() => setSelectedKpi("meta")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Meta do Mês</CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors z-20">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-end justify-between mb-3">
              <div className="text-3xl font-bold tracking-tight text-gray-900">
                {clientesNovos} <span className="text-xl text-gray-400 font-medium">/ {metaCount}</span>
              </div>
              <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs px-2 py-0.5">{metaProgress}%</Badge>
            </div>
            
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${metaProgress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-indigo-400 to-indigo-600'}`}
                style={{ width: `${metaProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {faltam > 0 ? `Faltam ${faltam} clientes para bater a meta` : 'Meta batida! Parabéns! 🎉'}
            </p>
          </CardContent>
        </Card>
        
        {/* Card 2: P/ Contatar Hoje */}
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wider">P/ Contatar Hoje</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <PhoneCall className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-gray-900">{leadsHoje.length}</div>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {leadsHoje.length === 0 ? "Sem contatos pendentes" : `${leadsHoje.length} agendados para hoje`}
            </p>
          </CardContent>
        </Card>
        
        {/* Card 3: Demonstrações Marcadas */}
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Demonstrações Marcadas</CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
              <Calendar className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-gray-900">{qtdDemonstracoes}</div>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {qtdDemonstracoes === 0 ? "Nenhuma reunião na agenda" : "Reuniões agendadas"}
            </p>
          </CardContent>
        </Card>
        
        {/* Card 4: Em Negociação */}
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Em Negociação</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Briefcase className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-gray-900">{qtdNegociacao}</div>
            <p className="text-xs text-gray-500 mt-1 font-medium">Leads na etapa final</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Funil de Vendas (Pipeline) */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" /> Funil de Vendas / Pipeline
          </h2>
          <p className="text-sm text-gray-500">Distribuição dos leads por status ativo no período.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {pipelineData.map((stage, idx) => (
            <div 
              key={idx} 
              className="group relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <Badge className={`${stage.light} ${stage.text} border-0 font-semibold shadow-none pointer-events-none text-[10px]`}>
                  Estágio {idx + 1}
                </Badge>
                <div className={`h-8 w-8 rounded-full ${stage.color} text-white flex items-center justify-center font-bold shadow-sm`}>
                  {stage.count}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{stage.name}</h3>

              {idx < pipelineData.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-gray-100 rounded-full items-center justify-center shadow-sm">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Tabelas Interativas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Contatos de Hoje */}
        <Card className="lg:col-span-4 flex flex-col border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg">Contatos Agendados para Hoje</CardTitle>
            <CardDescription>
              Leads que você marcou para entrar em contato no dia de hoje.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold text-gray-500">Empresa</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Contato</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Status</TableHead>
                  <TableHead className="pr-6 text-right text-xs uppercase tracking-wider font-semibold text-gray-500">Ações Rápidas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TooltipProvider delayDuration={200}>
                  {leadsHoje.filter(l => !completedTasks.includes(l.id)).map((lead: any) => (
                    <TableRow 
                      key={lead.id} 
                      className={`group transition-all duration-300 ${completingTask === lead.id ? 'opacity-0 scale-[0.98] -translate-x-4' : 'opacity-100'} hover:bg-gray-50`}
                    >
                      <TableCell className="pl-6 font-medium text-gray-900 py-4">{lead.nome}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-gray-700">{lead.contato_principal || 'Sem nome'}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <PhoneCall className="h-3 w-3" /> {lead.telefone || 'Sem fone'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className="font-semibold bg-indigo-50 text-indigo-700 border-indigo-100">
                          {lead.status || 'Novo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right py-4">
                        <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                                onClick={() => handleWhatsapp(lead)}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Iniciar WhatsApp</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                                onClick={() => handleOpenLog(lead)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Registrar Histórico</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                                onClick={() => handleCompleteTask(lead.id)}
                                disabled={completingTask === lead.id}
                              >
                                {completingTask === lead.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Concluir Tarefa</TooltipContent>
                          </Tooltip>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TooltipProvider>

                {!loadingLeads && leadsHoje.filter(l => !completedTasks.includes(l.id)).length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="h-[280px]">
                      <div className="flex flex-col items-center justify-center text-center text-gray-500 space-y-3">
                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">Tudo limpo por aqui!</h3>
                        <p className="text-sm max-w-[250px]">Você não tem contatos agendados ou já concluiu todas as tarefas de hoje.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {loadingLeads && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                        <span>Carregando contatos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Vendas Fechadas */}
        <Card className="lg:col-span-3 flex flex-col border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg">Fechadas no Mês</CardTitle>
            <CardDescription>
              Últimas propostas aprovadas e com contrato assinado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-3 min-h-[200px]">
              <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                <SearchX className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Ainda sem vendas</h3>
              <p className="text-sm max-w-[200px]">Nenhuma venda fechada neste período. Continue prospectando!</p>
            </div>
          </CardContent>
          <CardFooter className="pt-3 pb-3 border-t border-gray-100 mt-auto bg-gray-50/30">
            <Button variant="ghost" className="w-full text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-9" asChild>
              <Link to="/pipeline">Acessar Pipeline Completo</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Dialog for KPI Details */}
      <Dialog 
        open={!!selectedKpi} 
        onOpenChange={(open) => {
          if (!open) setSelectedKpi(null);
          setEditMeta(metaCount); // Reseta o form ao fechar
        }}
      >
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedKpi === "meta" && "Editar Meta do Mês"}
            </DialogTitle>
            <DialogDescription>
              {selectedKpi === "meta" && "Ajuste o objetivo de novos clientes para este mês."}
            </DialogDescription>
          </DialogHeader>

          {selectedKpi === "meta" ? (
            <div className="py-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="meta">Meta de Clientes (Unidades)</Label>
                <Input 
                  id="meta" 
                  type="number" 
                  className="h-12 text-lg rounded-xl"
                  value={editMeta} 
                  onChange={(e) => setEditMeta(parseInt(e.target.value) || 0)} 
                  min={1}
                />
              </div>
            </div>
          ) : (
            <div className="py-6 flex justify-center text-sm text-gray-500">
              Módulo em desenvolvimento.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedKpi(null)} className="rounded-xl">
              Cancelar
            </Button>
            {selectedKpi === "meta" && (
              <Button 
                onClick={() => {
                  setMetaCount(editMeta);
                  localStorage.setItem('venux_meta', editMeta.toString());
                  setSelectedKpi(null);
                  toast.success("Meta atualizada com sucesso!");
                }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                Salvar Meta
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Log Entry */}
      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Registrar Interação
            </DialogTitle>
            <DialogDescription>
              Adicione um histórico rápido para {activeLeadLog?.nome || 'este lead'}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full h-32 p-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Ex: Cliente atendeu, pediu para retornar amanhã às 14h..."
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSaveLog} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
              Salvar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
