import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { NexaLogo } from "@/components/nexa-logo";
import { Building2, LifeBuoy, Megaphone, Target, Briefcase, LogOut } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
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
import { toast } from "sonner";

export const Route = createFileRoute("/modulos")({
  component: ModulosPage,
});

function ModulosPage() {
  const { auth, logout } = useStore();
  const navigate = useNavigate();

  if (!auth) {
    navigate({ to: "/login", replace: true });
    return null;
  }

  const modulos = [
    {
      title: "Comercial",
      description: "CRM completo, pipeline, leads e agenda.",
      icon: Target,
      path: "/dashboard",
      color: "from-blue-500 to-cyan-500",
      active: true,
    },
    {
      title: "Suporte",
      description: "Gestão de chamados e atendimento ao cliente.",
      icon: LifeBuoy,
      path: "/chamados",
      color: "from-green-500 to-emerald-500",
      active: true,
    },
    {
      title: "Marketing",
      description: "Campanhas, automações e métricas.",
      icon: Megaphone,
      path: "#",
      color: "from-purple-500 to-pink-500",
      active: false,
    },
    {
      title: "Gestão",
      description: "Controle financeiro, RH e relatórios gerenciais.",
      icon: Briefcase,
      path: "#",
      color: "from-orange-500 to-red-500",
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur">
        <div className="flex items-center gap-2">
          <NexaLogo className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight">nexa</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <ThemeSwitcher />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {auth?.avatar ?? "?"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-sm font-medium">{auth?.name}</div>
                <div className="text-xs text-muted-foreground">{auth?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
                className="text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-5xl space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight">Bem-vindo(a), {auth.name.split(' ')[0]}</h1>
            <p className="text-lg text-muted-foreground">Selecione o módulo que deseja acessar hoje.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {modulos.map((modulo) => (
              <div
                key={modulo.title}
                onClick={() => {
                  if (modulo.active) {
                    navigate({ to: modulo.path });
                  } else {
                    toast.info(`O módulo de ${modulo.title} estará disponível em breve!`);
                  }
                }}
                className={`
                  relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300
                  ${modulo.active ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-primary/50' : 'cursor-not-allowed opacity-80 grayscale-[30%] hover:grayscale-0'}
                  group
                `}
              >
                {/* Gradient Header */}
                <div className={`h-2 w-full bg-gradient-to-r ${modulo.color}`} />
                
                <div className="p-6">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300
                    ${modulo.active ? 'bg-primary/10 text-primary group-hover:scale-110' : 'bg-muted text-muted-foreground'}
                  `}>
                    <modulo.icon className="w-6 h-6" />
                  </div>
                  
                  <h3 className="text-xl font-bold tracking-tight mb-2">{modulo.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{modulo.description}</p>
                </div>

                {!modulo.active && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      Em breve
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
