import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Moon, Sun, Settings } from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";
import { useMemo, useState, type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Button } from "@/components/ui/button";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { ProspectDialog } from "./prospect-dialog";
import { MeetingDialog } from "./meeting-dialog";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function AppShell({ children }: { children: ReactNode }) {
  const { auth, logout, theme, toggleTheme, state } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openProspect, setOpenProspect] = useState(false);
  const [openMeeting, setOpenMeeting] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { prospects: [], meetings: [] };
    return {
      prospects: state.prospects
        .filter(
          (p) =>
            p.company.toLowerCase().includes(q) ||
            p.contactName.toLowerCase().includes(q) ||
            p.phone.includes(q) ||
            p.email.toLowerCase().includes(q),
        )
        .slice(0, 6),
      meetings: state.meetings.filter((m) => m.title.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [search, state]);

  const title =
    pathname.startsWith("/dashboard") ? "Dashboard" :
    pathname.startsWith("/empresas") ? "Empresas" :
    pathname.startsWith("/contatos") ? "Contatos" :
    pathname.startsWith("/oportunidades") ? "Oportunidades" :
    pathname.startsWith("/pipeline") ? "Pipeline" :
    pathname.startsWith("/agenda") ? "Agenda" :
    pathname.startsWith("/atividades") ? "Atividades" :
    pathname.startsWith("/propostas") ? "Propostas" :
    pathname.startsWith("/relatorios") ? "Relatórios" :
    pathname.startsWith("/convites") ? "Acessos & Convites" :
    pathname.startsWith("/configuracoes") ? "Configurações" : "";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
            <SidebarTrigger />
            <div className="hidden md:block text-sm font-semibold">{title}</div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeSwitcher />
              
              <Popover onOpenChange={(open) => { if (open) state.markNotificationsAsRead?.(); }}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
                    <Bell className="h-4 w-4" />
                    {(state.notifications || []).some(n => !n.read) && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"></span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="font-semibold text-sm">Notificações</h3>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary" onClick={() => state.markNotificationsAsRead?.()}>
                      Marcar como lidas
                    </Button>
                  </div>
                  <ScrollArea className="h-[300px]">
                    {(!state.notifications || state.notifications.length === 0) ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma notificação nova</p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {state.notifications.map((n) => (
                          <div key={n.id} className={`flex flex-col gap-1 p-4 border-b last:border-0 transition-colors ${!n.read ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                            <p className="text-sm text-foreground">{n.message}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(n.date), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" size="icon" asChild>
                <Link to="/configuracoes">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{auth?.avatar ?? "?"}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="text-sm font-medium">{auth?.name}</div>
                    <div className="text-xs text-muted-foreground">{auth?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/configuracoes">Configurações</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate({ to: "/login" });
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
        </div>
      </div>
      <ProspectDialog open={openProspect} onOpenChange={setOpenProspect} />
      <MeetingDialog open={openMeeting} onOpenChange={setOpenMeeting} />

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-lg">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Buscar empresas, telefones, atividades..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>{search ? "No matches." : "Start typing to search."}</CommandEmpty>
              {results.prospects.length > 0 && (
                <CommandGroup heading="Prospects">
                  {results.prospects.map((p) => (
                    <CommandItem
                      key={p.id}
                      onSelect={() => {
                        setSearchOpen(false);
                        navigate({ to: "/empresas" });
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{p.company}</span>
                        <span className="text-xs text-muted-foreground">{p.contactName} · {p.phone}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.meetings.length > 0 && (
                <CommandGroup heading="Meetings">
                  {results.meetings.map((m) => (
                    <CommandItem
                      key={m.id}
                      onSelect={() => {
                        setSearchOpen(false);
                        navigate({ to: "/agenda" });
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{m.title}</span>
                        <span className="text-xs text-muted-foreground">{new Date(m.start).toLocaleString()}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
