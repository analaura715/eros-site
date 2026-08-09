import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { auth } = useStore();
  return <Navigate to={auth ? "/modulos" : "/login"} replace />;
}
