import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, PhoneCall, AlertTriangle, Target, Clock, ArrowUpRight, Pencil, Star, Briefcase } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute('/_comercial/dashboard')({
  component: DashboardComponent,
});

function DashboardComponent() {
  const navigate = useNavigate();
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [leadsHoje, setLeadsHoje] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  
  // Meta Editável
  const [metaCount, setMetaCount] = useState<number>(() => {
    const saved = localStorage.getItem('nexa_meta');
    return saved ? parseInt(saved) : 5;
  });
  const [editMeta, setEditMeta] = useState<number>(metaCount);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingLeads(true);
      // Busca leads que a data_proximo_contato seja hoje
      const hoje = new Date();
      // Como o campo é um TIMESTAMP, precisamos buscar o que cai no dia de hoje
      // Vamos buscar todos os leads que tem data e filtrar no JS para ser seguro com os TZ
      const { data } = await supabase
        .from('leads')
        .select('*')
        .not('data_proximo_contato', 'is', null);

      if (data) {
        const paraHoje = data.filter(lead => {
          if (!lead.data_proximo_contato) return false;
          return isSameDay(new Date(lead.data_proximo_contato), hoje);
        });
        setLeadsHoje(paraHoje);
      }
      setLoadingLeads(false);
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Comercial</h1>
          <p className="text-muted-foreground">Visão geral das operações e prioridades do dia.</p>
        </div>
        
        <div className="flex items-center">
          <Select defaultValue="mes">
            <SelectTrigger className="w-[180px]">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="border-primary/20 bg-primary/5 cursor-pointer transition-colors hover:bg-primary/10"
          onClick={() => setSelectedKpi("meta")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Meta do Mês</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metaCount} Clientes Novos</div>
            <p className="text-xs text-muted-foreground uppercase font-medium mt-1 tracking-wider">Meta Mês Atual</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => setSelectedKpi("contatos")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes P/ Contatar Hoje</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsHoje.length}</div>
            <p className="text-xs text-muted-foreground">
              {leadsHoje.length === 0 ? "Sem contatos pendentes" : `${leadsHoje.length} para hoje`}
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => setSelectedKpi("prioridade")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Prioridade Alta</CardTitle>
            <Star className="h-4 w-4 text-orange-500 fill-orange-500/20" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Nenhuma pendência imediata</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => setSelectedKpi("negociacao")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Em Negociação</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">R$ 0 estimados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Contatos de Hoje */}
        <Card className="lg:col-span-4 flex flex-col">
          <CardHeader>
            <CardTitle>Contatos Agendados para Hoje</CardTitle>
            <CardDescription>
              Leads que você marcou para entrar em contato no dia de hoje.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center"></TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsHoje.map((lead: any) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate({ to: '/leads' })}>
                    <TableCell className="text-center align-middle">
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <PhoneCall className="h-3.5 w-3.5 text-muted-foreground" />
                        {lead.contato_principal || 'Sem nome'} ({lead.telefone || 'Sem fone'})
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium bg-blue-100 text-blue-700 hover:bg-blue-200">
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="Ir para Leads" className="text-muted-foreground hover:text-primary">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingLeads && leadsHoje.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum contato agendado para hoje.
                    </TableCell>
                  </TableRow>
                )}
                {loadingLeads && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Carregando contatos...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Vendas Fechadas */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Fechadas no Mês</CardTitle>
            <CardDescription>
              Últimas propostas aprovadas e com contrato assinado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {([].map((op: any, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{op.empresa}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Fechado</Badge>
                      <span>{op.data}</span>
                    </div>
                  </div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    {op.valor}
                  </div>
                </div>
              )))}
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                Nenhuma venda fechada neste período.
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t mt-auto">
            <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-primary h-8" asChild>
              <Link to="/pipeline">Ver todas do mês</Link>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedKpi === "meta" && "Meta do Mês"}
              {selectedKpi === "contatos" && "Clientes P/ Contatar Hoje"}
              {selectedKpi === "prioridade" && "Clientes Prioridade Alta"}
              {selectedKpi === "negociacao" && "Propostas Em Negociação"}
            </DialogTitle>
            <DialogDescription>
              {selectedKpi === "meta" && "Altere a meta de clientes novos esperados para este mês."}
              {selectedKpi === "contatos" && "Lista dos contatos planejados para o dia de hoje."}
              {selectedKpi === "prioridade" && "Atenção imediata requerida nestas contas."}
              {selectedKpi === "negociacao" && "Detalhes das oportunidades em negociação."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedKpi === "meta" ? (
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta">Quantidade de Clientes Novos (Meta)</Label>
                <Input 
                  id="meta" 
                  type="number" 
                  min="1"
                  value={editMeta} 
                  onChange={(e) => setEditMeta(parseInt(e.target.value) || 0)}
                  className="h-11"
                />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground border-y mt-2">
              Nenhuma informação detalhada mockada para esta tela no momento.
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setSelectedKpi(null)}>Cancelar</Button>
            {selectedKpi === "meta" && (
              <Button onClick={() => {
                setMetaCount(editMeta);
                localStorage.setItem('nexa_meta', editMeta.toString());
                setSelectedKpi(null);
              }}>
                Salvar Meta
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
