import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_comercial/contatos')({
  component: ContatosComponent,
});

function ContatosComponent() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Contatos</h1>
      <p className="text-muted-foreground mt-2">Página em construção.</p>
    </div>
  );
}
