import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, MessageSquare, AlertCircle, CheckCircle2, Clock, LifeBuoy, Tag, Calendar, User, Briefcase, Bug } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";

export const Route = createFileRoute("/_suporte/chamados")({
  component: ChamadosPage,
});

type Ticket = {
  id: string;
  title: string;
  description: string;
  client: string;
  contact?: string;
  type: "Bug / Erro" | "Dúvida de Uso" | "Melhoria" | "Acesso / Permissão" | "Treinamento" | "Implantação" | "Outros";
  module?: string;
  assignee?: string;
  duration?: string;
  status: "Aberto" | "Em Andamento" | "Resolvido";
  priority: "Baixa" | "Média" | "Alta" | "Urgente";
  tags: string[];
  createdAt: string;
};

const mockTickets: Ticket[] = [
  { 
    id: "CH-1001", 
    title: "Problema no acesso ao sistema", 
    description: "Usuário relata que após atualizar o navegador, o botão de login não responde.",
    client: "Tech Corp", 
    contact: "João Silva",
    type: "Bug / Erro",
    module: "Autenticação",
    assignee: "Ana Souza",
    duration: "45 min",
    status: "Aberto", 
    priority: "Alta",
    tags: ["Frontend", "Bloqueante"],
    createdAt: "2026-08-07T10:00:00Z" 
  },
  { 
    id: "CH-1002", 
    title: "Dúvida sobre faturamento de notas", 
    description: "Cliente deseja saber como emitir nota fiscal de devolução parcial.",
    client: "Inova LTDA", 
    contact: "Maria Oliveira",
    type: "Dúvida de Uso",
    module: "Financeiro",
    assignee: "Carlos Mendes",
    duration: "1 hora",
    status: "Em Andamento", 
    priority: "Média", 
    tags: ["Treinamento"],
    createdAt: "2026-08-06T15:30:00Z" 
  },
  { 
    id: "CH-1003", 
    title: "Erro ao gerar relatório mensal", 
    description: "Relatório de vendas de Julho está vindo em branco no PDF.",
    client: "Mega Store", 
    contact: "Pedro Costa",
    type: "Bug / Erro",
    module: "Relatórios",
    assignee: "Suporte N2",
    duration: "2 horas",
    status: "Resolvido", 
    priority: "Baixa", 
    tags: ["Backend", "Exportação"],
    createdAt: "2026-08-05T09:15:00Z" 
  },
];

function ChamadosPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);

  useEffect(() => {
    const fetchEmpresas = async () => {
      const { data } = await supabase.from('empresas').select('id, nome').order('nome');
      if (data) setEmpresas(data);
    };
    fetchEmpresas();
  }, []);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newType, setNewType] = useState<Ticket["type"]>("Dúvida de Uso");
  const [newModule, setNewModule] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [newPriority, setNewPriority] = useState<Ticket["priority"]>("Média");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.client.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTags = newTags.split(",").map(t => t.trim()).filter(t => t.length > 0);
    
    const ticket: Ticket = {
      id: `CH-${1000 + tickets.length + 1}`,
      title: newTitle,
      description: newDesc,
      client: newClient,
      contact: newContact || undefined,
      type: newType,
      module: newModule || undefined,
      assignee: newAssignee || undefined,
      duration: newDuration || undefined,
      status: "Aberto",
      priority: newPriority,
      tags: parsedTags,
      createdAt: new Date().toISOString(),
    };
    
    setTickets([ticket, ...tickets]);
    setOpenNew(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle("");
    setNewClient("");
    setNewContact("");
    setNewType("Dúvida de Uso");
    setNewModule("");
    setNewAssignee("");
    setNewDuration("");
    setNewPriority("Média");
    setNewDesc("");
    setNewTags("");
  };

  const getStatusBadge = (status: Ticket["status"]) => {
    switch (status) {
      case "Aberto": return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20"><AlertCircle className="w-3 h-3 mr-1"/> Aberto</Badge>;
      case "Em Andamento": return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"><Clock className="w-3 h-3 mr-1"/> Em Andamento</Badge>;
      case "Resolvido": return <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Resolvido</Badge>;
    }
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
          <Sheet open={openNew} onOpenChange={setOpenNew}>
            <SheetTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Novo Chamado
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[700px] w-[90vw] overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl">Novo Chamado de Suporte</SheetTitle>
                <SheetDescription>
                  Preencha os detalhes do ticket. Informações ricas ajudam a equipe a resolver o problema mais rápido.
                </SheetDescription>
              </SheetHeader>
              
              <form onSubmit={handleCreate} className="space-y-6">
                
                {/* 1. Identificação */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">1. Identificação</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Chamado <span className="text-red-500">*</span></Label>
                    <Input id="title" required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Erro ao emitir nota fiscal..." />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client">Cliente / Empresa <span className="text-red-500">*</span></Label>
                      <Select value={newClient} onValueChange={setNewClient} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente cadastrado" />
                        </SelectTrigger>
                        <SelectContent>
                          {empresas.map((emp) => (
                            <SelectItem key={emp.id} value={emp.nome}>{emp.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contato no Cliente</Label>
                      <Input id="contact" value={newContact} onChange={e => setNewContact(e.target.value)} placeholder="Funcionário(a) que pediu o chamado" />
                    </div>
                  </div>
                </div>

                {/* 2. Classificação */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">2. Classificação</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Ticket</Label>
                      <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bug / Erro">Bug / Erro</SelectItem>
                          <SelectItem value="Dúvida de Uso">Dúvida de Uso</SelectItem>
                          <SelectItem value="Melhoria">Melhoria</SelectItem>
                          <SelectItem value="Acesso / Permissão">Acesso / Permissão</SelectItem>
                          <SelectItem value="Treinamento">Treinamento</SelectItem>
                          <SelectItem value="Implantação">Implantação</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="module">Módulo/Área</Label>
                      <Select value={newModule} onValueChange={setNewModule}>
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Financeiro">Financeiro</SelectItem>
                          <SelectItem value="Comercial">Comercial</SelectItem>
                          <SelectItem value="Autenticação">Autenticação</SelectItem>
                          <SelectItem value="Relatórios">Relatórios</SelectItem>
                          <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 3. SLA e Atribuição */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">3. SLA e Atribuição</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baixa">Baixa</SelectItem>
                          <SelectItem value="Média">Média</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignee">Responsável</Label>
                      <Input id="assignee" value={newAssignee} onChange={e => setNewAssignee(e.target.value)} placeholder="Agente ou Equipe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duração do Atendimento</Label>
                      <Input id="duration" value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="Ex: 30 min, 2h..." className="w-full text-sm block" />
                    </div>
                  </div>
                </div>

                {/* 4. Detalhes */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">4. Descrição do Problema</h3>
                  </div>

                  <div className="space-y-2">
                    <Textarea 
                      id="desc" 
                      className="min-h-[120px] resize-y" 
                      required 
                      value={newDesc} 
                      onChange={e => setNewDesc(e.target.value)} 
                      placeholder="Descreva o problema com detalhes, passos para reproduzir, comportamento esperado vs atual..." 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input id="tags" value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Ex: urgente, backend, cliente_vip" />
                  </div>
                </div>

                <SheetFooter className="pt-6 mt-6 border-t flex flex-col sm:flex-row gap-3">
                  <Button type="button" variant="outline" onClick={() => { setOpenNew(false); resetForm(); }}>Cancelar</Button>
                  <Button type="submit">Registrar Chamado</Button>
                </SheetFooter>

              </form>
            </SheetContent>
          </Sheet>
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
          <Button variant="outline" size="icon" className="shrink-0" title="Filtros">
            <Filter className="h-4 w-4" />
          </Button>
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
                      <div className="font-medium text-foreground">{ticket.id}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        {getTypeIcon(ticket.type)}
                        {ticket.type}
                      </div>
                    </TableCell>
                    
                    {/* Detalhes */}
                    <TableCell className="align-top py-4 max-w-[300px]">
                      <div className="font-semibold truncate text-base">{ticket.title}</div>
                      <div className="text-sm text-muted-foreground mt-0.5 truncate">{ticket.client} {ticket.contact && `• ${ticket.contact}`}</div>
                      {(ticket.tags?.length > 0 || ticket.module) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ticket.module && (
                            <Badge variant="outline" className="text-[10px] h-5 bg-muted/50">Módulo: {ticket.module}</Badge>
                          )}
                          {ticket.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] h-5">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>

                    {/* Atribuição */}
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {ticket.assignee || <span className="text-muted-foreground italic">Não atribuído</span>}
                        </span>
                        {ticket.duration && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            Duração: {ticket.duration}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status & Prioridade */}
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col items-start gap-2">
                        {getStatusBadge(ticket.status)}
                        <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          Prioridade {ticket.priority}
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Ações */}
                    <TableCell className="text-right align-top py-4">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10">
                        Detalhes
                      </Button>
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
