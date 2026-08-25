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
  telefone_cliente: z.string().optional(), // Telefone do cliente para WhatsApp (auto-preenchido do lead)
  modalidade: z.string().default("Remoto"),
  local_link: z.string().optional(),
  mensagem_cliente_imediata: z.string().optional(),
  mensagem_cliente_lembrete: z.string().optional(),
  mensagem_equipe: z.string().optional(),
});

export type AgendaFormValues = z.infer<typeof formSchema>;

interface AgendaFormProps {
  initialData?: Partial<AgendaFormValues>;
  onSubmit: (data: AgendaFormValues) => void;
  onCancel?: () => void;
}

export function AgendaForm({ initialData, onSubmit, onCancel }: AgendaFormProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const { auth } = useStore();

  useEffect(() => {
    async function fetchDados() {
      const { data: leadsData } = await supabase.from('leads').select('id, nome, cnpj, telefone, contato_principal, regime_tributario').order('nome');
      if (leadsData) setLeads(leadsData);

      const { data: usuariosData } = await supabase.from('usuarios').select('id, nome').order('nome');
      if (usuariosData) setUsuarios(usuariosData);
    }
    fetchDados();
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
      telefone_cliente: initialData?.telefone_cliente || "",
      modalidade: initialData?.modalidade || "Remoto",
      local_link: initialData?.local_link || "",
      mensagem_cliente_imediata: initialData?.mensagem_cliente_imediata || "Olá! Seu agendamento foi confirmado. Seguem os detalhes:",
      mensagem_cliente_lembrete: initialData?.mensagem_cliente_lembrete || "Olá! Passando para lembrar da nossa reunião amanhã.",
      mensagem_equipe: initialData?.mensagem_equipe || "Karen, novo agendamento marcado no sistema!",
    },
  });

  const watchLeadId = form.watch("lead_id");
  const selectedLead = leads.find(l => l.id === watchLeadId);

  // Auto-preenche o telefone do cliente quando um lead é selecionado
  useEffect(() => {
    if (selectedLead && selectedLead.telefone) {
      form.setValue("telefone_cliente", selectedLead.telefone);
    } else if (!selectedLead || watchLeadId === 'none') {
      form.setValue("telefone_cliente", "");
    }
    // Se lead selecionado mas sem telefone, mantém vazio para o usuário preencher
  }, [watchLeadId, selectedLead]);

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
              <div><span className="text-muted-foreground">Contato:</span> {selectedLead.contato_principal || 'Não informado'}</div>
              <div><span className="text-muted-foreground">Regime:</span> {selectedLead.regime_tributario || 'Não informado'}</div>
            </div>

            {/* Telefone do cliente para WhatsApp */}
            <FormField
              control={form.control}
              name="telefone_cliente"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FormLabel className="text-[11px] font-semibold text-foreground/80">
                      📱 WhatsApp do Cliente
                    </FormLabel>
                    {field.value ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                        preenchido
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        não cadastrado — preencha aqui
                      </span>
                    )}
                  </div>
                  <FormControl>
                    <Input
                      placeholder="(17) 99999-9999"
                      className={`h-8 text-xs ${
                        !field.value
                          ? 'border-amber-300 focus-visible:ring-amber-400 bg-amber-50/50'
                          : 'border-emerald-200 focus-visible:ring-emerald-400'
                      }`}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground">
                    Usado para enviar a confirmação e o lembrete via WhatsApp.
                  </p>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
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
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="modalidade"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs">Modalidade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Remoto">Remoto (Online)</SelectItem>
                    <SelectItem value="Presencial">Presencial</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="local_link"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs">{form.watch("modalidade") === "Presencial" ? "Endereço Completo" : "Link da Reunião"}</FormLabel>
                <FormControl>
                  <Input placeholder={form.watch("modalidade") === "Presencial" ? "Ex: Rua das Flores, 123 - SP" : "Ex: https://meet.google.com/..."} className="h-8 text-xs" {...field} />
                </FormControl>
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

        <div className="rounded-xl border bg-card p-5 space-y-5 shadow-sm">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              Lembretes e Notificações (WhatsApp)
            </h4>
            <p className="text-xs text-muted-foreground mt-1">Configure as mensagens automáticas que serão enviadas.</p>
          </div>

          <div className="space-y-4">
            {/* Bloco Equipe (Karen) */}
            <div className={`rounded-xl border transition-colors ${form.watch("lembrete_anterior") ? "bg-indigo-50/30 border-indigo-200" : "bg-card"}`}>
              <FormField
                control={form.control}
                name="lembrete_anterior"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Lembrete Interno (Para Karen/Equipe)</FormLabel>
                      <p className="text-[11px] text-muted-foreground">Notifica a equipe interna no WhatsApp sobre este agendamento.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {form.watch("lembrete_anterior") && (
                <div className="px-4 pb-4 animate-in fade-in zoom-in duration-200">
                  <FormField
                    control={form.control}
                    name="mensagem_equipe"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[11px] text-indigo-800 dark:text-indigo-400 font-medium">O que enviar para a Karen?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ex: Karen, temos uma nova demonstração marcada..." 
                            className="min-h-[60px] text-xs resize-none bg-white dark:bg-slate-900 border-indigo-100 focus-visible:ring-indigo-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Bloco Cliente */}
            <div className={`rounded-xl border transition-colors ${form.watch("lembrete_dia") ? "bg-emerald-50/30 border-emerald-200" : "bg-card"}`}>
              <FormField
                control={form.control}
                name="lembrete_dia"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Lembrete Externo (Para o Cliente)</FormLabel>
                      <p className="text-[11px] text-muted-foreground">O cliente receberá um bilhete de confirmação.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("lembrete_dia") && (
                <div className="px-4 pb-4 space-y-4 animate-in fade-in zoom-in duration-200">
                  <FormField
                    control={form.control}
                    name="mensagem_cliente_imediata"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">Mensagem de Confirmação (Enviada na hora)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ex: Olá! Seu agendamento foi confirmado para..." 
                            className="min-h-[50px] text-xs resize-none bg-white dark:bg-slate-900 border-emerald-100 focus-visible:ring-emerald-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="mensagem_cliente_lembrete"
                    render={({ field }) => (
                      <FormItem className="space-y-1 pt-2 border-t border-emerald-100">
                        <FormLabel className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">Mensagem de Lembrete (1 dia antes)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ex: Olá! Passando para lembrar do nosso compromisso amanhã..." 
                            className="min-h-[50px] text-xs resize-none bg-white dark:bg-slate-900 border-emerald-100 focus-visible:ring-emerald-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </div>

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
                    <FormLabel className="text-[10px]">Outro WhatsApp da Equipe</FormLabel>
                    <FormControl>
                      <Input placeholder="(17) 99999-9999" className="h-8 text-xs" {...field} />
                    </FormControl>
                    <p className="text-[10px] text-muted-foreground">Além da Karen, envia para este número também.</p>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
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
