import { Link, useRouterState } from "@tanstack/react-router";
import { VenuxLogo } from "@/components/venux-logo";
import { LayoutDashboard, Users, CalendarDays, Building2, Contact, Target, KanbanSquare, ListTodo, FileText, BarChart3, Settings, LifeBuoy } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useStore } from "@/lib/store";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { auth } = useStore();
  const role = auth?.role || "Padrão";

  // Lógica de Permissões (RBAC) e Módulos
  const isSupportModule = pathname.startsWith("/chamados") || pathname.startsWith("/suporte") || pathname.startsWith("/clientes");

  const comercialItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["Administrador", "Comercial", "Financeiro", "Suporte", "Padrão", "Vendedor", "Usuário"] },
    { title: "Empresas", url: "/empresas", icon: Building2, roles: ["Administrador", "Comercial", "Financeiro", "Suporte", "Padrão", "Vendedor", "Usuário"] },
    { title: "Leads", url: "/leads", icon: Target, roles: ["Administrador", "Comercial", "Vendedor", "Usuário"] },
    { title: "Diagnósticos", url: "/diagnosticos", icon: FileText, roles: ["Administrador", "Comercial", "Vendedor"] },
    { title: "Pipeline", url: "/pipeline", icon: KanbanSquare, roles: ["Administrador", "Comercial", "Padrão", "Vendedor", "Usuário"] },
    { title: "Agenda", url: "/agenda", icon: CalendarDays, roles: ["Administrador", "Comercial", "Suporte", "Padrão", "Vendedor", "Usuário"] },
    { title: "Histórico", url: "/historico", icon: ListTodo, roles: ["Administrador", "Comercial", "Suporte", "Padrão", "Vendedor", "Usuário"] },
    { title: "Relatórios", url: "/relatorios", icon: BarChart3, roles: ["Administrador", "Financeiro"] },
    { title: "Gestão de Usuários", url: "/convites", icon: Users, roles: ["Administrador", "Desenvolvedor"] },
    { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["Administrador", "Desenvolvedor"] },
  ];

  const suporteItems = [
    { title: "Chamados", url: "/chamados", icon: LifeBuoy, roles: ["Administrador", "Suporte", "Desenvolvedor", "Padrão"] },
    { title: "Clientes", url: "/clientes", icon: Building2, roles: ["Administrador", "Suporte", "Desenvolvedor", "Padrão"] },
    { title: "Dashboard", url: "/suporte/dashboard", icon: LayoutDashboard, roles: ["Administrador", "Suporte", "Desenvolvedor"] },
  ];

  const items = (isSupportModule ? suporteItems : comercialItems).filter(item => item.roles.includes(role));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          <VenuxLogo className="h-9 w-9 shrink-0 drop-shadow-sm" />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden -space-y-1 pt-1">
            <span className="text-2xl font-bold tracking-tight text-[#0a1128] dark:text-white">venux</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-semibold ml-0.5">CRM</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <div className="my-4 border-t border-border/50" />
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Trocar Módulo">
                  <Link to="/modulos" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Módulos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

