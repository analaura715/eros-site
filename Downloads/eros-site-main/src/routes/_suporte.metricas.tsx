import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useSuporte } from "@/hooks/useSuporte";
import { Ticket } from "@/types/suporte";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Activity, CheckCircle2, Building2, Clock, Layers, Filter, FileText } from "lucide-react";
import { PieChart, Pie, Legend, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO, isSameMonth, subMonths, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ReportsFilterPanel } from "@/components/suporte/reports-filter-panel";
import _ from "lodash";

export const Route = createFileRoute("/_suporte/metricas")({
  component: SuporteRelatoriosPage,
});

function SuporteRelatoriosPage() {
  const { fetchChamados, loading } = useSuporte();
  const [chamados, setChamados] = useState<Ticket[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [previewData, setPreviewData] = useState<Ticket[] | null>(null);

  useEffect(() => {
    fetchChamados().then(data => setChamados(data));
  }, [fetchChamados]);

  // Gerar opções de meses (últimos 12 meses)
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const d = subMonths(new Date(), i);
      options.push({
        value: format(d, "yyyy-MM"),
        label: format(d, "MMMM 'de' yyyy", { locale: ptBR })
      });
    }
    return options;
  }, []);

  // Filtrar chamados do mês selecionado ou usar os dados de preview
  const chamadosDoMes = useMemo(() => {
    if (previewData) return previewData;
    if (!chamados.length) return [];
    const [year, month] = selectedMonth.split("-").map(Number);
    const targetDate = new Date(year, month - 1);
    
    return chamados.filter(c => {
      if (!c.created_at) return false;
      return isSameMonth(parseISO(c.created_at), targetDate);
    });
  }, [chamados, selectedMonth, previewData]);

  // Calcular métricas
  const metricas = useMemo(() => {
    const total = chamadosDoMes.length;
    const resolvidos = chamadosDoMes.filter(c => c.status === "Resolvido").length;
    const cancelados = chamadosDoMes.filter(c => c.status === "Cancelado").length;
    const baseResolucao = total - cancelados;
    const taxaResolucao = baseResolucao > 0 ? Math.round((resolvidos / baseResolucao) * 100) : 0;

    // Calcular TMA global
    let totalMinutos = 0;
    let countResolvidosValidos = 0;
    
    chamadosDoMes.forEach(c => {
      if (c.status === "Resolvido" && c.created_at) {
        const start = parseISO(c.created_at);
        const end = c.data_fim ? parseISO(c.data_fim) : c.deletado_em ? parseISO(c.deletado_em) : new Date(start.getTime() + 60 * 60 * 1000);
        totalMinutos += Math.max(0, differenceInMinutes(end, start));
        countResolvidosValidos++;
      }
    });
    
    const tmaGlobalMinutos = countResolvidosValidos > 0 ? totalMinutos / countResolvidosValidos : 0;
    
    const formatarTMA = (minutos: number) => {
      if (isNaN(minutos) || minutos === 0) return "0h";
      const h = Math.floor(minutos / 60);
      const m = Math.round(minutos % 60);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    };

    // Agrupar por módulo para achar o mais requisitado e montar gráfico
    const porModuloObj = _.countBy(chamadosDoMes, c => c.modulo || 'Outros');
    let moduloCritico = "N/A";
    let maxModulo = 0;
    const moduloData = Object.entries(porModuloObj).map(([name, value]) => {
      if (value > maxModulo) {
        maxModulo = value;
        moduloCritico = name;
      }
      return { name, value, percentual: total > 0 ? ((value / total) * 100).toFixed(1) : "0" };
    }).sort((a, b) => b.value - a.value);

    // Agrupar por cliente para a tabela analítica
    const porClienteObj = _.groupBy(chamadosDoMes, c => c.empresa_id ? (c.empresa?.nome || "Cliente Desconhecido") : (c.solicitante || "Cliente Desconhecido"));
    
    const porCliente = Object.entries(porClienteObj)
      .map(([nome, tickets]) => {
        // Encontrar módulo principal do cliente
        const mods = _.countBy(tickets, c => c.modulo || 'Outros');
        const moduloPrincipal = Object.entries(mods).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
        
        // Calcular TMA do cliente
        let clienteMinutos = 0;
        let clienteRes = 0;
        tickets.forEach(c => {
          if (c.status === "Resolvido" && c.created_at) {
            const start = parseISO(c.created_at);
            const end = c.data_fim ? parseISO(c.data_fim) : c.deletado_em ? parseISO(c.deletado_em) : new Date(start.getTime() + 60 * 60 * 1000);
            clienteMinutos += Math.max(0, differenceInMinutes(end, start));
            clienteRes++;
          }
        });
        const tmaCliente = clienteRes > 0 ? clienteMinutos / clienteRes : 0;

        return {
          nome,
          total: tickets.length,
          resolvidos: tickets.filter(t => t.status === "Resolvido").length,
          cancelados: tickets.filter(t => t.status === "Cancelado").length,
          percentual: total > 0 ? ((tickets.length / total) * 100).toFixed(1) : "0",
          moduloPrincipal,
          tma: formatarTMA(tmaCliente),
          tmaValue: tmaCliente
        };
      })
      .sort((a, b) => b.total - a.total);

    return { 
      total, 
      resolvidos, 
      taxaResolucao, 
      moduloCritico, 
      chamadosModuloCritico: maxModulo, 
      porCliente, 
      baseResolucao,
      tmaGlobal: formatarTMA(tmaGlobalMinutos),
      moduloData
    };
  }, [chamadosDoMes]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando relatórios...</div>;
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto py-6 px-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart className="w-6 h-6 text-primary" /> Relatórios do Suporte
          </h1>
          <p className="text-sm text-muted-foreground">Métricas e fechamento mensal de chamados.</p>
        </div>

        <div className="flex w-full sm:w-auto gap-2 items-center">
          <Select value={selectedMonth} onValueChange={(val) => {
            setSelectedMonth(val);
            setPreviewData(null); // Limpa o preview se mudar o mês base
          }}>
            <SelectTrigger className="bg-background shadow-sm h-10 w-full sm:w-48 capitalize">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(m => (
                <SelectItem key={m.value} value={m.value} className="capitalize">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <a 
            href="/suporte/relatorio-gerencial" 
            target="_blank"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-white shadow-sm hover:bg-slate-50 text-slate-700 h-10 px-4 py-2 gap-2"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Relatório PDF</span>
          </a>
          
          <ReportsFilterPanel 
            chamados={chamados} 
            onPreviewUpdate={setPreviewData} 
          />
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-[800px] mb-6">
          <TabsTrigger value="geral">Métricas Gerais</TabsTrigger>
          <TabsTrigger value="descricoes">Descrições de Chamados</TabsTrigger>
          <TabsTrigger value="analise">Análise de Chamados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="geral" className="mt-0">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card className="bg-card shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Chamados no Mês</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metricas.total}</div>
                <p className="text-xs text-muted-foreground mt-1">Total de tickets abertos no período</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Resolução</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metricas.taxaResolucao}%</div>
                <p className="text-xs text-muted-foreground mt-1">{metricas.resolvidos} resolvidos de {metricas.baseResolucao} válidos</p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Empresas Atendidas</CardTitle>
                <Building2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metricas.porCliente.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Clientes distintos que abriram ticket</p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Módulo Crítico</CardTitle>
                <BarChart className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold truncate" title={metricas.moduloCritico}>{metricas.moduloCritico}</div>
                <p className="text-xs text-muted-foreground mt-1">{metricas.chamadosModuloCritico} chamados neste módulo</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Clientes */}
          <Card className="shadow-sm border-muted/60">
            <CardHeader>
              <CardTitle>Requisições por Cliente</CardTitle>
              <CardDescription>Detalhamento de quantos chamados cada cliente abriu no mês selecionado.</CardDescription>
            </CardHeader>
            <CardContent>
              {metricas.porCliente.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  Nenhum chamado encontrado para o mês selecionado.
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead className="text-center w-32">Total de Chamados</TableHead>
                        <TableHead className="text-center w-32">Resolvidos</TableHead>
                        <TableHead className="text-center w-32">Cancelados</TableHead>
                        <TableHead className="text-center w-32">Pendentes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metricas.porCliente.map((cliente, index) => (
                        <TableRow key={index} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{cliente.nome}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{cliente.total}</TableCell>
                          <TableCell className="text-center text-emerald-600 dark:text-emerald-400 font-medium">
                            {cliente.resolvidos}
                          </TableCell>
                          <TableCell className="text-center text-red-600 dark:text-red-400 font-medium">
                            {cliente.cancelados}
                          </TableCell>
                          <TableCell className="text-center text-amber-600 dark:text-amber-400 font-medium">
                            {cliente.total - cliente.resolvidos - cliente.cancelados}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="descricoes" className="mt-0">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Descrições de Chamados</CardTitle>
              <CardDescription>Detalhamento de tickets abertos no período.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Ticket</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead className="hidden md:table-cell">Descrição</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chamadosDoMes.map((c) => (
                      <TableRow key={c.ticket_number || c.id}>
                        <TableCell className="font-medium">#{c.ticket_number}</TableCell>
                        <TableCell>{c.empresa?.nome || c.solicitante || '-'}</TableCell>
                        <TableCell>{c.titulo}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[300px] truncate text-muted-foreground">
                          {c.descricao || 'Sem descrição'}
                        </TableCell>
                        <TableCell>{c.status}</TableCell>
                      </TableRow>
                    ))}
                    {chamadosDoMes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          Nenhum chamado encontrado no período.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise" className="mt-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Dashboard Analítico</h2>
                <p className="text-sm text-muted-foreground">Visão aprofundada de volume, status e tempos de atendimento.</p>
              </div>
              <button 
                onClick={() => window.print()}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Exportar PDF
              </button>
            </div>

            {/* 4 KPIs do Dashboard */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-white dark:bg-slate-900 border-muted shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Total de Chamados</CardTitle>
                  <Activity className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metricas.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">Registrados no mês selecionado</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900 border-muted shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">TMA Global</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metricas.tmaGlobal}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tempo Médio de Atendimento</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900 border-muted shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Módulo Mais Demandado</CardTitle>
                  <Layers className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold truncate" title={metricas.moduloCritico}>{metricas.moduloCritico}</div>
                  <p className="text-xs text-muted-foreground mt-1">{metricas.chamadosModuloCritico} chamados ({(metricas.total > 0 ? (metricas.chamadosModuloCritico / metricas.total * 100) : 0).toFixed(1)}%)</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900 border-muted shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Taxa de Resolução</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metricas.taxaResolucao}%</div>
                  <p className="text-xs text-muted-foreground mt-1">{metricas.resolvidos} resolvidos com sucesso</p>
                </CardContent>
              </Card>
            </div>

            {/* Grid de Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Chamados por Módulo</CardTitle>
                  <CardDescription>Volume e representatividade por área do sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {metricas.moduloData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={metricas.moduloData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                          <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value: any, name: any, props: any) => [`${value} chamados (${props.payload.percentual}%)`, 'Quantidade']} />
                          <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">Nenhum dado no período.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Status dos Chamados</CardTitle>
                  <CardDescription>Proporção atual do andamento dos tickets.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {chamadosDoMes.length > 0 ? (() => {
                      const statusData = Object.entries(_.countBy(chamadosDoMes, 'status')).map(([name, value]) => ({ name, value }));
                      const COLORS_PIE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={100}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })() : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">Nenhum dado no período selecionado.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Ranking por Empresa */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Ranking de Chamados por Empresa / Cliente</CardTitle>
                <CardDescription>Listagem detalhada das empresas com maior volume de requisições e seus principais ofensores.</CardDescription>
              </CardHeader>
              <CardContent>
                {metricas.porCliente.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded border border-dashed">
                    Nenhuma empresa registrou chamados neste mês.
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow>
                          <TableHead className="w-16 text-center">Pos</TableHead>
                          <TableHead>Empresa (Cliente)</TableHead>
                          <TableHead className="text-center">Qtd. Chamados</TableHead>
                          <TableHead className="text-center">% do Mês</TableHead>
                          <TableHead>Módulo Mais Solicitado</TableHead>
                          <TableHead>TMA (Empresa)</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metricas.porCliente.slice(0, 15).map((cliente, index) => (
                          <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <TableCell className="text-center font-bold text-slate-400">#{index + 1}</TableCell>
                            <TableCell className="font-medium">{cliente.nome}</TableCell>
                            <TableCell className="text-center font-bold text-indigo-600 dark:text-indigo-400">{cliente.total}</TableCell>
                            <TableCell className="text-center text-slate-500">{cliente.percentual}%</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                {cliente.moduloPrincipal}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400 font-medium">{cliente.tma}</TableCell>
                            <TableCell className="text-right">
                              <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
                                <Filter className="w-3 h-3 mr-1" /> Ver Chamados
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {metricas.porCliente.length > 15 && (
                  <div className="text-xs text-center text-slate-500 mt-4">
                    Exibindo apenas o Top 15. Filtre ou exporte os dados para ver os {metricas.porCliente.length} clientes.
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
