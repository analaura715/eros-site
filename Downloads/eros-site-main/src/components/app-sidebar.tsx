import { Link, useRouterState } from "@tanstack/react-router";
import { VenuxLogo } from "@/components/venux-logo";
import { LayoutDashboard, Users, CalendarDays, Building2, Contact, Target, KanbanSquare, ListTodo, FileText, BarChart3, BarChart, Settings, LifeBuoy } from "lucide-react";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { auth } = useStore();
  const role = auth?.role || "Padrão";

  // Lógica de Permissões (RBAC) e Módulos
  const isSupportModule = pathname.startsWith("/chamados") || pathname.startsWith("/suporte") || pathname.startsWith("/clientes") || pathname.startsWith("/rotinas") || pathname.startsWith("/ajustes") || pathname.startsWith("/painel") || pathname.startsWith("/metricas") || pathname.startsWith("/pendencias") || pathname.startsWith("/cadastros");
  const isUsuariosModule = pathname.startsWith("/usuarios") || pathname.startsWith("/convites") || pathname.startsWith("/usuarios-config");

  const cadastrosMenuItem = { 
    title: "Cadastros", 
    url: "/cadastros", 
    icon: Building2, 
    highlight: true,
    roles: ["Administrador", "Suporte", "Desenvolvedor", "Padrão", "Comercial", "Financeiro", "Vendedor", "Usuário"],
    subItems: [
      { title: "Cliente", url: "/clientes" },
      { title: "Setores", url: "/cadastros/setores" },
      { title: "Tickets", url: "/cadastros/tickets" },
      { title: "Módulos Eros", url: "/cadastros/modulos-eros" },
      { title: "Módulos Venux", url: "/cadastros/modulos-venux" },
    ]
  };

  const comercialItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["Administrador", "Comercial", "Financeiro", "Padrão", "Vendedor", "Usuário"] },
    { title: "Empresas", url: "/empresas", icon: Building2, roles: ["Administrador", "Comercial", "Financeiro", "Padrão", "Vendedor", "Usuário"] },
    { title: "Leads", url: "/leads", icon: Target, roles: ["Administrador", "Comercial", "Vendedor", "Usuário"] },
    { title: "Documentos", url: "/diagnosticos", icon: FileText, roles: ["Administrador", "Comercial", "Vendedor"] },
    { title: "Pipeline", url: "/pipeline", icon: KanbanSquare, roles: ["Administrador", "Comercial", "Padrão", "Vendedor", "Usuário"] },
    { title: "Agenda", url: "/agenda", icon: CalendarDays, roles: ["Administrador", "Comercial", "Padrão", "Vendedor", "Usuário"] },
    { title: "Histórico", url: "/historico", icon: ListTodo, roles: ["Administrador", "Comercial", "Padrão", "Vendedor", "Usuário"] },
    cadastrosMenuItem,
    { title: "Relatórios", url: "/relatorios", icon: BarChart3, roles: ["Administrador", "Financeiro"] },
  ];

  const suporteItems = [
    { title: "Dashboard", url: "/painel", icon: LayoutDashboard, roles: ["Administrador", "Suporte", "Desenvolvedor"] },
    { title: "Chamados", url: "/chamados", icon: LifeBuoy, roles: ["Administrador", "Suporte", "Desenvolvedor", "Padrão"] },
    { title: "Pendências", url: "/pendencias", icon: KanbanSquare, roles: ["Administrador", "Suporte", "Desenvolvedor", "Padrão"] },
    { title: "Rotina de Contatos", url: "/rotinas", icon: Contact, roles: ["Administrador", "Suporte", "Desenvolvedor", "Padrão"] },
    cadastrosMenuItem,
    { title: "Relatórios", url: "/metricas", icon: BarChart, roles: ["Administrador", "Suporte", "Desenvolvedor"] },
  ];

  const usuariosItems = [
    { title: "Gestão de Usuários", url: "/usuarios", icon: Users, roles: ["Administrador", "Desenvolvedor"] },
    cadastrosMenuItem,
  ];

  let rawItems = comercialItems;
  if (isSupportModule) rawItems = suporteItems;
  else if (isUsuariosModule) rawItems = usuariosItems;

  const items = rawItems.filter(item => item.roles.includes(role));

  return (
    <Sidebar collapsible="icon" className="print:hidden">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          <VenuxLogo className="h-9 w-9 shrink-0 drop-shadow-sm" />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden -space-y-1 pt-1">
            <span className="text-2xl font-bold tracking-tight text-[#0a1128] dark:text-white">venux</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-semibold ml-0.5">PLATAFORMA DE GESTÃO</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                item.subItems ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={pathname.startsWith(item.url) || pathname.startsWith("/clientes")}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem className={item.highlight ? "mt-2 mb-2 bg-primary/5 rounded-md border border-primary/10" : ""}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} className={item.highlight ? "hover:bg-primary/10" : ""}>
                          <item.icon className={item.highlight ? "h-4 w-4 text-primary" : "h-4 w-4"} />
                          <span className={item.highlight ? "font-semibold text-primary" : ""}>{item.title}</span>
                          <ChevronRight className={`ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${item.highlight ? "text-primary" : ""}`} />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={pathname.startsWith(subItem.url)}>
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
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

