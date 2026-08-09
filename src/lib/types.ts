export type PipelineStatus =
  | "new"
  | "attempted"
  | "in_contact"
  | "demo_to_schedule"
  | "meeting_scheduled"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost";

export type Priority = "high" | "medium" | "low";

export type MeetingType = "video" | "phone" | "in_person";

export type MeetingStatus = "scheduled" | "completed" | "canceled" | "rescheduled";

export type OpportunityStage =
  | "qualificacao"
  | "demonstracao"
  | "proposta"
  | "negociacao"
  | "fechado_ganho"
  | "fechado_perdido";

export type HistoryEventType =
  | "status_change"
  | "meeting_scheduled"
  | "meeting_completed"
  | "note_added"
  | "proposal_sent"
  | "email_sent"
  | "call_logged"
  | "opportunity_created"
  | "opportunity_updated"
  | "deal_won"
  | "deal_lost";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string; // initials
  role: string;
  timezone?: string;
}

export interface Prospect {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  status: PipelineStatus;
  priority: Priority;
  ownerId: string;
  nextContact: string; // ISO
  value: number;
  createdAt: string;
}

export interface Note {
  id: string;
  prospectId: string;
  authorId: string;
  type: "call" | "email" | "note";
  body: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  prospectId: string;
  ownerId: string;
  title: string;
  type: MeetingType;
  link: string;
  start: string; // ISO
  durationMin: number;
  status: MeetingStatus;
  reminder: boolean;
  notes: string;
  description?: string;
  endTime?: string; // ISO
}

export interface Opportunity {
  id: string;
  prospectId: string;
  ownerId: string;
  title: string;
  stage: OpportunityStage;
  value: number;
  probability: number; // 0-100
  expectedCloseDate: string; // ISO
  createdAt: string;
  updatedAt: string;
  lostReason?: string;
  notes?: string;
}

export interface HistoryEvent {
  id: string;
  prospectId: string;
  authorId: string;
  type: HistoryEventType;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface GoalSettings {
  quantity: number;
  month: number; // 1-12
  year: number;
  label: string;
}

export const PIPELINE_STAGES: { key: PipelineStatus; label: string; color: string }[] = [
  { key: "new", label: "Novo", color: "bg-slate-500" },
  { key: "attempted", label: "Tentativa", color: "bg-amber-500" },
  { key: "in_contact", label: "Em Contato", color: "bg-blue-500" },
  { key: "demo_to_schedule", label: "Marcar Demonstração", color: "bg-indigo-500" },
  { key: "meeting_scheduled", label: "Demo Agendada", color: "bg-violet-500" },
  { key: "proposal_sent", label: "Proposta Enviada", color: "bg-fuchsia-500" },
  { key: "closed_won", label: "Fechado/Ganho", color: "bg-emerald-500" },
  { key: "closed_lost", label: "Perdido/Cancelado", color: "bg-rose-500" },
];

export const OPPORTUNITY_STAGES: { key: OpportunityStage; label: string; color: string }[] = [
  { key: "qualificacao", label: "Qualificação", color: "bg-slate-500" },
  { key: "demonstracao", label: "Demonstração", color: "bg-blue-500" },
  { key: "proposta", label: "Proposta", color: "bg-violet-500" },
  { key: "negociacao", label: "Negociação", color: "bg-amber-500" },
  { key: "fechado_ganho", label: "Fechado Ganho", color: "bg-emerald-500" },
  { key: "fechado_perdido", label: "Fechado Perdido", color: "bg-rose-500" },
];

export const HISTORY_EVENT_META: Record<HistoryEventType, { label: string; icon: string; color: string }> = {
  status_change: { label: "Mudança de Status", icon: "ArrowRightLeft", color: "text-blue-500" },
  meeting_scheduled: { label: "Reunião Agendada", icon: "CalendarPlus", color: "text-violet-500" },
  meeting_completed: { label: "Reunião Realizada", icon: "CheckCircle2", color: "text-emerald-500" },
  note_added: { label: "Nota Adicionada", icon: "FileText", color: "text-gray-500" },
  proposal_sent: { label: "Proposta Enviada", icon: "Send", color: "text-fuchsia-500" },
  email_sent: { label: "E-mail Enviado", icon: "Mail", color: "text-cyan-500" },
  call_logged: { label: "Ligação Registrada", icon: "Phone", color: "text-amber-500" },
  opportunity_created: { label: "Oportunidade Criada", icon: "Target", color: "text-indigo-500" },
  opportunity_updated: { label: "Oportunidade Atualizada", icon: "Pencil", color: "text-orange-500" },
  deal_won: { label: "Negócio Fechado", icon: "Trophy", color: "text-emerald-600" },
  deal_lost: { label: "Negócio Perdido", icon: "XCircle", color: "text-rose-500" },
};

export const PRIORITY_META: Record<Priority, { label: string; class: string }> = {
  high: { label: "Alta", class: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30" },
  medium: { label: "Média", class: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  low: { label: "Baixa", class: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
};

export const MEETING_TYPE_META: Record<MeetingType, { label: string; class: string }> = {
  video: { label: "Vídeo", class: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" },
  phone: { label: "Telefone", class: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30" },
  in_person: { label: "Presencial", class: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30" },
};

export const MEETING_STATUS_META: Record<MeetingStatus, { label: string; class: string }> = {
  scheduled: { label: "Agendada", class: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  completed: { label: "Realizada", class: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  canceled: { label: "Cancelada", class: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30" },
  rescheduled: { label: "Reagendada", class: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
};

export const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/New_York", label: "Nova York (GMT-5)" },
  { value: "Europe/London", label: "Londres (GMT+0)" },
  { value: "Europe/Lisbon", label: "Lisboa (GMT+0)" },
  { value: "America/Bogota", label: "Bogotá (GMT-5)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
];

export const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
