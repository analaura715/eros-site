import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().min(2, "Título é obrigatório"),
  descricao: z.string().optional(),
  dataInicio: z.date({ required_error: "Data de início é obrigatória" }),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida (HH:MM)"),
  duracaoMinutos: z.number().min(15, "Mínimo de 15 minutos"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  lead_id: z.string().optional(),
  usuario_id: z.string().optional(),
  lembrete_anterior: z.boolean().default(false),
  lembrete_dia: z.boolean().default(false),
  horario_lembrete: z.string().optional(),
  email_secretaria: z.string().optional(),
  tel_secretaria: z.string().optional(),
});

export type AgendaFormValues = z.infer<typeof formSchema>;

interface AgendaFormProps {
  initialData?: Partial<AgendaFormValues>;
  onSubmit: (data: AgendaFormValues) => void;
  onCancel?: () => void;
}

export function AgendaForm({ initialData, onSubmit, onCancel }: AgendaFormProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const { state: { users } } = useStore();

  useEffect(() => {
    async function fetchLeads() {
      const { data } = await supabase.from('leads').select('id, nome, cnpj, telefone, contato_principal, regime_tributario').order('nome');
      if (data) setLeads(data);
    }
    fetchLeads();
  }, []);

  const form = useForm<AgendaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || "",
      titulo: initialData?.titulo || "",
      descricao: initialData?.descricao || "",
      dataInicio: initialData?.dataInicio || new Date(),
      horaInicio: initialData?.horaInicio || "14:00",
      duracaoMinutos: initialData?.duracaoMinutos || 60,
      tipo: initialData?.tipo || "Reunião",
      lead_id: initialData?.lead_id || "none",
      usuario_id: initialData?.usuario_id || "none",
      lembrete_anterior: initialData?.lembrete_anterior || false,
      lembrete_dia: initialData?.lembrete_dia || false,
      horario_lembrete: initialData?.horario_lembrete || "08:00",
      email_secretaria: initialData?.email_secretaria || "",
      tel_secretaria: initialData?.tel_secretaria || "",
    },
  });

  const watchLeadId = form.watch("lead_id");
  const selectedLead = leads.find(l => l.id === watchLeadId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs">Título do Evento *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Demonstração da Plataforma" className="h-8 text-xs" {...field} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs">Tipo do Evento *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Reunião">Reunião</SelectItem>
                    <SelectItem value="Demonstração">Demonstração</SelectItem>
                    <SelectItem value="Lembrete">Lembrete</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lead_id"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs">Vincular a um Lead (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "none"}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione um lead..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum lead vinculado</SelectItem>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        {selectedLead && selectedLead.id !== 'none' && (
          <div className="rounded-lg border bg-slate-50/50 p-3 space-y-2">
            <h4 className="text-xs font-semibold text-foreground/80">Detalhes da Empresa</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">CNPJ:</span> {selectedLead.cnpj || 'Não informado'}</div>
              <div><span className="text-muted-foreground">Telefone:</span> {selectedLead.telefone || 'Não informado'}</div>
              <div><span className="text-muted-foreground">Contato:</span> {selectedLead.contato_principal || 'Não informado'}</div>
              <div><span className="text-muted-foreground">Regime:</span> {selectedLead.regime_tributario || 'Não informado'}</div>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="usuario_id"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs">Responsável</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "none"}>
                <FormControl>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione quem irá realizar..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Atribuir a mim mesmo</SelectItem>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="dataInicio"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs">Data *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full h-8 text-xs justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione a data</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="horaInicio"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs">Horário *</FormLabel>
                <FormControl>
                  <Input type="time" className="h-8 text-xs" {...field} />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duracaoMinutos"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs">Duração</FormLabel>
                <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1.5 horas</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs">Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Pauta da reunião, detalhes, link de vídeo..." className="min-h-[80px] text-xs resize-none" {...field} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <div className="border rounded-md p-3 space-y-3 bg-card mt-2">
          <h4 className="text-sm font-semibold">Lembretes e Notificações</h4>
          <p className="text-xs text-muted-foreground">Configurar o envio de lembretes da reunião.</p>
          
          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="lembrete_anterior"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 shadow-sm bg-background">
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs">Lembrete no Dia Anterior</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lembrete_dia"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 shadow-sm bg-background">
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs">Lembrete no Dia do Evento</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="horario_lembrete"
              render={({ field }) => (
                <FormItem className="space-y-1 mt-1">
                  <FormLabel className="text-xs">Horário do Lembrete</FormLabel>
                  <FormControl>
                    <Input type="time" className="h-8 text-xs w-full sm:w-32" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-2 mt-2">
              <FormField
                control={form.control}
                name="email_secretaria"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[10px]">Email da Secretária</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" className="h-8 text-xs" {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tel_secretaria"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[10px]">Tel/WhatsApp Secretária</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" className="h-8 text-xs" {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t mt-4">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" size="sm">
            {initialData?.id ? "Salvar Alterações" : "Agendar Evento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
