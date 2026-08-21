import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_suporte")({
  ssr: false,
  component: SuporteLayout,
});

// Matriz global de quem pode acessar qual rota principal do suporte
const rolesMatrix: Record<string, string[]> = {
  "/chamados": ["Administrador", "Suporte", "Desenvolvedor", "Padrão"],
  "/pendencias": ["Administrador", "Suporte", "Desenvolvedor", "Padrão"],
  "/rotinas": ["Administrador", "Suporte", "Desenvolvedor", "Padrão"],
  "/clientes": ["Administrador", "Suporte", "Desenvolvedor", "Padrão"],
  "/painel": ["Administrador", "Suporte", "Desenvolvedor"],
  "/metricas": ["Administrador", "Suporte", "Desenvolvedor"],
  "/ajustes": ["Administrador", "Desenvolvedor"],
};

function SuporteLayout() {
  const { auth } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // wait one tick for store hydration
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    
    // 1. Verifica se não tá logado
    if (!auth) {
      navigate({ to: "/login", replace: true });
      return;
    }

    // 2. Verifica se a rota é permitida para o cargo atual
    const role = auth.role || "Padrão";
    
    // Pega a "base" da rota (ex: /chamados/novo -> /chamados) para validar a área
    const baseRoute = "/" + pathname.split("/")[1];
    
    const allowedRoles = rolesMatrix[baseRoute];
    if (allowedRoles && !allowedRoles.includes(role)) {
      toast.error("Acesso Negado: Seu perfil não tem permissão para acessar o suporte.");
      navigate({ to: "/modulos", replace: true });
    }
  }, [ready, auth, navigate, pathname]);

  if (!auth) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
