import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Phone, DollarSign, GripHorizontal } from "lucide-react";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export const Route = createFileRoute('/_comercial/pipeline')({
  component: PipelineComponent,
});

const PIPELINE_COLUMNS = [
  { id: 'Em observação', title: 'Em Observação', color: 'bg-slate-500' },
  { id: 'Prospectada', title: 'Prospectada', color: 'bg-indigo-500' },
  { id: 'Entrar em contato', title: 'Entrar em Contato', color: 'bg-amber-500' },
  { id: 'Em contato', title: 'Em Contato', color: 'bg-orange-500' },
  { id: 'Reunião agendada', title: 'Reunião Agendada', color: 'bg-teal-500' },
  { id: 'Em negociação', title: 'Em Negociação', color: 'bg-purple-500' },
  { id: 'Proposta enviada', title: 'Proposta Enviada', color: 'bg-blue-500' },
  { id: 'Sem interesse', title: 'Sem Interesse', color: 'bg-red-500' },
  { id: 'Sem resposta', title: 'Sem Resposta', color: 'bg-gray-400' },
];

function PipelineComponent() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(error);
      toast.error('Erro ao buscar leads do pipeline.');
    } else {
      setLeads(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const leadId = draggableId;

    // Otimista: Atualiza a UI primeiro
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );

    // Atualiza no banco
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId);

    if (error) {
      toast.error('Erro ao atualizar o status do lead.');
      fetchLeads(); // Reverte a UI em caso de erro
    } else {
      toast.success(`Lead movido para "${newStatus}".`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background overflow-hidden">
      <div className="relative overflow-hidden border-b px-6 py-6 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <div className="flex flex-col gap-1 relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">Pipeline de Vendas (Kanban)</h1>
          <p className="text-sm text-muted-foreground">Arraste os cards para alterar o status dos leads automaticamente.</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-max">
            {PIPELINE_COLUMNS.map((col) => {
              const colLeads = leads.filter(l => l.status === col.id);
              const totalReceita = colLeads.reduce((acc, curr) => acc + (Number(curr.receita_potencial) || 0), 0);

              return (
                <div key={col.id} className="flex flex-col min-w-[320px] max-w-[320px] bg-muted/30 rounded-xl border shrink-0 h-full overflow-hidden">
                  <div className="p-4 flex flex-col gap-2 border-b bg-card shrink-0 shadow-sm z-10">
                    <div className="flex items-center justify-between font-semibold">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${col.color} shadow-sm`}></div>
                        <span className="text-sm">{col.title}</span>
                      </div>
                      <Badge variant="secondary" className="px-2 font-mono">{colLeads.length}</Badge>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground flex justify-between">
                      <span>Receita Estimada</span>
                      <span className="text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceita)}
                      </span>
                    </div>
                  </div>
                  
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 space-y-3 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                      >
                        {colLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <Card 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`shadow-sm border-l-4 ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2 scale-105 z-50 border-primary' : 'hover:border-primary/50'
                                } transition-all cursor-grab active:cursor-grabbing group`}
                                style={{
                                  borderLeftColor: `var(--${col.color.replace('bg-', '')})`,
                                  ...provided.draggableProps.style
                                }}
                              >
                                <CardContent className="p-3 flex flex-col gap-3 relative">
                                  <div 
                                    {...provided.dragHandleProps} 
                                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                  >
                                    <GripHorizontal className="h-4 w-4" />
                                  </div>

                                  <div className="pr-6">
                                    <h3 className="font-semibold text-sm line-clamp-1">{lead.nome}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{lead.contato_principal || 'Sem contato'}</p>
                                  </div>
                                  
                                  {lead.receita_potencial > 0 && (
                                    <div className="text-sm font-bold text-green-600 dark:text-green-500 flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(lead.receita_potencial)}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between mt-1 pt-3 border-t">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      <span className="truncate max-w-[120px]">{lead.telefone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {lead.temperatura === 'Quente' && <span className="text-xs">🔥</span>}
                                      {lead.temperatura === 'Frio' && <span className="text-xs">❄️</span>}
                                      {lead.temperatura === 'Morno' && <span className="text-xs">☀️</span>}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
