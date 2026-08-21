import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_comercial")({
  ssr: false,
  component: AppLayout,
});

// Matriz global de quem pode acessar qual rota principal
const rolesMatrix: Record<string, string[]> = {
  "/dashboard": ["Administrador", "Comercial", "Financeiro", "Padrão", "Vendedor", "Usuário"],
  "/empresas": ["Administrador", "Comercial", "Financeiro", "Padrão", "Vendedor", "Usuário"],
  "/leads": ["Administrador", "Comercial", "Vendedor", "Usuário"],
  "/diagnosticos": ["Administrador", "Comercial", "Vendedor"],
  "/pipeline": ["Administrador", "Comercial", "Padrão", "Vendedor", "Usuário"],
  "/agenda": ["Administrador", "Comercial", "Padrão", "Vendedor", "Usuário"],
  "/historico": ["Administrador", "Comercial", "Padrão", "Vendedor", "Usuário"],
  "/relatorios": ["Administrador", "Financeiro"],
  "/convites": ["Administrador", "Desenvolvedor"],
  "/configuracoes": ["Administrador", "Desenvolvedor"],
  "/usuarios-config": ["Administrador", "Desenvolvedor"],
  "/usuarios": ["Administrador", "Desenvolvedor"],
};

function AppLayout() {
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
    
    // Pega a "base" da rota (ex: /empresas/nova -> /empresas) para validar a área
    const baseRoute = "/" + pathname.split("/")[1];
    
    const allowedRoles = rolesMatrix[baseRoute];
    if (allowedRoles && !allowedRoles.includes(role)) {
      toast.error("Acesso Negado: Seu perfil não tem permissão para acessar esta área.");
      navigate({ to: "/dashboard", replace: true });
    }

    // 3. Inscrever-se para notificações em tempo real de questionários respondidos
    const subscription = supabase
      .channel('diagnosticos-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'diagnosticos',
        },
        (payload) => {
          const oldStatus = payload.old?.status;
          const newStatus = payload.new?.status;
          
          if (oldStatus !== 'respondido' && newStatus === 'respondido') {
            const empresa = payload.new?.razao_social || 'Uma empresa';
            toast.success(`📢 Novo Questionário Recebido!`, {
              description: `${empresa} acabou de preencher e enviar o questionário.`,
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
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
