import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useEffect } from 'react';
import { Clock, UserPlus, Calendar as CalendarIcon, ArrowRight, Flame, Trash2, Edit3, Filter, Search, Trophy, CheckCircle2 } from 'lucide-react';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

export const Route = createFileRoute('/_comercial/historico')({
  component: AuditTrailComponent,
});

type ActivityCategory = 'success' | 'purple' | 'blue' | 'warning' | 'danger' | 'neutral';

interface ActivityLog {
  id: string;
  lead_id: string;
  lead_name: string;
  user_name: string;
  action_type: string;
  category: ActivityCategory;
  description: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
}

// Helper para pegar Cores e Ícones
const getCategoryStyles = (category: ActivityCategory) => {
  switch (category) {
    case 'success':
      return { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 };
    case 'purple':
      return { color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', icon: CalendarIcon };
    case 'blue':
      return { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: ArrowRight };
    case 'warning':
      return { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: Flame };
    case 'danger':
      return { color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: Trash2 };
    case 'neutral':
    default:
      return { color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', icon: Edit3 };
  }
};

function AuditTrailComponent() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [filterUser, setFilterUser] = useState('todos');
  const [filterDate, setFilterDate] = useState('todos');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lead_activity_logs')
      .select(`
        *,
        leads (nome),
        usuarios (nome)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar logs:", error);
      toast.error("Erro ao carregar o histórico de atividades. A tabela existe?");
    } else if (data) {
      const formattedLogs: ActivityLog[] = data.map((log: any) => ({
        id: log.id,
        lead_id: log.lead_id,
        lead_name: log.leads?.nome || 'Empresa desconhecida',
        user_name: log.usuarios?.nome || 'Sistema',
        action_type: log.action_type,
        category: log.category as ActivityCategory,
        description: log.description,
        old_value: log.old_value,
        new_value: log.new_value,
        created_at: log.created_at
      }));
      setLogs(formattedLogs);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const uniqueUsers = useMemo(() => Array.from(new Set(logs.map(l => l.user_name))), [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Busca (Nome da empresa ou descrição)
      const q = search.toLowerCase();
      const matchesSearch = log.lead_name.toLowerCase().includes(q) || log.description.toLowerCase().includes(q);
      
      // Filtro de Usuário
      const matchesUser = filterUser === 'todos' || log.user_name === filterUser;
      
      // Filtro de Tipo (Categoria visual)
      const matchesType = filterType === 'todos' || log.category === filterType;

      // Filtro de Data
      let matchesDate = true;
      const logDate = new Date(log.created_at);
      const today = new Date();
      if (filterDate === 'hoje') {
        matchesDate = isWithinInterval(logDate, { start: startOfDay(today), end: endOfDay(today) });
      } else if (filterDate === '7dias') {
        matchesDate = isWithinInterval(logDate, { start: subDays(today, 7), end: endOfDay(today) });
      } else if (filterDate === '30dias') {
        matchesDate = isWithinInterval(logDate, { start: subDays(today, 30), end: endOfDay(today) });
      }

      return matchesSearch && matchesUser && matchesType && matchesDate;
    });
  }, [logs, search, filterUser, filterType, filterDate]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background overflow-hidden">
      
      {/* HEADER DA TELA */}
      <div className="relative overflow-hidden border-b px-6 py-6 bg-card shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-500/5 flex items-center justify-center border border-slate-500/20 shadow-sm">
            <Clock className="h-6 w-6 text-foreground/80" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Trilha de Auditoria (Activity Log)</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Rastreamento completo de alterações e histórico de leads em tempo real.</p>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="relative z-10 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por empresa ou texto..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[200px] h-10">
              <SelectValue placeholder="Tipo de Evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              <SelectItem value="success">Criação / Ganhos</SelectItem>
              <SelectItem value="purple">Agenda / Atividades</SelectItem>
              <SelectItem value="blue">Status / Pipeline</SelectItem>
              <SelectItem value="warning">Temperatura / Dono</SelectItem>
              <SelectItem value="danger">Perdas / Arquivamentos</SelectItem>
              <SelectItem value="neutral">Edições Cadastrais</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-full md:w-[180px] h-10">
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Usuários</SelectItem>
              {uniqueUsers.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-full md:w-[160px] h-10">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo Histórico</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TIMELINE VERTICAL */}
      <div className="flex-1 p-6 overflow-y-auto max-w-[1000px] w-full mx-auto pb-20">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            <span className="animate-pulse">Carregando histórico...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground">Tente limpar os filtros para ver mais resultados.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-border/60 ml-4 md:ml-8 space-y-8">
            {filteredLogs.map((log) => {
              const { color, icon: Icon } = getCategoryStyles(log.category);
              
              return (
                <div key={log.id} className="relative pl-8 md:pl-10 group">
                  {/* Ponto Conector (Ícone) */}
                  <div className={`absolute -left-[17px] md:-left-[21px] top-1.5 h-8 w-8 md:h-10 md:w-10 rounded-full border-2 flex items-center justify-center ${color} shadow-sm bg-background transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  
                  {/* Card do Histórico */}
                  <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm group-hover:border-border transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                      
                      {/* Título e Badge */}
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[15px] text-foreground">{log.lead_name}</span>
                          <span className="text-muted-foreground text-xs">•</span>
                          <span className="font-semibold text-sm text-foreground/80">{log.action_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <div className="h-4 w-4 rounded-full bg-secondary flex items-center justify-center">
                              <span className="text-[9px] uppercase font-bold text-foreground">{log.user_name.charAt(0)}</span>
                            </div>
                            {log.user_name}
                          </span>
                        </div>
                      </div>
                      
                      {/* Data/Hora */}
                      <time className="text-xs font-mono text-muted-foreground bg-muted/40 border px-2.5 py-1 rounded-md w-fit whitespace-nowrap">
                        {format(new Date(log.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                      </time>
                    </div>

                    {/* Descrição e Diff */}
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {log.description}
                    </p>

                    {/* Se houver "De -> Para" (Diff de alterações) */}
                    {(log.old_value || log.new_value) && (
                      <div className="mt-3 bg-muted/30 rounded-lg p-3 border border-border/30 text-xs font-mono flex flex-col gap-1.5">
                        {log.old_value && (
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground w-12 shrink-0">Antes:</span>
                            <span className="text-red-500/80 dark:text-red-400 line-through truncate">
                              {JSON.stringify(log.old_value).replace(/[{""}]/g, ' ')}
                            </span>
                          </div>
                        )}
                        {log.new_value && (
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground w-12 shrink-0">Depois:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                              {JSON.stringify(log.new_value).replace(/[{""}]/g, ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
