import { createFileRoute } from "@tanstack/react-router";
import { GenericCrud } from "@/components/suporte/generic-crud";

export const Route = createFileRoute("/_suporte/cadastros/tickets")({
  component: TiposTicketPage,
});

function TiposTicketPage() {
  return (
    <GenericCrud
      title="Tipos de Tickets"
      description="Categorias principais de um chamado (ex: Bug, Dúvida, Solicitação)."
      field="tipos_ticket"
    />
  );
}
