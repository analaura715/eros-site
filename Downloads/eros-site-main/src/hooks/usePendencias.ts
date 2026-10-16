import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Task, TaskStatus, TaskEvent, TaskAttachment } from "@/types/suporte";
import { toast } from "sonner";

export function usePendencias() {
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (): Promise<Task[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          cliente:empresas(id, nome),
          responsavel_atual:usuarios!tasks_responsavel_atual_id_fkey(id, nome, avatar_url, cargo),
          criado_por:usuarios!tasks_criado_por_id_fkey(id, nome, avatar_url, cargo)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    } catch (error) {
      console.error("Erro ao buscar tasks:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(
    async (
      payload: Partial<Task> & {
        checklist_novos?: { description: string; is_completed: boolean }[];
      },
    ): Promise<Task | null> => {
      setLoading(true);
      try {
        const { checklist_novos, ...taskPayload } = payload;
        const { data, error } = await supabase
          .from("tasks")
          .insert([taskPayload])
          .select()
          .single();

        if (error) throw error;

        const task = data as Task;

        // Fetch responsavel name if exists
        let mensagemCriacao = `Pendência "${task.titulo}" criada e registrada no sistema.`;
        if (task.responsavel_atual_id) {
          const { data: resp } = await supabase
            .from("usuarios")
            .select("nome")
            .eq("id", task.responsavel_atual_id)
            .single();
          if (resp?.nome) {
            mensagemCriacao += ` Responsável atribuído: ${resp.nome}.`;
          }
        }

        await supabase.from("task_events").insert([
          {
            task_id: task.id,
            usuario_id: task.criado_por_id,
            tipo_evento: "Criação",
            status_novo: "Aberta",
            mensagem: mensagemCriacao,
          },
        ]);

        // Insert checklist items if provided
        if (checklist_novos && checklist_novos.length > 0) {
          const checklistInserts = checklist_novos.map((item) => ({
            pendencia_id: task.id,
            description: item.description,
            is_completed: item.is_completed,
          }));
          await supabase.from("checklist_items").insert(checklistInserts);
        }

        if (task.responsavel_atual_id) {
          await supabase.channel("venux_notifications").send({
            type: "broadcast",
            event: "task_assigned",
            payload: {
              task_id: task.id,
              titulo: task.titulo,
              responsavel_atual_id: task.responsavel_atual_id,
              criado_por_id: task.criado_por_id,
            },
          });
        }

        return task;
      } catch (error) {
        console.error("Erro ao criar task:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateTask = useCallback(
    async (id: string, payload: Partial<Task>, updatedByUserId?: string): Promise<Task | null> => {
      setLoading(true);
      try {
        const { data: currentTask, error: fetchError } = await supabase
          .from("tasks")
          .select("status, responsavel_atual_id")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;

        const updates = { ...payload };
        let statusChanged = false;

        if (payload.status && payload.status !== currentTask.status) {
          statusChanged = true;
        }

        delete updates.ciclos_retrabalho;
        delete (updates as any).data_conclusao;
        if (updates.responsavel_atual_id === '') updates.responsavel_atual_id = null;
        if (updates.cliente_id === '') updates.cliente_id = null;
        if (updates.modulo_id === '') updates.modulo_id = null;
        if (updates.equipe_responsavel === '') updates.equipe_responsavel = null;
        delete (updates as any).data_conclusao; // Remove para evitar erro 400, pois a coluna não existe no banco

        const { data, error } = await supabase
          .from("tasks")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        if (statusChanged) {
          // Fetch user name for richer message
          let mensagemStatus = `Status alterado de "${currentTask.status}" para "${payload.status}".`;
          if (updatedByUserId) {
            const { data: usr } = await supabase
              .from("usuarios")
              .select("nome")
              .eq("id", updatedByUserId)
              .single();
            if (usr?.nome) {
              mensagemStatus = `${usr.nome} alterou o status de "${currentTask.status}" para "${payload.status}".`;
            }
          }
          await supabase.from("task_events").insert([
            {
              task_id: id,
              usuario_id: updatedByUserId,
              tipo_evento: "Mudança de Status",
              status_anterior: currentTask.status,
              status_novo: payload.status,
              mensagem: mensagemStatus,
            },
          ]);
        }

        if (
          payload.responsavel_atual_id &&
          payload.responsavel_atual_id !== currentTask.responsavel_atual_id
        ) {
          await supabase.channel("venux_notifications").send({
            type: "broadcast",
            event: "task_assigned",
            payload: {
              task_id: data.id,
              titulo: data.titulo,
              responsavel_atual_id: payload.responsavel_atual_id,
              criado_por_id: data.criado_por_id,
            },
          });
        }

        return data as Task;
      } catch (error: any) {
        console.error("Erro ao atualizar task:", JSON.stringify(error, null, 2), error);
        toast.error(
          `Falha ao atualizar pendência: ${error?.message || error?.details || JSON.stringify(error) || "Erro 400"}`,
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Erro ao deletar task:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const addComment = useCallback(
    async (
      taskId: string,
      userId: string | undefined,
      message: string,
      tipoEvento: string = "Comentário",
    ): Promise<TaskEvent | null> => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("task_events")
          .insert([
            {
              task_id: taskId,
              usuario_id: userId,
              tipo_evento: tipoEvento,
              mensagem: message,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data as TaskEvent;
      } catch (error) {
        console.error("Erro ao adicionar comentário:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchTaskEvents = useCallback(async (taskId: string): Promise<TaskEvent[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("task_events")
        .select(
          "*, usuario:usuarios!usuario_id(id, nome, avatar_url, cargo), anexos:task_attachments!event_id(*)",
        )
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as TaskEvent[];
    } catch (error) {
      console.error("Erro ao buscar eventos da task:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAttachment = useCallback(
    async (taskId: string, file: File, eventId?: string): Promise<TaskAttachment | null> => {
      setLoading(true);
      try {
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${taskId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("task-attachments")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("task-attachments")
          .getPublicUrl(filePath);

        const url = publicUrlData.publicUrl;

        const { data, error: insertError } = await supabase
          .from("task_attachments")
          .insert([
            {
              task_id: taskId,
              caminho_arquivo: url,
              event_id: eventId,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        return data as TaskAttachment;
      } catch (error) {
        console.error("Erro ao fazer upload de anexo:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    fetchTaskEvents,
    uploadAttachment,
    loading,
  };
}
