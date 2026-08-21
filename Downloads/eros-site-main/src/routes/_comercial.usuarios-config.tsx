import { createFileRoute } from '@tanstack/react-router';
import { ConfiguracoesComponent } from './_comercial.configuracoes';

export const Route = createFileRoute('/_comercial/usuarios-config')({
  component: ConfiguracoesComponent,
});
