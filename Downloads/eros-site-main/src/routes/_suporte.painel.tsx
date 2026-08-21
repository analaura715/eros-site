import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Building2, LayoutDashboard, Settings, Layers, ListTodo } from "lucide-react";
import { useSuporte } from "@/hooks/useSuporte";
import { Ticket } from "@/types/suporte";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_suporte/painel")({
  component: PainelSuporte,
});

function PainelSuporte() {
  const { fetchChamados, fetchConfiguracoes } = useSuporte();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchChamados();
      setTickets(data);
      const { data: emps } = await supabase.from('empresas').select('id, nome, setor_atuacao');
      if (emps) setEmpresas(emps);
      setLoading(false);
    }
    load();
  }, []);

  // Métricas
  const metrics = useMemo(() => {
    const today = new Date();
    
    // 1. Chamados do dia
    const ticketsToday = tickets.filter(t => t.created_at && isToday(new Date(t.created_at)));
    
    // 2. Empresas atendidas hoje
    const empresasHoje = new Set(ticketsToday.map(t => t.empresa_id)).size;

    // 3. Módulo mais chamado (Geral)
    const moduloCount: Record<string, number> = {};
    tickets.forEach(t => {
      if (t.modulo) {
        moduloCount[t.modulo] = (moduloCount[t.modulo] || 0) + 1;
      }
    });
    let maxModulo = "Nenhum";
    let maxModuloCount = 0;
    Object.entries(moduloCount).forEach(([mod, count]) => {
      if (count > maxModuloCount) {
        maxModuloCount = count;
        maxModulo = mod;
      }
    });

    // 4. Setor com mais chamado (Cruzando com empresa)
    const setorCount: Record<string, number> = {};
    tickets.forEach(t => {
      const emp = empresas.find(e => e.id === t.empresa_id);
      if (emp && emp.setor_atuacao) {
        setorCount[emp.setor_atuacao] = (setorCount[emp.setor_atuacao] || 0) + 1;
      }
    });
    let maxSetor = "Nenhum";
    let maxSetorCount = 0;
    Object.entries(setorCount).forEach(([setor, count]) => {
      if (count > maxSetorCount) {
        maxSetorCount = count;
        maxSetor = setor;
      }
    });

    return {
      ticketsToday: ticketsToday.length,
      empresasHoje,
      maxModulo,
      maxModuloCount,
      maxSetor,
      maxSetorCount,
      chamadosHojeList: ticketsToday
    };
  }, [tickets, empresas]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando painel analítico...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Dashboard de Suporte
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe os indicadores de atendimento e incidentes.
        </p>
      </div>

      {/* Cards KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamados Hoje</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ticketsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tickets abertos no dia atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Atendidas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.empresasHoje}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes diferentes hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulo Mais Crítico</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{metrics.maxModulo}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.maxModuloCount} chamados históricos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setor de Atuação Crítico</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{metrics.maxSetor}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.maxSetorCount} chamados históricos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de chamados do dia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chamados Recentes (Hoje)</CardTitle>
          <CardDescription>Acompanhe os tickets registrados na data de hoje.</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.chamadosHojeList.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum chamado aberto hoje. Ótimo trabalho!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.chamadosHojeList.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-xs">CH-{t.ticket_number}</TableCell>
                    <TableCell className="font-semibold">{t.titulo}</TableCell>
                    <TableCell>{t.empresa?.nome}</TableCell>
                    <TableCell>{t.modulo || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        t.status === 'Aberto' ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20' : 
                        t.status === 'Resolvido' ? 'text-green-500 border-green-200 bg-green-50 dark:bg-green-950/20' : ''
                      }>
                        {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}
