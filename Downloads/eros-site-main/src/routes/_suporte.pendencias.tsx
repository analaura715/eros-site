import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useSuporte } from "@/hooks/useSuporte";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, Lightbulb, Users, Code, ShoppingBag, MoreHorizontal, CheckCircle2, Clock, Upload, Trash2, CalendarIcon, ChevronsUpDown } from "lucide-react";
import { Pendencia, CategoriaPendencia, StatusPendencia } from "@/types/suporte";
import { toast } from "sonner";

export const Route = createFileRoute("/_suporte/pendencias")({
  component: PendenciasPage,
});

const getCategoryIcon = (cat: CategoriaPendencia) => {
  switch (cat) {
    case "Ideia": return <Lightbulb className="w-4 h-4 text-yellow-500" />;
    case "Reunião": return <Users className="w-4 h-4 text-blue-500" />;
    case "Desenvolvimento": return <Code className="w-4 h-4 text-purple-500" />;
    case "Pedido": return <ShoppingBag className="w-4 h-4 text-green-500" />;
    default: return <MoreHorizontal className="w-4 h-4 text-slate-500" />;
  }
};

const getCategoryColor = (cat: CategoriaPendencia) => {
  switch (cat) {
    case "Ideia": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "Reunião": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "Desenvolvimento": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "Pedido": return "bg-green-500/10 text-green-600 border-green-500/20";
    default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
  }
};

function PendenciasPage() {
  const { fetchPendencias, createPendencia, updatePendencia, uploadImagensChamado } = useSuporte();
  const { auth } = useStore();
  const [items, setItems] = useState<Pendencia[]>([]);
  const [empresas, setEmpresas] = useState<{ id: string; nome: string }[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<CategoriaPendencia>("Desenvolvimento");
  const [newPriority, setNewPriority] = useState("Média");
  const [newDateStart, setNewDateStart] = useState("");
  const [newDateEnd, setNewDateEnd] = useState("");
  const [newTimeStart, setNewTimeStart] = useState("");
  const [newTimeEnd, setNewTimeEnd] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newObs, setNewObs] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const [data, empRes] = await Promise.all([
      fetchPendencias(),
      supabase.from('empresas').select('id, nome').order('nome')
    ]);
    setItems(data);
    if (empRes.data) setEmpresas(empRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let urls: string[] = [];
      if (newFiles.length > 0) {
        urls = await uploadImagensChamado(newFiles);
      }

      await createPendencia({
        titulo: newTitle,
        descricao: newDesc,
        categoria: newCategory,
        prioridade: newPriority,
        status: "Pendente",
        tags: [],
        data_inicio: newDateStart || undefined,
        data_fim: newDateEnd || undefined,
        hora_inicio: newTimeStart || undefined,
        hora_fim: newTimeEnd || undefined,
        responsavel: newAssignee || undefined,
        cliente_id: newClient && newClient !== "none" ? newClient : undefined,
        observacao: newObs || undefined,
        imagens: urls,
        criado_por_nome: auth?.nome || auth?.email || 'Sistema'
      });
      
      setOpenNew(false);
      resetForm();
      loadData();
      toast.success("Pendência registrada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar pendência.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewDesc("");
    setNewCategory("Desenvolvimento");
    setNewPriority("Média");
    setNewDateStart("");
    setNewDateEnd("");
    setNewTimeStart("");
    setNewTimeEnd("");
    setNewAssignee("");
    setNewClient("");
    setNewObs("");
    setNewFiles([]);
  };

  const handleUpdateStatus = async (id: string, novoStatus: StatusPendencia) => {
    try {
      await updatePendencia(id, { status: novoStatus });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const renderColumn = (status: StatusPendencia, title: string, icon: React.ReactNode) => {
    const columnItems = items.filter(i => i.status === status);

    return (
      <div className="flex-1 min-w-[320px] flex flex-col bg-muted/30 rounded-xl p-4 border border-border/50">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            {icon} {title}
            <Badge variant="secondary" className="ml-2 text-xs">{columnItems.length}</Badge>
          </h3>
        </div>

        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
          {columnItems.length === 0 ? (
            <div className="text-center p-6 text-sm text-muted-foreground italic border-2 border-dashed rounded-lg">
              Nenhum item nesta coluna
            </div>
          ) : (
            columnItems.map(item => (
              <div key={item.id} className="bg-card p-4 rounded-lg shadow-sm border group hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${getCategoryColor(item.categoria)}`}>
                    {item.categoria}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h4 className="font-semibold text-sm mb-1 leading-tight">{item.titulo}</h4>
                {item.cliente?.nome && (
                  <p className="text-[11px] font-medium text-slate-500 mb-2 truncate">
                    Cliente: {item.cliente.nome}
                  </p>
                )}
                
                {item.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.descricao}</p>
                )}

                {(item.data_inicio || item.responsavel) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.data_inicio && (
                      <Badge variant="secondary" className="text-[10px] font-normal gap-1 bg-slate-100">
                        <CalendarIcon className="w-3 h-3"/> {item.data_inicio.split('-').reverse().join('/')}
                      </Badge>
                    )}
                    {item.responsavel && (
                      <Badge variant="secondary" className="text-[10px] font-normal gap-1 bg-indigo-50 text-indigo-700">
                        <Users className="w-3 h-3"/> {item.responsavel}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className={`text-[10px] font-medium ${
                    item.prioridade === 'Alta' || item.prioridade === 'Urgente' ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    Prioridade: {item.prioridade}
                  </span>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {status !== 'Pendente' && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateStatus(item.id, 'Pendente')} title="Mover para Pendente">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    )}
                    {status !== 'Em Andamento' && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateStatus(item.id, 'Em Andamento')} title="Iniciar">
                        <MoreHorizontal className="w-3 h-3 text-blue-500" />
                      </Button>
                    )}
                    {status !== 'Concluído' && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateStatus(item.id, 'Concluído')} title="Concluir">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center justify-between p-6 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            Pendências e Ideias
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Backlog centralizado para ideias de produtos, tarefas de desenvolvimento e pautas de reuniões.
          </p>
        </div>
        
        <Dialog open={openNew} onOpenChange={(val) => { setOpenNew(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Nova Pendência
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Registrar Item no Backlog / Tarefa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 mt-4">
              
              {/* 1. Identificação */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                <h3 className="font-semibold text-sm text-slate-800 border-b pb-2">1. Identificação da Tarefa</h3>
                <div className="space-y-2">
                  <Label>Título / Assunto (Obrigatório)</Label>
                  <Input required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Desenvolver tela de dashboard financeiro" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                        <SelectItem value="Ideia">Ideia / Melhoria</SelectItem>
                        <SelectItem value="Reunião">Pauta de Reunião</SelectItem>
                        <SelectItem value="Pedido">Pedido Especial</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição da Tarefa</Label>
                  <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descreva os detalhes da tarefa, requisitos ou contexto..." className="min-h-[80px]" />
                </div>
              </div>

              {/* 2. Prazos e Responsáveis */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                <h3 className="font-semibold text-sm text-slate-800 border-b pb-2">2. Prazos e Responsáveis</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Input type="date" value={newDateStart} onChange={e => setNewDateStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora de Início</Label>
                    <Input type="time" value={newTimeStart} onChange={e => setNewTimeStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Final / Prazo</Label>
                    <Input type="date" value={newDateEnd} onChange={e => setNewDateEnd(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Final</Label>
                    <Input type="time" value={newTimeEnd} onChange={e => setNewTimeEnd(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Responsável pela Tarefa</Label>
                    <Input value={newAssignee} onChange={e => setNewAssignee(e.target.value)} placeholder="Ex: João Silva" />
                  </div>
                  <div className="space-y-2">
                    <Label>Quem está lançando</Label>
                    <Input disabled value={auth?.nome || auth?.email || 'Sistema'} className="bg-muted text-slate-600" />
                  </div>
                </div>
              </div>

              {/* 3. Relacionamento e Anexos */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                <h3 className="font-semibold text-sm text-slate-800 border-b pb-2">3. Cliente, Observações e Evidências</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 flex flex-col mt-1">
                    <Label>Cliente que Pediu (Opcional)</Label>
                    <Popover open={openClientCombobox} onOpenChange={setOpenClientCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openClientCombobox}
                          className="w-full justify-between font-normal px-3"
                        >
                          {newClient && newClient !== "none"
                            ? empresas.find((emp) => emp.id === newClient)?.nome
                            : "Nenhum Cliente (Interno)"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList>
                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="nenhum"
                                onSelect={() => {
                                  setNewClient("");
                                  setOpenClientCombobox(false);
                                }}
                              >
                                <CheckCircle2
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !newClient || newClient === "none" ? "opacity-100 text-primary" : "opacity-0"
                                  )}
                                />
                                Nenhum Cliente (Interno)
                              </CommandItem>
                              {empresas.map((emp) => (
                                <CommandItem
                                  key={emp.id}
                                  value={emp.nome}
                                  onSelect={() => {
                                    setNewClient(emp.id);
                                    setOpenClientCombobox(false);
                                  }}
                                >
                                  <CheckCircle2
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newClient === emp.id ? "opacity-100 text-primary" : "opacity-0"
                                    )}
                                  />
                                  {emp.nome}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Observação Interna</Label>
                    <Input value={newObs} onChange={e => setNewObs(e.target.value)} placeholder="Algo a observar..." />
                  </div>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label>Anexar Imagens ou Arquivos (Opcional)</Label>
                  <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="shrink-0 bg-white hover:bg-slate-50">
                      <Upload className="w-4 h-4 mr-2" /> Escolher Arquivos
                    </Button>
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <div className="text-xs text-muted-foreground">
                      {newFiles.length} arquivo(s) selecionado(s)
                    </div>
                  </div>
                  
                  {newFiles.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {newFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white border rounded p-2 text-xs">
                          <span className="truncate max-w-[200px]">{file.name}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveFile(index)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setOpenNew(false)} disabled={isUploading}>Cancelar</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 w-40 text-white" disabled={isUploading}>
                  {isUploading ? "Salvando..." : "Salvar Pendência"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-x-auto p-6 bg-slate-50/50">
        <div className="flex gap-6 h-full items-stretch">
          {renderColumn("Pendente", "Caixa de Entrada / Backlog", <Clock className="w-4 h-4 text-slate-500" />)}
          {renderColumn("Em Andamento", "Em Execução / Na Sprint", <MoreHorizontal className="w-4 h-4 text-blue-500" />)}
          {renderColumn("Concluído", "Feito / Concluído", <CheckCircle2 className="w-4 h-4 text-green-500" />)}
        </div>
      </div>
    </div>
  );
}
