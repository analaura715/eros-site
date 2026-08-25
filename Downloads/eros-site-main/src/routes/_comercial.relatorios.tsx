import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Filter, Download, ArrowDownRight, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_comercial/relatorios')({
  component: RelatoriosFunilComponent,
});

const PIPELINE_STAGES = [
  'Em observação',
  'Prospectada',
  'Entrar em contato',
  'Em contato',
  'Reunião agendada',
  'Em negociação',
  'Proposta enviada',
  'Fechado Ganho'
];

const COLORS = [
  '#94a3b8', // Em observação
  '#3b82f6', // Prospectada
  '#0ea5e9', // Entrar em contato
  '#06b6d4', // Em contato
  '#14b8a6', // Reunião agendada
  '#f59e0b', // Em negociação
  '#8b5cf6', // Proposta enviada
  '#10b981', // Fechado Ganho
];

function RelatoriosFunilComponent() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30dias');

  const fetchLeads = async () => {
    setIsLoading(true);
    // Para um funil real, o ideal é ter tabela de histórico. 
    // Como ainda não temos `lead_historico`, usaremos a data de criação do lead 
    // e o status atual para desenhar a foto do momento.
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setLeads(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    if (!leads.length) return [];
    
    const now = new Date();
    let startDate = new Date(2000, 0, 1);
    let endDate = now;

    switch (periodo) {
      case '7dias':
        startDate = subDays(now, 7);
        break;
      case '30dias':
        startDate = subDays(now, 30);
        break;
      case 'mes':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'trimestre':
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      default: // todos
        break;
    }

    return leads.filter(l => {
      const createdAt = new Date(l.created_at);
      return isWithinInterval(createdAt, { start: startDate, end: endDate });
    });
  }, [leads, periodo]);

  const funnelData = useMemo(() => {
    if (!filteredLeads.length) return [];

    let data = PIPELINE_STAGES.map((stage, index) => {
      const count = filteredLeads.filter(l => l.status === stage).length;
      return {
        name: stage,
        count,
        index,
        color: COLORS[index]
      };
    });

    // Calcula taxas
    const topo = filteredLeads.length; // Total de leads reais no período
    
    return data.map((d, i) => {
      const conversaoGeral = topo > 0 ? ((d.count / topo) * 100).toFixed(1) : '0.0';
      const conversaoEtapa = (i === 0) 
        ? '100.0' 
        : (data[i-1].count > 0 ? ((d.count / data[i-1].count) * 100).toFixed(1) : '0.0');
      
      const dropOff = (i === 0)
        ? '0.0'
        : (100 - Number(conversaoEtapa)).toFixed(1);

      return {
        ...d,
        conversaoGeral: Number(conversaoGeral),
        conversaoEtapa: Number(conversaoEtapa),
        dropOff: Number(dropOff)
      };
    });

  }, [filteredLeads]);

  const totalLeads = filteredLeads.length;
  const ganhos = funnelData.length > 0 ? funnelData[funnelData.length - 1].count : 0;
  const winRate = totalLeads > 0 ? ((ganhos / totalLeads) * 100).toFixed(1) : '0';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-sm">
          <p className="font-semibold text-foreground mb-1">{label}</p>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volume de Leads:</span>
              <span className="font-medium">{data.count}</span>
            </div>
            {data.index > 0 && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Conversão da etapa anterior:</span>
                  <span className="font-medium text-emerald-500">{data.conversaoEtapa}%</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Perda (Drop-off):</span>
                  <span className="font-medium text-red-500">{data.dropOff}%</span>
                </div>
              </>
            )}
            <div className="flex justify-between gap-4 border-t mt-1 pt-1">
              <span className="text-muted-foreground">Conversão Total:</span>
              <span className="font-medium text-primary">{data.conversaoGeral}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background overflow-y-auto">
      
      {/* Header */}
      <div className="relative overflow-hidden border-b px-6 py-8 bg-card shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Relatório de Funil</h1>
            <p className="text-muted-foreground mt-1">Análise completa de conversão e gargalos de vendas.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[180px] bg-background">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="mes">Mês atual</SelectItem>
                <SelectItem value="trimestre">Trimestre atual</SelectItem>
                <SelectItem value="todos">Todo o período</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="bg-background shadow-sm" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" /> Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm border-primary/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">Topo de Funil</CardDescription>
              <CardTitle className="text-4xl font-light">{totalLeads}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Leads totais no período</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-emerald-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Negócios Ganhos</CardDescription>
              <CardTitle className="text-4xl font-light text-emerald-600 dark:text-emerald-400">{ganhos}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Clientes convertidos</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-blue-500/20 overflow-hidden relative bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">Taxa de Conversão (Win Rate)</CardDescription>
              <CardTitle className="text-4xl font-light text-blue-600 dark:text-blue-400">{winRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Do topo até o fechamento</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle>Funil de Vendas (Pipeline)</CardTitle>
            <CardDescription>
              Acompanhe o volume acumulado e a taxa de conversão entre cada etapa do seu processo comercial.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
                    width={140}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                  <Bar 
                    dataKey="count" 
                    fill="var(--color-primary)" 
                    radius={[0, 4, 4, 0]}
                    barSize={40}
                    animationDuration={1500}
                  >
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                      dataKey="count" 
                      position="right" 
                      fill="hsl(var(--foreground))"
                      style={{ fontWeight: 600, fontSize: '14px' }}
                      formatter={(val: number) => val}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabela Detalhada de Conversão */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-lg">Análise de Drop-off (Gargalos)</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Etapa</th>
                  <th className="px-6 py-4 font-medium text-center">Volume Acumulado</th>
                  <th className="px-6 py-4 font-medium text-center">Conversão P/ Próxima</th>
                  <th className="px-6 py-4 font-medium text-center">Taxa de Perda</th>
                  <th className="px-6 py-4 font-medium text-right">Conversão Global</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {funnelData.map((row, i) => (
                  <tr key={row.name} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }} />
                      {row.name}
                    </td>
                    <td className="px-6 py-4 text-center text-lg">{row.count}</td>
                    <td className="px-6 py-4 text-center">
                      {i < funnelData.length - 1 ? (
                        <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-full w-fit mx-auto">
                          <ArrowRight className="w-3 h-3" />
                          {funnelData[i+1].conversaoEtapa}%
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {i < funnelData.length - 1 && funnelData[i+1].dropOff > 0 ? (
                        <div className="flex items-center justify-center gap-1 text-red-500 font-semibold">
                          <ArrowDownRight className="w-3 h-3" />
                          {funnelData[i+1].dropOff}%
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-primary">
                      {row.conversaoGeral}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}
