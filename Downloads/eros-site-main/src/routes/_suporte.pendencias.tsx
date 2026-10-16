import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { usePendencias } from "@/hooks/usePendencias";
import { useSuporte } from "@/hooks/useSuporte";
import { Task, TaskStatus, TaskEvent } from "@/types/suporte";
import { logExclusaoAuditoria } from "@/lib/audit";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Icons
import {
  Plus,
  Search,
  KanbanSquare,
  List,
  SlidersHorizontal,
  ClipboardList,
  X,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// Module Components
import { PendenciasStatsBar } from "@/components/pendencias/pendencias-stats-bar";
import { PendenciasKanban } from "@/components/pendencias/pendencias-kanban";
import { PendenciasList } from "@/components/pendencias/pendencias-list";
import { PendenciaDetailDrawer } from "@/components/pendencias/pendencia-detail-drawer";
import { PendenciaCreateModal } from "@/components/pendencias/pendencia-create-modal";
import { TaskActionModal, TaskActionType } from "@/components/pendencias/task-action-modal";

export const Route = createFileRoute("/_suporte/pendencias")({
  component: PendenciasPage,
});

function PendenciasPage() {
  const { auth } = useStore();
  const {
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    fetchTaskEvents,
    uploadAttachment,
    loading,
  } = usePendencias();
  const { fetchConfiguracoes } = useSuporte();

  // ─── Data State ───
  const [tasks, setTasks] = useState<Task[]>([]);
  const [empresas, setEmpresas] = useState<{ id: string; nome: string }[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);
  const [modulos, setModulos] = useState<{ id?: string; nome: string }[]>([]);

  // ─── UI State ───
  const [viewMode, setViewMode] = useState<"list" | "kanban">(() => {
    return (localStorage.getItem("venux_pendencias_view") as "list" | "kanban") || "list";
  });
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterPriority, setFilterPriority] = useState("todos");
  const [filterResponsavel, setFilterResponsavel] = useState("todos");
  const [filterCriador, setFilterCriador] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);

  // ─── Modal/Drawer State ───
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskEvents, setSelectedTaskEvents] = useState<TaskEvent[]>([]);

  // ─── Action Modal State ───
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalTask, setActionModalTask] = useState<Task | null>(null);
  const [actionModalType, setActionModalType] = useState<TaskActionType>(null);

  // ─── Data Loading ───
  const loadData = async () => {
    const tasksData = await fetchTasks();
    setTasks(tasksData);

    const { data: emps } = await supabase.from("empresas").select("id, nome").order("nome");
    if (emps) setEmpresas(emps);

    const { data: users } = await supabase.from("usuarios").select("id, nome").order("nome");
    if (users) setUsuarios(users);

    const config = await fetchConfiguracoes();
    if (config?.modulos) setModulos(config.modulos);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem("venux_pendencias_view", viewMode);
  }, [viewMode]);

  // ─── Filtering ───
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Text search across multiple fields
      if (search) {
        const q = search.toLowerCase();
        const matchSearch =
          t.titulo?.toLowerCase().includes(q) ||
          t.codigo_identificador?.toLowerCase().includes(q) ||
          t.descricao?.toLowerCase().includes(q) ||
          t.cliente?.nome?.toLowerCase().includes(q) ||
          t.responsavel_atual?.nome?.toLowerCase().includes(q) ||
          t.criado_por?.nome?.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      // Tipo filter (Interna / Cliente)
      if (filterTipo === "Cliente" && !t.cliente_id) return false;
      if (filterTipo === "Interna" && t.cliente_id) return false;

      // Status filter
      if (filterStatus !== "todos" && t.status !== filterStatus) return false;

      // Priority filter
      if (filterPriority !== "todos" && t.prioridade !== filterPriority) return false;

      // Responsável Dev filter
      if (filterResponsavel !== "todos" && t.responsavel_atual_id !== filterResponsavel)
        return false;

      // Criador Suporte filter
      if (filterCriador !== "todos" && t.criado_por_id !== filterCriador) return false;

      return true;
    });
  }, [tasks, search, filterTipo, filterStatus, filterPriority, filterResponsavel, filterCriador]);

  const hasActiveFilters =
    filterTipo !== "todos" ||
    filterStatus !== "todos" ||
    filterPriority !== "todos" ||
    filterResponsavel !== "todos" ||
    filterCriador !== "todos";

  const clearFilters = () => {
    setFilterTipo("todos");
    setFilterStatus("todos");
    setFilterPriority("todos");
    setFilterResponsavel("todos");
    setFilterCriador("todos");
    setSearch("");
  };

  // ─── Handlers ───
  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);
    setModalMode("view");
    setTaskToEdit(task);
    setCreateModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setModalMode("edit");
    setTaskToEdit(task);
    setCreateModalOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    const isCreator = auth?.id === task.criado_por_id;
    const isResponsible = auth?.id === task.responsavel_atual_id;
    const isAdmin =
      auth?.role === "admin" ||
      auth?.role === "Administrador" ||
      auth?.role === "Super Admin" ||
      auth?.role === "super" ||
      auth?.role?.toLowerCase().includes("super");

    if (!isCreator && !isResponsible && !isAdmin) {
      toast.error("Acesso Negado", {
        description: "Apenas o criador ou o responsável atual podem excluir esta pendência.",
      });
      return;
    }

    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    // Registra na trilha de auditoria
    await logExclusaoAuditoria("suporte_tasks", taskToDelete.id, taskToDelete, "EXCLUSAO");

    await deleteTask(taskToDelete.id);
    toast.success("Pendência excluída com sucesso.");
    setDeleteModalOpen(false);
    setTaskToDelete(null);
    loadData();
  };

  const handleActionSubmit = async (payload: {
    status?: TaskStatus;
    responsavel_atual_id?: string;
    mensagem?: string;
    anexos?: File[];
    actionType?: string;
  }) => {
    if (!actionModalTask) return;

    // Map action type to human-readable tipo_evento
    const tipoEventoMap: Record<string, string> = {
      registrar_acao: "Ação / Observação",
      enviar_teste: "Envio para Testes",
      enviar_atualizacao: "Envio de Atualização",
      cancelar: "Cancelamento",
      aprovar_atualizacao: "Aprovação",
      reprovar_atualizacao: "Ajuste Solicitado",
      finalizar_testes: "Finalização de Testes",
    };
    const tipoEvento = tipoEventoMap[payload.actionType || ""] || "Ação";

    if (payload.status || payload.responsavel_atual_id) {
      await updateTask(
        actionModalTask.id,
        {
          ...(payload.status && { status: payload.status }),
          ...(payload.responsavel_atual_id && {
            responsavel_atual_id: payload.responsavel_atual_id,
          }),
        },
        auth?.id,
      );
    }

    let eventId = undefined;
    if (payload.mensagem || (payload.anexos && payload.anexos.length > 0)) {
      const msg = payload.mensagem || "Adicionou anexos/evidências.";
      const event = await addComment(actionModalTask.id, auth?.id || undefined, msg, tipoEvento);
      if (event) {
        eventId = event.id;
      }
    }

    if (payload.anexos && payload.anexos.length > 0) {
      await Promise.all(
        payload.anexos.map((file) => uploadAttachment(actionModalTask.id, file, eventId)),
      );

      // Envia notificação sobre o novo anexo
      if (actionModalTask.responsavel_atual_id) {
        supabase.channel("venux_notifications").send({
          type: "broadcast",
          event: "task_attachment_added",
          payload: {
            task_id: actionModalTask.id,
            titulo: actionModalTask.titulo,
            responsavel_atual_id: actionModalTask.responsavel_atual_id,
            usuario_id: auth?.id,
          },
        });
      }
    }

    toast.success("Ação registrada com sucesso!");
    setActionModalOpen(false);
    loadData();
    if (selectedTask?.id === actionModalTask.id) {
      const eventsData = await fetchTaskEvents(actionModalTask.id);
      setSelectedTaskEvents(eventsData);
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              ...(payload.status && { status: payload.status }),
              ...(payload.responsavel_atual_id && {
                responsavel_atual_id: payload.responsavel_atual_id,
              }),
            }
          : null,
      );
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Optimistic update
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              ...(newStatus === "Concluída" ? { data_conclusao: now } : {}),
            }
          : t,
      ),
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              ...(newStatus === "Concluída" ? { data_conclusao: now } : {}),
            }
          : null,
      );
    }

    const updatePayload: Partial<Task> = { status: newStatus };
    if (newStatus === "Concluída") {
      updatePayload.data_conclusao = now;
    }

    const result = await updateTask(taskId, updatePayload, auth?.id);
    if (result) {
      toast.success(`Pendência movida para "${newStatus}"`);
      if (detailDrawerOpen && selectedTask?.id === taskId) {
        const events = await fetchTaskEvents(taskId);
        setSelectedTaskEvents(events);
      }
    } else {
      toast.error("Erro ao atualizar o status.");
      loadData();
    }
  };

  const handleCreateTask = async (data: any) => {
    // Format metadata into description for columns that DO NOT exist in the database schema
    const metadados = [];
    if (data.setor) metadados.push(`**Setor da Empresa:** ${data.setor}`);
    if (data.filial) metadados.push(`**Filial:** ${data.filial}`);
    if (data.numero_pedido) metadados.push(`**Nº Pedido:** ${data.numero_pedido}`);
    if (data.lote) metadados.push(`**Lote:** ${data.lote}`);
    if (data.nota) metadados.push(`**Nota:** ${data.nota}`);
    if (data.chamado_origem_id) metadados.push(`**ID Chamado Origem:** ${data.chamado_origem_id}`);

    let baseDescription = data.descricao || "";
    // If we are editing, we might already have the '### Referências' block.
    // We should strip the old one before appending the new one.
    if (baseDescription.includes("### Referências")) {
      baseDescription = baseDescription.split("### Referências")[0].trim();
    }

    let descricaoFinal = baseDescription;
    if (metadados.length > 0) {
      descricaoFinal += (descricaoFinal ? "\n\n" : "") + "### Referências\n" + metadados.join("\n");
    }

    const payload: any = {
      titulo: data.titulo,
      descricao: descricaoFinal,
      categoria: data.categoria,
      prioridade: data.prioridade,
      responsavel_atual_id: data.responsavel_atual_id,
      cliente_id: data.cliente_id,
      modulo_id: data.modulo_id,
      equipe_responsavel: data.equipe_responsavel,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim,
      responsaveis_ids: data.responsaveis_ids,
      criado_por_id: auth?.id,
    };

    if (taskToEdit) {
      const result = await updateTask(taskToEdit.id, payload, auth?.id);
      if (result) {
        if (data.anexos_novos && data.anexos_novos.length > 0) {
          await Promise.all(
            data.anexos_novos.map((file: File) => uploadAttachment(taskToEdit.id, file)),
          );
        }
        toast.success("Pendência atualizada com sucesso!");
        setCreateModalOpen(false);
        setTaskToEdit(null);
        await loadData();
      } else {
        toast.error("Erro ao atualizar a pendência.");
      }
    } else {
      payload.status = "Aberta" as TaskStatus;
      const result = await createTask(payload);
      if (result) {
        if (data.anexos_novos && data.anexos_novos.length > 0) {
          await Promise.all(
            data.anexos_novos.map((file: File) => uploadAttachment(result.id, file)),
          );
        }
        toast.success("Pendência criada com sucesso!");
        setCreateModalOpen(false);
        await loadData();
      } else {
        toast.error("Erro ao criar a pendência.");
      }
    }
  };

  const handleAddComment = async (taskId: string, message: string) => {
    if (!auth?.id) return;
    const result = await addComment(taskId, auth.id, message);
    if (result) {
      toast.success("Comentário adicionado.");
      const events = await fetchTaskEvents(taskId);
      setSelectedTaskEvents(events);
    } else {
      toast.error("Erro ao adicionar comentário.");
    }
  };

  const handleDrawerRefresh = async () => {
    if (!selectedTask) return;
    const tasksData = await fetchTasks();
    setTasks(tasksData);
    const updated = tasksData.find((t) => t.id === selectedTask.id);
    if (updated) setSelectedTask(updated);
    const events = await fetchTaskEvents(selectedTask.id);
    setSelectedTaskEvents(events);
  };

  // ─── Render ───
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* ══════════ HEADER ══════════ */}
      <div className="relative overflow-hidden border-b px-6 py-5 bg-card shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Title + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Pendências & Tasks</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie demandas entre Suporte e Desenvolvimento
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setModalMode("create");
                  setTaskToEdit(null);
                  setCreateModalOpen(true);
                }}
                className="gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nova Pendência
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => loadData()}
                title="Recarregar dados"
                className="shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <PendenciasStatsBar tasks={tasks} />

          {/* Search + View Toggle + Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID, título, cliente, responsável..."
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* View Toggle Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "kanban")}>
              <TabsList className="h-9">
                <TabsTrigger value="list" className="gap-1.5 px-3">
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Lista</span>
                </TabsTrigger>
                <TabsTrigger value="kanban" className="gap-1.5 px-3">
                  <KanbanSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filter Toggle */}
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              className="gap-1.5 h-9"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="destructive" className="ml-1 h-4 px-1.5 text-[10px]">
                  Ativo
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-9 text-muted-foreground hover:text-destructive"
                onClick={clearFilters}
              >
                <X className="w-3.5 h-3.5" />
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Advanced Filters (collapsible) */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1 animate-in slide-in-from-top-2 duration-200">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[140px] h-9 bg-background">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="Interna">Interna</SelectItem>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px] h-9 bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="Aberta">Aberta</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Em Desenvolvimento">Em Desenvolvimento</SelectItem>
                  <SelectItem value="Aguardando Validação">Aguardando Validação</SelectItem>
                  <SelectItem value="Ajuste Solicitado">Ajuste Solicitado</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[150px] h-9 bg-background">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Prioridades</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Urgente">Urgente / Crítica</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
                <SelectTrigger className="w-[180px] h-9 bg-background">
                  <SelectValue placeholder="Responsável Dev" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Responsáveis</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCriador} onValueChange={setFilterCriador}>
                <SelectTrigger className="w-[180px] h-9 bg-background">
                  <SelectValue placeholder="Criador Suporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Criadores</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "list" ? (
          <div className="p-6 h-full overflow-y-auto">
            <PendenciasList
              tasks={filteredTasks}
              modulos={modulos}
              onTaskClick={handleTaskClick}
              onStatusChange={handleStatusChange}
              onActionClick={(task, type) => {
                if (type === "finalizar_direto") {
                  handleStatusChange(task.id, "Concluída");
                  return;
                }
                setActionModalTask(task);
                setActionModalType(type);
                setActionModalOpen(true);
              }}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              loading={loading}
            />
          </div>
        ) : (
          <PendenciasKanban
            tasks={filteredTasks}
            modulos={modulos}
            onTaskClick={handleTaskClick}
            onStatusChange={handleStatusChange}
            loading={loading}
          />
        )}
      </div>

      {/* ══════════ MODALS & DRAWERS ══════════ */}
      <PendenciaCreateModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) setTaskToEdit(null);
        }}
        onSubmit={handleCreateTask}
        empresas={empresas}
        usuarios={usuarios}
        modulos={modulos}
        loading={loading}
        taskToEdit={taskToEdit}
        readOnly={modalMode === "view"}
        onActionClick={(task, type) => {
          if (type === "finalizar_direto") {
            handleStatusChange(task.id, "Concluída");
            return;
          }
          setActionModalTask(task);
          setActionModalType(type);
          setActionModalOpen(true);
        }}
        onAddComment={handleAddComment}
        currentUserId={auth?.id}
        currentUserRole={auth?.role}
      />

      <PendenciaDetailDrawer
        task={selectedTask}
        open={detailDrawerOpen}
        onOpenChange={(open) => {
          setDetailDrawerOpen(open);
          if (!open) {
            setSelectedTask(null);
            setSelectedTaskEvents([]);
          }
        }}
        events={selectedTaskEvents}
        onStatusChange={handleStatusChange}
        onActionClick={(task, type) => {
          if (type === "finalizar_direto") {
            handleStatusChange(task.id, "Concluída");
            return;
          }
          setActionModalTask(task);
          setActionModalType(type);
          setActionModalOpen(true);
        }}
        onAddComment={handleAddComment}
        onRefresh={handleDrawerRefresh}
        currentUserId={auth?.id}
        currentUserName={auth?.nome}
        currentUserRole={auth?.role}
      />

      <TaskActionModal
        task={actionModalTask}
        actionType={actionModalType}
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        usuarios={usuarios}
        onSubmit={handleActionSubmit}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Excluir Pendência
            </DialogTitle>
            <DialogDescription className="pt-2 text-left" asChild>
              <div>
                {taskToDelete?.status === "Concluída" ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-600 dark:text-amber-500 font-medium flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm">
                        <strong>ATENÇÃO:</strong> Esta pendência já está <strong>CONCLUÍDA</strong>!
                      </p>
                    </div>
                    <p className="text-foreground">
                      Tem certeza que deseja excluí-la? A exclusão de um item concluído apagará seu
                      histórico de forma permanente.
                    </p>
                    <p className="text-muted-foreground italic text-sm">
                      Pendência: "{taskToDelete?.titulo}"
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-foreground">
                      Tem certeza que deseja excluir a pendência{" "}
                      <strong>"{taskToDelete?.titulo}"</strong>?
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Esta ação não pode ser desfeita.
                    </p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
