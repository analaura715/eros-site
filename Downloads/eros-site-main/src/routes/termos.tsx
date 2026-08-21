import { createFileRoute, Link } from "@tanstack/react-router";
import { VenuxLogo } from "@/components/venux-logo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso | Venux" }
    ]
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <header className="border-b bg-white dark:bg-slate-950 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VenuxLogo className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl tracking-tight">venux</span>
          </div>
          <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-8 tracking-tight">Termos de Uso</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma Venux ("Plataforma"), você concorda em cumprir e ficar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">2. Descrição do Serviço</h2>
            <p>
              O Venux é uma plataforma de gestão integrada projetada para fornecer ferramentas de CRM, processos internos, suporte, marketing e organização financeira. O acesso à plataforma é concedido mediante convite e/ou criação de conta com chave de acesso válida.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">3. Responsabilidades do Usuário</h2>
            <p>
              Ao utilizar a Plataforma, você concorda em:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer informações verdadeiras e precisas durante o registro.</li>
              <li>Manter a confidencialidade de suas credenciais de acesso.</li>
              <li>Não utilizar a plataforma para fins ilegais ou não autorizados.</li>
              <li>Não tentar contornar ou violar as medidas de segurança do sistema.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">4. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, design, logotipos e códigos presentes na plataforma Venux são de propriedade exclusiva da Venux ou de seus licenciadores, sendo protegidos por leis de direitos autorais e propriedade intelectual. O uso não autorizado destes materiais é estritamente proibido.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">5. Limitação de Responsabilidade</h2>
            <p>
              O Venux é fornecido "como está" e "conforme disponível". Não garantimos que a plataforma estará livre de interrupções ou erros. Em nenhuma circunstância o Venux será responsável por danos indiretos, incidentais ou consequenciais decorrentes do uso da plataforma.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">6. Modificações dos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Notificaremos os usuários sobre mudanças significativas através da plataforma ou por e-mail. O uso continuado após as alterações constitui aceitação dos novos termos.
            </p>
          </section>
        </div>
      </main>
      
      <footer className="border-t py-8 bg-muted/20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Venux Plataforma de Gestão. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
