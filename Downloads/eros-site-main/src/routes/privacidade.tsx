import { createFileRoute, Link } from "@tanstack/react-router";
import { VenuxLogo } from "@/components/venux-logo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade | Venux" }
    ]
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
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
        <h1 className="text-4xl font-extrabold mb-8 tracking-tight">Política de Privacidade</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">1. Coleta de Informações</h2>
            <p>
              Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail, informações de contato da empresa e dados inseridos em nossos formulários. Além disso, quando você utiliza a plataforma Venux, registramos automaticamente informações sobre o uso e interação com nossos serviços.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">2. Uso das Informações</h2>
            <p>
              As informações coletadas são utilizadas para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer, manter e melhorar nossos serviços.</li>
              <li>Personalizar a sua experiência na plataforma.</li>
              <li>Processar transações e enviar notificações relacionadas.</li>
              <li>Responder a comentários, dúvidas e fornecer suporte ao cliente.</li>
              <li>Enviar comunicações técnicas, atualizações e alertas de segurança.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">3. Compartilhamento de Dados</h2>
            <p>
              Não vendemos suas informações pessoais. Podemos compartilhar seus dados com prestadores de serviços de confiança que nos auxiliam na operação da plataforma (como serviços de hospedagem e banco de dados via Supabase), desde que estes concordem em manter a confidencialidade das informações.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">4. Segurança de Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger suas informações contra acesso, alteração, divulgação ou destruição não autorizada. No entanto, nenhum método de transmissão pela Internet é 100% seguro e não podemos garantir segurança absoluta.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">5. Seus Direitos</h2>
            <p>
              Você tem o direito de solicitar o acesso, correção ou exclusão de suas informações pessoais armazenadas em nossa plataforma. Caso deseje exercer esses direitos, entre em contato através de nossos canais de suporte.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">6. Contato</h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados, entre em contato conosco através do suporte da plataforma.
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
