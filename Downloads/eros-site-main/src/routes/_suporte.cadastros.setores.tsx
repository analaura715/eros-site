import { createFileRoute } from "@tanstack/react-router";
import { GenericCrud } from "@/components/suporte/generic-crud";

export const Route = createFileRoute("/_suporte/cadastros/setores")({
  component: SetoresPage,
});

function SetoresPage() {
  return (
    <GenericCrud
      title="Setores (Responsáveis)"
      description="Gerencie as equipes ou níveis de suporte para atribuição de tickets."
      field="setores"
    />
  );
}
