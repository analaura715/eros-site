import { createFileRoute } from "@tanstack/react-router";
import { GenericCrud } from "@/components/suporte/generic-crud";

export const Route = createFileRoute("/_suporte/cadastros/modulos-venux")({
  component: ModulosVenuxPage,
});

function ModulosVenuxPage() {
  return (
    <GenericCrud
      title="Módulos Venux"
      description="Gerencie as áreas do Venux para classificar os tickets."
      field="modulos_venux"
    />
  );
}
