import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, UserPlus, Calendar as CalendarIcon, PhoneCall, RefreshCw, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_comercial/historico')({
  component: HistoricoComponent,
});

type TimelineItem = {
  id: string;
  type: 'lead_created' | 'event_scheduled' | 'lead_updated';
  date: Date;
  title: string;
  description: string;
  clientName: string;
  icon: any;
  color: string;
};

function HistoricoComponent() {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistorico = async () => {
    setIsLoading(true);
    try {
      // Fetch Leads
      const { data: leads } = await supabase.from('leads').select('*');
      
      // Fetch Agenda
      const { data: agenda } = await supabase.from('agenda').select('*, leads(nome)');

      const items: TimelineItem[] = [];

      // Mapear Cadastros de Leads
      if (leads) {
        leads.forEach((lead) => {
          items.push({
            id: `lead_created_${lead.id}`,
            type: 'lead_created',
            date: new Date(lead.created_at),
            title: 'Novo Lead Cadastrado',
            description: `Lead prospectado via ${lead.origem || 'sistema'} com status "${lead.status || 'Em observação'}" e temperatura ${lead.temperatura || 'Morno'}.`,
            clientName: lead.nome,
            icon: UserPlus,
            color: 'text-green-500 bg-green-500/10 border-green-500/20',
          });
        });
      }

      // Mapear Eventos da Agenda
      if (agenda) {
        agenda.forEach((event) => {
          // Evento Agendado (usando a data de criação ou data de início se preferir)
          items.push({
            id: `event_scheduled_${event.id}`,
            type: 'event_scheduled',
            date: new Date(event.created_at || event.data_inicio), 
            title: `Evento Agendado: ${event.tipo}`,
            description: `Pauta: ${event.titulo}. Agendado para ${format(new Date(event.data_inicio), "dd/MM 'às' HH:mm")}`,
            clientName: event.leads?.nome || 'Lead Desconhecido',
            icon: event.tipo === 'Demonstração' ? CalendarIcon : PhoneCall,
            color: event.tipo === 'Demonstração' ? 'text-purple-500 bg-purple-500/10 border-purple-500/20' : 'text-blue-500 bg-blue-500/10 border-blue-500/20',
          });
        });
      }

      // Ordenar do mais recente para o mais antigo
      items.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setTimeline(items);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background overflow-hidden">
      
      <div className="relative overflow-hidden border-b px-6 py-6 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 via-slate-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-500/5 flex items-center justify-center border border-slate-500/20 shadow-sm">
            <Clock className="h-6 w-6 text-slate-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Histórico e Movimentações</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Acompanhe a linha do tempo de interações com seus leads.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto max-w-[900px] w-full mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Nenhuma movimentação registrada ainda.
          </div>
        ) : (
          <div className="relative border-l border-muted-foreground/20 ml-4 md:ml-6 space-y-8 pb-10">
            {timeline.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="relative pl-8 md:pl-10 group">
                  {/* Ponto na linha do tempo */}
                  <div className={`absolute -left-4 md:-left-5 top-1.5 h-8 w-8 md:h-10 md:w-10 rounded-full border-2 flex items-center justify-center ${item.color} shadow-sm group-hover:scale-110 transition-transform duration-300 bg-card`}>
                    <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  
                  {/* Conteúdo do Card */}
                  <div className="bg-card border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{item.clientName}</span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="font-medium text-sm text-foreground/80">{item.title}</span>
                      </div>
                      <time className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded-md w-fit">
                        {format(item.date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
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
