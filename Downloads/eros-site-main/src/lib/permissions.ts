import {
  LayoutDashboard,
  Building2,
  Target,
  KanbanSquare,
  CalendarDays,
  ListTodo,
  BarChart3,
  Settings,
  LifeBuoy,
  Contact,
  BarChart,
  Users,
  KeyRound,
  ShieldCheck,
  Lock,
  Bell,
  Sliders,
  FileText
} from "lucide-react";

export type Permission = {
  ver: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
};

export type FeaturePermissions = Record<string, Permission>;
export type ModulePermissions = Record<string, FeaturePermissions>;
export type UserPermissionsMap = Record<string, ModulePermissions>;

export const DEFAULT_PERM: Permission = { ver: false, criar: false, editar: false, excluir: false };
export const ALL_ON: Permission = { ver: true, criar: true, editar: true, excluir: true };

export const SYSTEM_MODULES = [
  {
    id: "comercial",
    label: "Comercial (CRM)",
    color: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
    badgeColor: "bg-blue-100 text-blue-700 ring-blue-600/20",
    Icon: LayoutDashboard,
    features: [
      { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { id: "empresas", label: "Empresas", Icon: Building2 },
      { id: "leads", label: "Leads", Icon: Target },
      { id: "diagnosticos", label: "Documentos", Icon: FileText },
      { id: "pipeline", label: "Pipeline", Icon: KanbanSquare },
      { id: "agenda", label: "Agenda", Icon: CalendarDays },
      { id: "historico", label: "Histórico", Icon: ListTodo },
      { id: "relatorios_crm", label: "Relatórios", Icon: BarChart3 },
      { id: "configuracoes_crm", label: "Configurações", Icon: Settings },
    ],
  },
  {
    id: "suporte",
    label: "Suporte & Chamados",
    color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
    badgeColor: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
    Icon: LifeBuoy,
    features: [
      { id: "painel", label: "Painel / Dashboard", Icon: LayoutDashboard },
      { id: "chamados", label: "Chamados", Icon: LifeBuoy },
      { id: "pendencias", label: "Pendências", Icon: KanbanSquare },
      { id: "rotinas", label: "Rotina de Contatos", Icon: Contact },
      { id: "clientes_suporte", label: "Clientes", Icon: Building2 },
      { id: "metricas", label: "Relatórios / Métricas", Icon: BarChart },
      { id: "ajustes_suporte", label: "Ajustes do Suporte", Icon: Settings },
    ],
  },
  {
    id: "usuarios",
    label: "Gestão de Usuários",
    color: "from-violet-500/20 to-violet-500/5 border-violet-500/30",
    badgeColor: "bg-violet-100 text-violet-700 ring-violet-600/20",
    Icon: Users,
    features: [
      { id: "membros", label: "Membros da Equipe", Icon: Users },
      { id: "convites", label: "Convites", Icon: KeyRound },
      { id: "perfis", label: "Perfis de Acesso", Icon: ShieldCheck },
      { id: "permissoes", label: "Permissões Granulares", Icon: Lock },
      { id: "usuarios_config", label: "Configurações", Icon: Settings },
    ],
  },
  {
    id: "configuracoes",
    label: "Configurações Gerais",
    color: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
    badgeColor: "bg-amber-100 text-amber-700 ring-amber-600/20",
    Icon: Settings,
    features: [
      { id: "perfil", label: "Meu Perfil", Icon: Users },
      { id: "seguranca", label: "Segurança", Icon: ShieldCheck },
      { id: "preferencias", label: "Preferências", Icon: Sliders },
      { id: "notificacoes", label: "Notificações", Icon: Bell },
    ],
  },
];
