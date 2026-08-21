import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, MessageSquare, AlertCircle, CheckCircle2, Clock, LifeBuoy, Tag, Calendar as CalendarIcon, User, Briefcase, Bug, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_suporte/chamados")({
  component: ChamadosPage,
});

import { useSuporte } from "@/hooks/useSuporte";
import { Ticket } from "@/types/suporte";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function ActiveTimer({ startTime }: { startTime: string }) {
  const [timer, setTimer] = useState("00:00:00");
  useEffect(() => {
    const start = new Date(startTime).getTime();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setTimer(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  return <span className="font-mono text-[10px] font-bold ml-2 bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded border border-blue-500/20">{timer}</span>;
}

import { useStore } from "@/lib/store";

function ChamadosPage() {
  const navigate = useNavigate();
  const { auth } = useStore();
  const { 
    fetchChamados, 
    createChamado, 
    updateChamado,
    loading, 
    fetchConfiguracoes, 
    uploadImagensChamado,
    broadcastTicketStarted,
    subscribeToTicketNotifications
  } = useSuporte();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [suporteConfig, setSuporteConfig] = useState<any>(null);
  
  const [ticketToFinalize, setTicketToFinalize] = useState<Ticket | null>(null);
  const [openFinalize, setOpenFinalize] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("todos");
  const [filterModule, setFilterModule] = useState("todos");
  const [filterPeriod, setFilterPeriod] = useState<DateRange | undefined>();
  const [openNew, setOpenNew] = useState(false);
  const [openClientCombobox, setOpenClientCombobox] = useState(false);

  const loadData = async () => {
    const data = await fetchChamados();
    setTickets(data);
    const { data: emps } = await supabase.from('empresas').select('id, nome, funcionarios').order('nome');
    if (emps) setEmpresas(emps);
    
    const config = await fetchConfiguracoes();
    setSuporteConfig(config);
    if (config?.tipos_ticket?.length) setNewType(config.tipos_ticket[0].nome);
    else setNewType("");
  };

  useEffect(() => {
    loadData();
    
    // Inscreve para notificações
    const unsubscribe = subscribeToTicketNotifications((ticket) => {
      toast.info(`${ticket.responsavel || 'Alguém'} iniciou um chamado para ${ticket.empresa_nome}`);
      loadData(); // Recarrega para mostrar na tabela
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newType, setNewType] = useState<string>("Dúvida de Uso");
  const [newModule, setNewModule] = useState("");
  const [newAssignee, setNewAssignee] = useState(auth?.name || "");
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newDateEnd, setNewDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTimeStart, setNewTimeStart] = useState("");
  const [newTimeEnd, setNewTimeEnd] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPriority, setNewPriority] = useState<Ticket["priority"]>("Média");
  const [newDesc, setNewDesc] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Quick create company
  const [openNewCompany, setOpenNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const handleCreateCompany = async () => {
    if(!newCompanyName.trim()) return;
    try {
      const { data, error } = await supabase.from('empresas').insert([{ nome: newCompanyName }]).select().single();
      if(error) throw error;
      await loadData();
      setNewClient(data.id);
      setOpenNewCompany(false);
      setNewCompanyName("");
    } catch(err) {
      alert("Erro ao criar empresa.");
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // Busca em texto
      const matchSearch = t.titulo?.toLowerCase().includes(search.toLowerCase()) || 
                          t.empresa?.nome.toLowerCase().includes(search.toLowerCase()) ||
                          t.ticket_number?.toString().includes(search);
      if (!matchSearch) return false;

      // Filtro Cliente
      if (filterClient !== "todos" && t.empresa_id !== filterClient) return false;

      // Filtro Módulo
      if (filterModule !== "todos" && t.modulo !== filterModule) return false;

      // Filtro Período
      if (filterPeriod?.from && t.created_at) {
        const ticketDate = new Date(t.created_at);
        // Reseta hora para comparar apenas dias
        ticketDate.setHours(0, 0, 0, 0);
        
        const fromDate = new Date(filterPeriod.from);
        fromDate.setHours(0, 0, 0, 0);
        
        if (ticketDate < fromDate) return false;
        
        if (filterPeriod.to) {
          const toDate = new Date(filterPeriod.to);
          toDate.setHours(23, 59, 59, 999);
          if (ticketDate > toDate) return false;
        }
      }

      return true;
    });
  }, [tickets, search, filterClient, filterModule, filterPeriod]);

  const handleStartTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalAssignee = newAssignee || auth?.name;
    
    if (!newClient || !finalAssignee) {
      toast.error("Preencha Empresa e Responsável");
      return;
    }
    
    try {
      const ticket = await createChamado({
        titulo: "Atendimento em andamento...",
        empresa_id: newClient,
        contato_nome: newContact || undefined,
        tipo: suporteConfig?.tipos_ticket?.[0]?.nome || "Dúvida de Uso",
        responsavel: finalAssignee,
        status: "Em Andamento",
        data_inicio: format(new Date(), 'yyyy-MM-dd'),
        hora_inicio: format(new Date(), 'HH:mm'),
      });
      
      const emp = empresas.find(e => e.id === newClient);
      broadcastTicketStarted({
        id: ticket.id,
        empresa_id: newClient,
        empresa_nome: emp?.nome || "",
        contato: newContact,
        responsavel: finalAssignee,
        start_time: Date.now()
      });
      
      await loadData();
      setOpenNew(false);
      resetForm();
      toast.success("Atendimento iniciado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao iniciar chamado.");
    }
  };
  
  const handleCancelTicket = async (ticket: Ticket) => {
    if (!window.confirm("Deseja realmente cancelar este chamado?")) return;
    try {
      await updateChamado(ticket.id, { status: "Cancelado" });
      toast.success("Chamado cancelado com sucesso.");
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'Cancelado' } : t));
      setOpenNewTicket(false);
      clearActiveTicket();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao cancelar o chamado: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleDeleteTicket = async (ticket: Ticket) => {
    if (!window.confirm("ATENÇÃO: Deseja realmente EXCLUIR permanentemente este chamado?")) return;
    try {
      const { error } = await supabase.from('suporte_chamados').delete().eq('id', ticket.id);
      if (error) throw error;
      toast.success("Chamado excluído com sucesso.");
      setTickets(prev => prev.filter(t => t.id !== ticket.id));
      if (ticket.status === 'Em Andamento') {
        clearActiveTicket();
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao excluir o chamado: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketToFinalize) return;
    setIsUploading(true);
    
    try {
      let urls: string[] = ticketToFinalize.imagens || [];
      if (newFiles.length > 0) {
        const newUrls = await uploadImagensChamado(newFiles);
        urls = [...urls, ...newUrls];
      }

      const dataFim = new Date();

      await updateChamado(ticketToFinalize.id, {
        titulo: newTitle,
        descricao: newDesc,
        tipo: newType,
        modulo: newModule || undefined,
        data_fim: format(dataFim, 'yyyy-MM-dd'),
        hora_fim: format(dataFim, 'HH:mm'),
        imagens: urls,
        status: "Resolvido",
        prioridade: newPriority,
      });
      
      await loadData();
      setOpenFinalize(false);
      setTicketToFinalize(null);
      resetForm();
      toast.success("Chamado finalizado e salvo!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao finalizar chamado!");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewClient("");
    setNewContact("");
    setNewType(suporteConfig?.tipos_ticket?.[0]?.nome || "");
    setNewModule("");
    setNewAssignee(auth?.name || "");
    setNewFiles([]);
    setNewPriority("Média");
    setNewDesc("");
  };

  const getStatusBadge = (status: Ticket["status"]) => {
    switch (status) {
      case "Aberto": return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20"><AlertCircle className="w-3 h-3 mr-1"/> Aberto</Badge>;
      case "Em Andamento": return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"><Clock className="w-3 h-3 mr-1"/> Em Andamento</Badge>;
      case "Resolvido": return <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Resolvido</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDynamicColor = (type: 'tipos_ticket' | 'setores' | 'modulos', nome: string) => {
    if (!suporteConfig) return undefined;
    const items = suporteConfig[type];
    if (!Array.isArray(items)) return undefined;
    const found = items.find((i: any) => i.nome === nome || i === nome);
    return found?.cor;
  };

  const getTypeIcon = (type: Ticket["type"]) => {
    switch (type) {
      case "Bug / Erro": return <Bug className="w-3.5 h-3.5 text-red-500" />;
      case "Melhoria": return <Plus className="w-3.5 h-3.5 text-blue-500" />;
      case "Treinamento": return <LifeBuoy className="w-3.5 h-3.5 text-orange-500" />;
      case "Implantação": return <Briefcase className="w-3.5 h-3.5 text-purple-500" />;
      default: return <MessageSquare className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getPriorityColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "Baixa": return "text-slate-500";
      case "Média": return "text-blue-500";
      case "Alta": return "text-orange-500";
      case "Urgente": return "text-red-600 font-bold";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-primary" />
            Controle de Chamados
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os tickets de suporte e atendimento ao cliente.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Modal 1: Iniciar Atendimento */}
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Novo Chamado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl">Iniciar Atendimento</DialogTitle>
                <DialogDescription>
                  Selecione o cliente e responsável para iniciar a contagem de tempo.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleStartTicket} className="space-y-4">
                <div className="space-y-2 flex flex-col">
                  <Label htmlFor="client">Cliente / Empresa <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-2">
                    <Popover open={openClientCombobox} onOpenChange={setOpenClientCombobox}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={openClientCombobox} className="flex-1 justify-between font-normal px-3">
                          {newClient ? empresas.find((emp) => emp.id === newClient)?.nome : "Selecione..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Pesquisar cliente..." />
                          <CommandList>
                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                              {empresas.map((emp) => (
                                <CommandItem key={emp.id} value={emp.nome} onSelect={() => { setNewClient(emp.id); setOpenClientCombobox(false); }}>
                                  <CheckCircle2 className={cn("mr-2 h-4 w-4", newClient === emp.id ? "opacity-100 text-primary" : "opacity-0")} />
                                  {emp.nome}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    <Button 
                      variant="outline" 
                      size="icon" 
                      type="button" 
                      title="Ir para Cadastro de Clientes" 
                      className="shrink-0"
                      onClick={() => navigate({ to: '/clientes' })}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Funcionário da Empresa (Contato)</Label>
                    <Select value={newContact} onValueChange={(val) => {
                      setNewContact(val);
                      const func = empresas.find(e => e.id === newClient)?.funcionarios?.find((f: any) => f.nome === val);
                      if (func?.id_anydesk) {
                        if (func.senha_anydesk && navigator.clipboard) {
                          try {
                            navigator.clipboard.writeText(func.senha_anydesk);
                            toast.success("Senha copiada e abrindo AnyDesk!");
                          } catch (e) {}
                        }
                        window.location.href = `anydesk:${func.id_anydesk.replace(/\s/g, '')}`;
                      } else if (func?.id_rustdesk) {
                        if (func.senha_rustdesk && navigator.clipboard) {
                          try {
                            navigator.clipboard.writeText(func.senha_rustdesk);
                            toast.success("Senha copiada e abrindo RustDesk!");
                          } catch (e) {}
                        }
                        window.location.href = `rustdesk://connect?id=${func.id_rustdesk.replace(/\s/g, '')}`;
                      }
                    }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário..." />
                    </SelectTrigger>
                    <SelectContent>
                      {newClient && empresas.find((e) => e.id === newClient)?.funcionarios?.length > 0 ? (
                        empresas.find((e) => e.id === newClient)?.funcionarios.map((func: any, idx: number) => (
                          <SelectItem key={idx} value={func.nome}>{func.nome}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>Nenhum funcionário cadastrado</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                      {/* Render AnyDesk/RustDesk if selected */}
                    {newContact && newClient && empresas.find(e => e.id === newClient)?.funcionarios?.find((f: any) => f.nome === newContact) && (
                      (() => {
                        const func = empresas.find(e => e.id === newClient)?.funcionarios?.find((f: any) => f.nome === newContact);
                        if (!func?.id_anydesk && !func?.id_rustdesk) return null;
                        return (
                          <div className="flex flex-col gap-2 pt-2 border-t mt-2">
                            <p className="text-xs font-medium text-muted-foreground">Credenciais de Acesso Remoto</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                              {func.id_anydesk && (
                                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-md flex-1">
                                  <Button 
                                    type="button"
                                    size="sm" 
                                    variant="outline" 
                                    title="Criar Chamado e Abrir AnyDesk"
                                    className="h-8 text-xs bg-white text-red-600 hover:bg-red-50 border-red-200 dark:bg-slate-900" 
                                    onClick={() => {
                                      if (func.senha_anydesk && navigator.clipboard) {
                                        try {
                                          navigator.clipboard.writeText(func.senha_anydesk);
                                          toast.success("Senha do AnyDesk copiada para área de transferência!");
                                        } catch (e) {}
                                      }
                                      handleStartTicket();
                                      window.location.href = `anydesk:${func.id_anydesk.replace(/\s/g, '')}`;
                                    }}
                                  >
                                    Abrir AnyDesk
                                  </Button>
                                  {func.senha_anydesk && (
                                    <div className="flex flex-col ml-1">
                                      <span className="text-[10px] text-red-500/80 font-semibold uppercase">Senha</span>
                                      <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{func.senha_anydesk}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {func.id_rustdesk && (
                                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-md flex-1">
                                  <Button 
                                    type="button"
                                    size="sm" 
                                    variant="outline" 
                                    title="Criar Chamado e Abrir RustDesk"
                                    className="h-8 text-xs bg-white text-blue-600 hover:bg-blue-50 border-blue-200 dark:bg-slate-900" 
                                    onClick={() => {
                                      if (func.senha_rustdesk && navigator.clipboard) {
                                        try {
                                          navigator.clipboard.writeText(func.senha_rustdesk);
                                          toast.success("Senha do RustDesk copiada para área de transferência!");
                                        } catch (e) {}
                                      }
                                      handleStartTicket();
                                      window.location.href = `rustdesk://connect?id=${func.id_rustdesk.replace(/\s/g, '')}`;
                                    }}
                                  >
                                    Abrir RustDesk
                                  </Button>
                                  {func.senha_rustdesk && (
                                    <div className="flex flex-col ml-1">
                                      <span className="text-[10px] text-blue-500/80 font-semibold uppercase">Senha</span>
                                      <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{func.senha_rustdesk}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignee">Usuário que iniciou (Responsável) <span className="text-red-500">*</span></Label>
                  <Input id="assignee" value={auth?.name || ""} disabled className="bg-slate-50 dark:bg-slate-900 cursor-not-allowed text-muted-foreground" />
                </div>

                <DialogFooter className="pt-4 border-t gap-2 sm:gap-0 mt-6">
                  <Button type="button" variant="outline" onClick={() => { setOpenNew(false); resetForm(); }}>Cancelar</Button>
                  <Button type="submit">Iniciar Atendimento</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Modal 2: Finalizar Chamado */}
          <Dialog open={openFinalize} onOpenChange={(val) => {
            setOpenFinalize(val);
            if (!val) setTicketToFinalize(null);
          }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl">Finalizar Atendimento - {ticketToFinalize?.empresa?.nome}</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do ticket finalizado. O tempo total foi registrado.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleFinalize} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Coluna Esquerda */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">1. Identificação</h3>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="title">Título do Chamado <span className="text-red-500">*</span></Label>
                          <span className={`text-[10px] font-medium ${newTitle.length >= 500 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {newTitle.length}/500
                          </span>
                        </div>
                        <Input id="title" required maxLength={500} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Erro ao emitir nota fiscal..." />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">2. Classificação</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Tipo de Ticket</Label>
                          <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {suporteConfig?.tipos_ticket?.map((t: any) => (
                                <SelectItem key={t.id || t.nome || t} value={t.nome || t}>{t.nome || t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="module">Módulo</Label>
                          <Select value={newModule} onValueChange={setNewModule}>
                            <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                            <SelectContent>
                              {suporteConfig?.modulos.map((modulo: any) => (
                                <SelectItem key={modulo.id || modulo.nome || modulo} value={modulo.nome || modulo}>{modulo.nome || modulo}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">3. Detalhes</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="priority">Prioridade</Label>
                          <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Baixa">Baixa</SelectItem>
                              <SelectItem value="Média">Média</SelectItem>
                              <SelectItem value="Alta">Alta</SelectItem>
                              <SelectItem value="Urgente">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">4. Evidências e Relato</h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desc">Descrição do Atendimento</Label>
                        <Textarea id="desc" className="min-h-[100px] resize-y" required value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descreva o que foi feito..." />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="files">Imagens / Anexos</Label>
                        <Input id="files" type="file" multiple accept="image/*" onChange={e => { if (e.target.files) setNewFiles(Array.from(e.target.files)); }} />
                        <p className="text-xs text-muted-foreground">Pressione Ctrl/Cmd para selecionar várias imagens.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t gap-2 sm:gap-0 mt-6">
                  <Button type="button" variant="outline" onClick={() => setOpenFinalize(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'Salvando e Anexando...' : 'Finalizar Chamado'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="px-6 pb-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por ID, título ou cliente..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal h-9 px-3",
                    !filterPeriod && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterPeriod?.from ? (
                    filterPeriod.to ? (
                      <>
                        {format(filterPeriod.from, "dd/MM/yyyy")} -{" "}
                        {format(filterPeriod.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(filterPeriod.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Selecione as datas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filterPeriod?.from}
                  selected={filterPeriod}
                  onSelect={setFilterPeriod}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Clientes</SelectItem>
                {empresas.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Módulos</SelectItem>
                {suporteConfig?.modulos?.map((m: any) => (
                  <SelectItem key={m.id || m.nome || m} value={m.nome || m}>{m.nome || m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[110px]">ID</TableHead>
                <TableHead>Detalhes do Chamado</TableHead>
                <TableHead>Atribuição</TableHead>
                <TableHead>Status & Prioridade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <MessageSquare className="mx-auto h-8 w-8 opacity-20 mb-2" />
                    Nenhum chamado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    
                    {/* ID */}
                    <TableCell className="align-top py-4">
                      <div className="font-semibold text-lg text-foreground">CH-{ticket.ticket_number}</div>
                    </TableCell>
                    
                    {/* Detalhes */}
                    <TableCell className="align-top py-4 max-w-[300px]">
                      <div className="font-semibold truncate text-base">{ticket.titulo}</div>
                      <div className="text-sm text-muted-foreground mt-0.5 truncate">{ticket.empresa?.nome || "Sem empresa"} {ticket.contato_nome && `• ${ticket.contato_nome}`}</div>
                      {(ticket.tags?.length > 0 || ticket.modulo) && (
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-[10px] h-5" style={{ 
                            backgroundColor: getDynamicColor('tipos_ticket', ticket.tipo) ? `${getDynamicColor('tipos_ticket', ticket.tipo)}10` : undefined,
                            color: getDynamicColor('tipos_ticket', ticket.tipo),
                            borderColor: getDynamicColor('tipos_ticket', ticket.tipo) 
                          }}>
                            {ticket.tipo}
                          </Badge>
                          
                          {ticket.modulo && (
                            <Badge variant="outline" className="text-[10px] h-5" style={{ 
                              backgroundColor: getDynamicColor('modulos', ticket.modulo) ? `${getDynamicColor('modulos', ticket.modulo)}10` : undefined,
                              color: getDynamicColor('modulos', ticket.modulo),
                              borderColor: getDynamicColor('modulos', ticket.modulo) 
                            }}>
                              Módulo: {ticket.modulo}
                            </Badge>
                          )}
                          {ticket.tags && ticket.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] h-5">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>

                    {/* Atribuição */}
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {ticket.responsavel || <span className="text-muted-foreground italic">Não atribuído</span>}
                        </span>
                        {(ticket.data_inicio || ticket.data_fim) && (
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            {ticket.data_inicio ? format(new Date(ticket.data_inicio), 'dd/MM/yy') : '?'}
                            {ticket.data_fim && ticket.data_fim !== ticket.data_inicio && ` até ${format(new Date(ticket.data_fim), 'dd/MM/yy')}`}
                          </span>
                        )}
                        {(ticket.hora_inicio || ticket.hora_fim) && (
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {ticket.hora_inicio ? ticket.hora_inicio.substring(0,5) : '?'} - {ticket.hora_fim ? ticket.hora_fim.substring(0,5) : '?'}
                          </span>
                        )}
                        {ticket.imagens && ticket.imagens.length > 0 && (
                          <span className="text-xs text-blue-500 font-medium flex items-center gap-1 mt-1">
                            {ticket.imagens.length} Imagem(ns)
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status & Prioridade */}
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col items-start gap-2">
                        <div className="flex items-center scale-110 origin-left">
                          {getStatusBadge(ticket.status)}
                          {ticket.status === 'Em Andamento' && ticket.created_at && (
                            <ActiveTimer startTime={ticket.created_at} />
                          )}
                        </div>
                        <span className={`text-sm mt-1 font-semibold ${getPriorityColor(ticket.prioridade)}`}>
                          Prioridade {ticket.prioridade}
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Ações */}
                    <TableCell className="text-right align-top py-4">
                      <div className="flex justify-end gap-2">
                        {(ticket.status === 'Aberto' || ticket.status === 'Em Andamento') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelTicket(ticket);
                            }}
                          >
                            Cancelar
                          </Button>
                        )}

                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Excluir Chamado"
                          className="h-9 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTicket(ticket);
                          }}
                        >
                          Excluir
                        </Button>

                        {ticket.status === 'Em Andamento' ? (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-9 px-4 font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTicketToFinalize(ticket);
                              setOpenFinalize(true);
                            }}
                          >
                            Finalizar
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-9 px-3 text-primary font-medium hover:text-primary hover:bg-primary/10">
                            Detalhes
                          </Button>
                        )}
                      </div>
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="p-3 border-t bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
            <span>
              Exibindo <strong>{filteredTickets.length}</strong> chamado{filteredTickets.length !== 1 && 's'} 
              {tickets.length !== filteredTickets.length && ` (filtrado de ${tickets.length} total)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
