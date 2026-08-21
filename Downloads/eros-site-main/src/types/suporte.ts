export type TicketStatus = "Aberto" | "Em Andamento" | "Resolvido" | "Cancelado";
export type TicketPriority = "Baixa" | "Média" | "Alta" | "Urgente";
export type TicketType = string;

export interface Ticket {
  id: string;
  ticket_number: number;
  titulo: string;
  descricao?: string;
  empresa_id: string;
  contato_nome?: string;
  tipo: TicketType;
  modulo?: string;
  responsavel?: string;
  
  data_inicio?: string;
  data_fim?: string;
  hora_inicio?: string;
  hora_fim?: string;
  imagens?: string[];

  status: TicketStatus;
  prioridade: TicketPriority;
  tags: string[];
  created_at: string;
  
  // Relações
  empresa?: {
    id: string;
    nome: string;
  };
}

export type CategoriaPendencia = "Desenvolvimento" | "Reunião" | "Ideia" | "Pedido" | "Outros";
export type StatusPendencia = "Pendente" | "Em Andamento" | "Concluído";

export interface Pendencia {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: CategoriaPendencia;
  status: StatusPendencia;
  prioridade: TicketPriority;
  criado_por?: string;
  tags: string[];
  created_at: string;
  
  // Novos campos
  data_inicio?: string;
  data_fim?: string;
  hora_inicio?: string;
  hora_fim?: string;
  responsavel?: string;
  cliente_id?: string;
  imagens?: string[];
  criado_por_nome?: string;
  observacao?: string;
  
  // Relações
  cliente?: {
    id: string;
    nome: string;
  };
}

export type InteracaoTipo = "Reunião" | "WhatsApp" | "E-mail" | "Telefone" | "Visita Técnica" | "Check-in Rápido";

export interface RotinaContato {
  id: string;
  empresa_id: string;
  data_contato: string;
  tipo_interacao: InteracaoTipo;
  notas?: string;
  created_at: string;
}

export interface DiagnosticoSnapshot {
  id: string;
  diagnostico_id: string;
  payload_estatico: any; // JSONB da estrutura da proposta
  versao: string;
  congelado_por?: string;
  created_at: string;
}

export type StatusRotina = "Em dia" | "Alerta" | "Atrasado" | "Sem contato";
