import { createFileRoute } from "@tanstack/react-router";
import { GenericCrud } from "@/components/suporte/generic-crud";

export const Route = createFileRoute("/_suporte/cadastros/modulos-eros")({
  component: ModulosErosPage,
});

function ModulosErosPage() {
  return (
    <GenericCrud
      title="Módulos Eros"
      description="Gerencie as áreas do ERP Eros para classificar os tickets."
      field="modulos"
    />
  );
}
