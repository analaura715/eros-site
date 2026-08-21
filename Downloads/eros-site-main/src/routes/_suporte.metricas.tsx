import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useSuporte } from "@/hooks/useSuporte";
import { Ticket } from "@/types/suporte";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Activity, CheckCircle2, Building2 } from "lucide-react";
import { format, parseISO, isSameMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import _ from "lodash";

export const Route = createFileRoute("/_suporte/metricas")({
  component: SuporteRelatoriosPage,
});

function SuporteRelatoriosPage() {
  const { fetchChamados, loading } = useSuporte();
  const [chamados, setChamados] = useState<Ticket[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

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

  // Filtrar chamados do mês selecionado
  const chamadosDoMes = useMemo(() => {
    if (!chamados.length) return [];
    const [year, month] = selectedMonth.split("-").map(Number);
    const targetDate = new Date(year, month - 1);
    
    return chamados.filter(c => {
      if (!c.created_at) return false;
      return isSameMonth(parseISO(c.created_at), targetDate);
    });
  }, [chamados, selectedMonth]);

  // Calcular métricas
  const metricas = useMemo(() => {
    const total = chamadosDoMes.length;
    const resolvidos = chamadosDoMes.filter(c => c.status === "Resolvido").length;
    const taxaResolucao = total > 0 ? Math.round((resolvidos / total) * 100) : 0;

    // Agrupar por módulo para achar o mais requisitado
    const porModulo = _.countBy(chamadosDoMes, 'modulo');
    let moduloCritico = "N/A";
    let maxModulo = 0;
    Object.entries(porModulo).forEach(([mod, count]) => {
      if (mod && mod !== 'undefined' && count > maxModulo) {
        maxModulo = count;
        moduloCritico = mod;
      }
    });

    // Agrupar por cliente
    const porClienteObj = _.groupBy(chamadosDoMes, c => c.empresa?.nome || "Cliente Desconhecido");
    const porCliente = Object.entries(porClienteObj)
      .map(([nome, tickets]) => ({
        nome,
        total: tickets.length,
        resolvidos: tickets.filter(t => t.status === "Resolvido").length
      }))
      .sort((a, b) => b.total - a.total); // Ordenar por quem abriu mais

    return { total, resolvidos, taxaResolucao, moduloCritico, porCliente };
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

        <div className="w-full sm:w-64">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="bg-background shadow-sm h-10 capitalize">
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
        </div>
      </div>

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
            <p className="text-xs text-muted-foreground mt-1">{metricas.resolvidos} resolvidos de {metricas.total}</p>
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
            <p className="text-xs text-muted-foreground mt-1">Módulo com mais requisições</p>
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
                      <TableCell className="text-center text-amber-600 dark:text-amber-400 font-medium">
                        {cliente.total - cliente.resolvidos}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
