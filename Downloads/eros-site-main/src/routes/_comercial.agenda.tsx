import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, Clock, PhoneCall, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AgendaForm, AgendaFormValues } from '@/components/forms/agenda-form';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";

// Setup date-fns localizer for react-big-calendar
const locales = {
  'pt-BR': ptBR,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Iniciar na segunda-feira (opcional)
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar as any);

export const Route = createFileRoute('/_comercial/agenda')({
  component: AgendaComponent,
});

const CustomToolbar = (toolbar: any) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };
  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };
  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const label = () => {
    const date = toolbar.date;
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="flex items-center justify-between pb-4 mb-2 border-b">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goToCurrent} className="hidden sm:flex">
          Esta Semana
        </Button>
      </div>
      <div className="text-base font-bold capitalize text-foreground/90 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={goToBack} className="h-8 w-8 rounded-full">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[140px] text-center">{label()}</span>
        <Button variant="ghost" size="icon" onClick={goToNext} className="h-8 w-8 rounded-full">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-[100px]"></div> {/* Spacer for symmetry */}
    </div>
  );
};

const CustomEvent = ({ event }: any) => {
  return (
    <div className="flex flex-col gap-0.5 h-full overflow-hidden justify-start p-1">
      <span className="font-bold text-[11px] leading-tight truncate drop-shadow-sm">
        {event.leads?.nome || event.title}
      </span>
      <span className="text-[10px] leading-tight opacity-90 truncate">
        {event.tipo}
      </span>
    </div>
  );
};

function AgendaComponent() {
  const { auth, state, addNotification } = useStore();
  const [events, setEvents] = useState<any[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [agendaEditando, setAgendaEditando] = useState<Partial<AgendaFormValues> | undefined>(undefined);
  
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchAgenda = async () => {
    const { data, error } = await supabase
      .from('agenda')
      .select('*, leads(nome, telefone)')
      .is('resultado_reuniao', null);
      
    if (error) {
      console.error(error);
      toast.error('Erro ao carregar a agenda. Lembre-se de rodar o SQL no Supabase.');
    } else {
      const formattedEvents = (data || []).map(item => ({
        ...item,
        title: item.titulo,
        start: new Date(item.data_inicio),
        end: new Date(item.data_fim),
      }));
      setEvents(formattedEvents);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, []);

  const onEventDrop = async (data: any) => {
    const { event, start, end } = data;

    // Optimistic Update
    const nextEvents = events.map(e => e.id === event.id ? { ...e, start, end } : e);
    setEvents(nextEvents);

    const { error } = await supabase.from('agenda').update({
      data_inicio: start.toISOString(),
      data_fim: end.toISOString()
    }).eq('id', event.id);

    if (error) {
      toast.error('Erro ao mover evento.');
      fetchAgenda(); // rollback
    } else {
      toast.success('Horário atualizado com sucesso.');
    }
  };

  const onEventResize = async (data: any) => {
    const { event, start, end } = data;

    // Optimistic Update
    const nextEvents = events.map(e => e.id === event.id ? { ...e, start, end } : e);
    setEvents(nextEvents);

    const { error } = await supabase.from('agenda').update({
      data_inicio: start.toISOString(),
      data_fim: end.toISOString()
    }).eq('id', event.id);

    if (error) {
      toast.error('Erro ao redimensionar evento.');
      fetchAgenda(); // rollback
    } else {
      toast.success('Duração atualizada com sucesso.');
    }
  };

  const handleOpenNovaAgenda = () => {
    setAgendaEditando(undefined);
    setIsSheetOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEdit = () => {
    if (!selectedEvent) return;
    setIsEventDialogOpen(false);
    
    // Convert dates for the form
    const start = new Date(selectedEvent.data_inicio);
    const end = new Date(selectedEvent.data_fim);
    const diffMs = end.getTime() - start.getTime();
    const duracaoMinutos = Math.round(diffMs / 60000);
    
    const horaInicio = format(start, 'HH:mm');

    setAgendaEditando({
      id: selectedEvent.id,
      titulo: selectedEvent.titulo,
      descricao: selectedEvent.descricao || '',
      dataInicio: start,
      horaInicio,
      duracaoMinutos,
      tipo: selectedEvent.tipo,
      lead_id: selectedEvent.lead_id || '',
      usuario_id: selectedEvent.usuario_id || '',
      lembrete_anterior: selectedEvent.lembrete_anterior || false,
      lembrete_dia: selectedEvent.lembrete_dia || false,
      horario_lembrete: selectedEvent.horario_lembrete || '08:00',
      email_secretaria: selectedEvent.email_secretaria || '',
      tel_secretaria: selectedEvent.tel_secretaria || '',
    });
    setIsSheetOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      const { error } = await supabase.from('agenda').delete().eq('id', selectedEvent.id);
      if (error) {
        toast.error("Erro ao excluir o evento.");
      } else {
        toast.success("Evento excluído com sucesso.");
        setIsEventDialogOpen(false);
        fetchAgenda();
      }
    }
  };

  const handleSubmitForm = async (data: AgendaFormValues) => {
    // Calcula a data de fim baseada na duração
    const dataFim = new Date(data.dataInicio);
    const [horas, minutos] = data.horaInicio.split(':').map(Number);
    dataFim.setHours(horas, minutos, 0, 0);
    
    const dataInicioFinal = new Date(dataFim);
    
    dataFim.setMinutes(dataFim.getMinutes() + data.duracaoMinutos);

    const payload = {
      titulo: data.titulo,
      descricao: data.descricao,
      data_inicio: dataInicioFinal.toISOString(),
      data_fim: dataFim.toISOString(),
      tipo: data.tipo,
      lead_id: data.lead_id === "none" || data.lead_id === "" ? null : data.lead_id,
      usuario_id: !data.usuario_id || data.usuario_id === "none" || data.usuario_id.length < 36 ? null : data.usuario_id,
      lembrete_anterior: data.lembrete_anterior,
      lembrete_dia: data.lembrete_dia,
      horario_lembrete: data.horario_lembrete || null,
      email_secretaria: data.email_secretaria || null,
      tel_secretaria: data.tel_secretaria || null,
    };

    if (data.id) {
      const { error } = await supabase.from('agenda').update(payload).eq('id', data.id);
      if (error) {
        console.error("Erro no update:", error);
        toast.error(`Erro ao atualizar evento: ${error.message}`);
      } else {
        toast.success("Evento atualizado com sucesso.");
        fetchAgenda();
        setIsSheetOpen(false);
      }
    } else {
      const { error } = await supabase.from('agenda').insert([payload]);
      if (error) {
        console.error("Erro no insert:", error);
        toast.error(`Erro ao agendar: ${error.message}`);
      } else {
        toast.success("Novo evento agendado com sucesso.");
        
        // Disparar notificação se foi atribuído a um usuário específico (simulação local)
        if (data.usuario_id) {
          const atribuidoA = state.users?.find(u => u.id === data.usuario_id);
          if (atribuidoA && data.usuario_id !== auth?.id) {
            addNotification(`Novo evento agendado para você: ${data.titulo}`);
          }
        }
        
        fetchAgenda();
        setIsSheetOpen(false);
      }
    }
  };

  const handleClassificarEvento = async (resultado: string) => {
    if (!selectedEvent) return;
    const { error } = await supabase.from('agenda').update({ resultado_reuniao: resultado }).eq('id', selectedEvent.id);
    if (error) {
      toast.error("Erro ao classificar o evento.");
    } else {
      toast.success(`Evento classificado como: ${resultado}`);
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
      fetchAgenda();
    }
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3b82f6'; // blue (default Reunião)
    if (event.tipo === 'Demonstração') backgroundColor = '#8b5cf6'; // purple
    if (event.tipo === 'Lembrete') backgroundColor = '#f59e0b'; // amber
    if (event.tipo === 'Follow-up') backgroundColor = '#10b981'; // green

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 1,
        color: 'white',
        border: '0px',
        display: 'block',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }
    };
  };

  // Limitar o calendário de 08:00 as 17:30
  const minTime = new Date();
  minTime.setHours(8, 0, 0);
  const maxTime = new Date();
  maxTime.setHours(17, 30, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background overflow-hidden">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b px-6 py-6 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center border border-indigo-500/20 shadow-sm">
            <CalendarIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Agenda Semanal</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie suas reuniões e demonstrações com seus leads.</p>
          </div>
        </div>
        <Button 
          className="relative z-10 shadow-md bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 hover:shadow-lg transition-all duration-300 h-10 px-5 rounded-full text-white"
          onClick={handleOpenNovaAgenda}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 w-full max-w-full overflow-hidden">
        
        {/* Container do Calendário */}
        <div className="bg-card border rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden p-6">
          <style>{`
            .rbc-time-view { border: none !important; border-top: 1px solid hsl(var(--border)) !important; }
            .rbc-time-header { margin-bottom: 8px; }
            .rbc-header { padding: 8px 0; font-weight: 600; font-size: 13px; color: hsl(var(--foreground)); border-bottom: none !important; text-transform: capitalize; }
            .rbc-today { background-color: hsl(var(--primary) / 0.03); }
            .rbc-time-content { border-top: 1px solid hsl(var(--border)) !important; }
            .rbc-timeslot-group { border-bottom: 1px dashed hsl(var(--border)/0.5) !important; min-height: 50px !important; }
            .rbc-day-slot .rbc-time-slot { border-top: 1px dashed hsl(var(--border)/0.2) !important; }
            .rbc-time-column { border-left: 1px solid hsl(var(--border)/0.5) !important; }
            .rbc-time-gutter .rbc-timeslot-group { border-left: none !important; border-bottom: none !important; }
            .rbc-label { font-size: 11px; color: hsl(var(--muted-foreground)); padding: 0 8px; }
            .rbc-event { padding: 0; }
            .rbc-event-content { height: 100%; }
            .rbc-allday-cell { display: none; } /* Ocultar linha de all-day já que usamos horários fixos */
          `}</style>
          
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', minHeight: '600px' }}
            culture="pt-BR"
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            resizable
            selectable
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date)}
            defaultView="week"
            views={['week']}
            step={30}
            timeslots={2}
            min={minTime}
            max={maxTime}
            formats={{
              dayFormat: (date, culture, localizer) => localizer!.format(date, 'EEEE (dd/MM)', culture),
            }}
            components={{
              toolbar: CustomToolbar,
              event: CustomEvent
            }}
          />
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[100vw] sm:max-w-[500px] overflow-y-auto border-l-0 sm:border-l shadow-2xl">
          <SheetHeader className="mb-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <SheetTitle className="text-xl">{agendaEditando ? 'Editar Evento' : 'Agendar Evento'}</SheetTitle>
            </div>
            <SheetDescription className="text-sm">
              Preencha os dados para salvar na sua agenda.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-2">
            <AgendaForm 
              initialData={agendaEditando} 
              onSubmit={handleSubmitForm} 
              onCancel={() => setIsSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider bg-blue-500`}>
                {selectedEvent?.tipo}
              </span>
            </div>
            <DialogTitle className="text-xl mt-2">{selectedEvent?.titulo}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {selectedEvent?.start && format(selectedEvent.start, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-muted-foreground">
                  {selectedEvent?.start && format(selectedEvent.start, "HH:mm")} às {selectedEvent?.end && format(selectedEvent.end, "HH:mm")}
                </p>
              </div>
            </div>

            {selectedEvent?.leads && (
              <div className="flex items-center gap-3 text-sm text-foreground border-t pt-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <PhoneCall className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-xs text-muted-foreground uppercase">Lead Vinculado</p>
                  <p className="font-semibold">{selectedEvent.leads.nome}</p>
                  {selectedEvent.leads.telefone && (
                    <p className="text-muted-foreground text-xs">{selectedEvent.leads.telefone}</p>
                  )}
                </div>
              </div>
            )}

            {selectedEvent?.descricao && (
              <div className="border-t pt-4 text-sm">
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Descrição / Pauta</p>
                <p className="text-foreground whitespace-pre-wrap">{selectedEvent.descricao}</p>
              </div>
            )}

            <div className="border-t pt-4 text-sm">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Classificar Resultado</p>
              {selectedEvent?.resultado_reuniao ? (
                  <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-indigo-500/15 text-indigo-700">
                    {selectedEvent.resultado_reuniao}
                  </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" onClick={() => handleClassificarEvento('Concluída')}>
                    Concluída
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => handleClassificarEvento('Proposta Enviada')}>
                    Proposta Enviada
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => handleClassificarEvento('Proposta a Ser Enviada')}>
                    Proposta a Ser Enviada
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs text-red-600 hover:text-red-700" onClick={() => handleClassificarEvento('Sem Interesse')}>
                    Sem Interesse
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4">
            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>Fechar</Button>
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
