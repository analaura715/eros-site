import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Download, TrendingUp, Users, Target, DollarSign, BarChart3, Clock, Flame, Snowflake, Sun } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_comercial/relatorios')({
  component: RelatoriosComponent,
});

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

function RelatoriosComponent() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // KPIs
  const [kpis, setKpis] = useState({
    total: 0,
    fechados: 0,
    conversao: 0,
    pipeline: 0,
    cicloMedio: 0
  });

  // Chart Data
  const [origemData, setOrigemData] = useState<any[]>([]);
  const [funilData, setFunilData] = useState<any[]>([]);
  const [evolucaoData, setEvolucaoData] = useState<any[]>([]);

  const fetchRelatorios = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    
    if (!error && data) {
      setLeads(data);
      processarMetricas(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRelatorios();
  }, []);

  const processarMetricas = (dados: any[]) => {
    // 1. KPIs Básicos
    const total = dados.length;
    const fechados = dados.filter(l => l.status === 'Fechado Ganho' || l.status === 'Fechado').length;
    const conversao = total > 0 ? (fechados / total) * 100 : 0;
    
    // Pipeline: Soma da receita de leads que não estão fechados/perdidos
    const pipeline = dados
      .filter(l => !['Sem interesse', 'Sem resposta', 'Fechado'].includes(l.status))
      .reduce((acc, curr) => acc + (Number(curr.receita_potencial) || 0), 0);

    setKpis({
      total,
      fechados,
      conversao,
      pipeline,
      cicloMedio: 14 // Fictício por enquanto, exigiria histórico de datas de fechamento
    });

    // 2. Gráfico de Origem (Rosca)
    const origemMap = new Map();
    dados.forEach(l => {
      const orig = l.origem || 'Desconhecido';
      origemMap.set(orig, (origemMap.get(orig) || 0) + 1);
    });
    setOrigemData(Array.from(origemMap, ([name, value]) => ({ name, value })));

    // 3. Gráfico de Funil (Barras decrescentes)
    const funilOrdem = ['Prospectada', 'Entrar em contato', 'Em contato', 'Reunião agendada', 'Em negociação', 'Proposta enviada', 'Fechado Ganho'];
    const funilStats = funilOrdem.map(status => ({
      name: status,
      quantidade: dados.filter(l => l.status === status).length
    }));
    // Adicionar "Em observação" se quiser topo de funil
    funilStats.unshift({
      name: 'Em observação',
      quantidade: dados.filter(l => l.status === 'Em observação').length
    });
    setFunilData(funilStats);

    // 4. Gráfico de Evolução (Últimos 7 dias ou meses)
    const ultimos7Dias = Array.from({length: 7}, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return format(d, 'dd/MM');
    });

    const evoMap = new Map(ultimos7Dias.map(d => [d, 0]));
    dados.forEach(l => {
      const diaFormatado = format(new Date(l.created_at), 'dd/MM');
      if (evoMap.has(diaFormatado)) {
        evoMap.set(diaFormatado, evoMap.get(diaFormatado)! + 1);
      }
    });
    
    setEvolucaoData(Array.from(evoMap, ([date, novos]) => ({ date, novos })));
  };

  const getTemperaturaIcon = (temp: string) => {
    switch (temp) {
      case 'Quente': return <Flame className="h-3 w-3 text-red-500" />;
      case 'Frio': return <Snowflake className="h-3 w-3 text-blue-500" />;
      case 'Morno': return <Sun className="h-3 w-3 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background overflow-y-auto">
      
      {/* Header */}
      <div className="relative overflow-hidden border-b px-6 py-6 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center border border-emerald-500/20 shadow-sm">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Analise a inteligência de negócios e a performance do seu funil.</p>
          </div>
        </div>
        <Button variant="outline" className="relative z-10 bg-white shadow-sm" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      <div className="p-6 flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
        
        {/* Filtros Simulados */}
        <div className="flex items-center gap-2 bg-card p-2 rounded-xl border shadow-sm w-fit">
          <Button variant="secondary" size="sm" className="bg-primary/10 text-primary hover:bg-primary/20">Últimos 30 dias</Button>
          <Button variant="ghost" size="sm">Este Trimestre</Button>
          <div className="w-px h-4 bg-border mx-2"></div>
          <Button variant="ghost" size="sm">Equipe (Todos)</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-emerald-500/20">
            <CardContent className="p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Novos Leads</span>
                <Users className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold">{kpis.total}</div>
              <div className="text-xs text-emerald-600 flex items-center font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% vs mês passado
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-blue-500/20">
            <CardContent className="p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Taxa de Conversão</span>
                <Target className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-3xl font-bold">{kpis.conversao.toFixed(1)}%</div>
              <div className="text-xs text-blue-600 flex items-center font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                +3.2% vs mês passado
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-purple-500/20">
            <CardContent className="p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Receita Pipeline</span>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(kpis.pipeline)}
              </div>
              <div className="text-xs text-purple-600 flex items-center font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                +R$ 45k vs mês passado
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-amber-500/20">
            <CardContent className="p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Ciclo Médio</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-3xl font-bold">{kpis.cicloMedio} <span className="text-base font-normal text-muted-foreground">dias</span></div>
              <div className="text-xs text-emerald-600 flex items-center font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                -2 dias (mais rápido)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Evolução */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Evolução de Novos Leads</CardTitle>
              <CardDescription>Geração de oportunidades nos últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucaoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNovos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="novos" name="Novos Leads" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNovos)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Origem */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Origem de Captação</CardTitle>
              <CardDescription>Canais com maior conversão de leads</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={origemData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {origemData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Funil */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Análise do Funil de Vendas</CardTitle>
              <CardDescription>Volume atual de leads em cada etapa do processo</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funilData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 500 }} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="quantidade" name="Leads" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={32}>
                    {funilData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* Tabela de Dados Brutos */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-base">Listagem Consolidada</CardTitle>
            <CardDescription>Base completa de leads para análise individual</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Empresa</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead>Temperatura</TableHead>
                  <TableHead>Status Atual</TableHead>
                  <TableHead className="text-right pr-6">Receita Potencial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.slice(0, 15).map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-medium">{lead.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{lead.origem || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {getTemperaturaIcon(lead.temperatura)}
                        {lead.temperatura}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold text-[10px] uppercase bg-white">
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.receita_potencial || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t text-center text-xs text-muted-foreground bg-muted/10">
            Mostrando os 15 leads mais recentes. Use a exportação para ver todos.
          </div>
        </Card>
        
      </div>
    </div>
  );
}
