import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { VenuxLogo } from "@/components/venux-logo";
import { Loader2, Mail, Lock, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ 
    meta: [
      { title: "Venux | Plataforma de Gestão" }, 
      { name: "description", content: "Acesse sua conta." }
    ] 
  }),
  component: LoginPage,
});

function LoginPage() {
  const { setAuthSession } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let loginEmail = email.trim();

      // Se o usuário digitou apenas um nome (sem @), buscamos o e-mail atrelado a esse nome
      if (!loginEmail.includes('@')) {
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('email')
          .ilike('nome', loginEmail)
          .single();

        if (userError || !userData?.email) {
          throw new Error("Usuário não encontrado.");
        }
        
        loginEmail = userData.email;
      }

      // Login real no Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        // Busca o perfil completo incluindo cargo
        const { data: profile, error: profileError } = await supabase
          .from('usuarios')
          .select('nome, cargo, avatar_url')
          .eq('id', data.session.user.id)
          .single();

        let role = "Padrão";
        let name = "Usuário";
        let avatar = "";
        
        if (profile) {
          role = profile.cargo;
          name = profile.nome;
          avatar = profile.avatar_url || name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
        }

        // Injeta o usuário real no estado da aplicação
        setAuthSession({
          id: data.session.user.id,
          email: data.session.user.email!,
          name,
          role,
          avatar,
          notifyDesktop: false,
          notifyEmail: true,
        });

        toast.success("Bem-vindo de volta!");
        navigate({ to: "/modulos" });
      }
    } catch (err: any) {
      // Exibe o erro real do Supabase (ex: Email não confirmado) ou o genérico
      const errorMessage = err.message === "Invalid login credentials" 
        ? "Acesso Negado: E-mail ou senha incorretos." 
        : err.message || "Erro ao tentar fazer login.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex font-sans bg-[#F7F8FA]">
      
      {/* Lado Esquerdo - Imersão Visual com Degradê de Cores e Logo Destacada */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-[#060D27] via-[#0D1B4C] via-60% to-[#043343] flex-col justify-between p-14 overflow-hidden">
        
        {/* Camadas Sutis de Luz em Degradê */}
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#0056FF] to-[#00E676] opacity-[0.20] blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[650px] h-[650px] rounded-full bg-gradient-to-bl from-[#00B5E2] to-[#00C875] opacity-[0.22] blur-[150px] pointer-events-none" />
        <div className="absolute top-[35%] left-[25%] w-[400px] h-[400px] rounded-full bg-[#1F5EFF] opacity-[0.12] blur-[100px] pointer-events-none" />
        
        {/* Logo de Alto Impacto (Tamanho Ampliado BEM Destaque) */}
        <div className="relative z-10 flex items-center gap-5 pt-2">
          <VenuxLogo className="h-20 w-20 shrink-0 drop-shadow-[0_0_35px_rgba(0,181,226,0.6)]" />
          <div className="flex flex-col leading-none">
            <span className="text-6xl font-extrabold tracking-tight text-white drop-shadow-md">venux</span>
            <span className="text-xs uppercase tracking-[0.4em] text-[#00E676] font-extrabold mt-1.5 ml-0.5">PLATAFORMA DE GESTÃO</span>
          </div>
        </div>
        
        {/* Conteúdo Central */}
        <div className="relative z-10 max-w-[500px] my-auto py-8">
          <h1 className="text-[44px] font-extrabold mb-6 leading-[1.12] text-white tracking-tight drop-shadow-sm">
            Gestão inteligente para todas as áreas da sua empresa.
          </h1>
          <p className="text-white/80 text-[18px] leading-relaxed mb-10 font-normal">
            Tenha o melhor do CRM comercial, gerencie processos internos, organize o setor financeiro e acompanhe rotinas de suporte e marketing em uma única plataforma criada para a máxima performance.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              "Gestão CRM (Comercial)",
              "Processos Internos",
              "Suporte & Marketing",
              "Organização Financeira"
            ].map((feature, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 text-white/95 text-sm font-medium bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-md shadow-sm"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) ${0.3 + i * 0.1}s`
                }}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00C875]/20 text-[#00C875] shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer da lateral */}
        <div className="relative z-10 text-xs text-white/50 flex gap-6 pt-4 border-t border-white/10">
          <span>&copy; {new Date().getFullYear()} Venux</span>
          <Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
          <Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
        </div>
      </div>

      {/* Lado Direito - Card de Login (Branco/Clean) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#F7F8FA]">
        
        <div 
          className="w-full max-w-[440px] bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-gray-100"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {/* Header do Card */}
          <div className="flex flex-col mb-10">
            <div className="flex items-center gap-2.5 mb-6">
              <VenuxLogo className="h-9 w-9" />
              <span className="text-2xl font-bold tracking-tight text-[#0a1128]">venux</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
              Acesse sua conta
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Entre com suas credenciais para acessar a plataforma.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Usuário</Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#00B5E2] transition-colors" />
                <Input 
                  id="email"
                  type="text" 
                  placeholder="Seu nome de usuário"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="h-12 pl-11 rounded-xl bg-gray-50/50 border-gray-200 focus:border-[#00B5E2] focus:ring-[#00B5E2] focus:bg-white transition-all text-sm text-gray-900"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Senha</Label>
                <Link to="/forgot-password" className="text-sm text-[#00B5E2] hover:text-[#00D26A] hover:underline transition-colors font-medium">
                  Esqueceu sua senha?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#00B5E2] transition-colors" />
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="h-12 pl-11 pr-11 rounded-xl bg-gray-50/50 border-gray-200 focus:border-[#00B5E2] focus:ring-[#00B5E2] focus:bg-white transition-all text-sm text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 mt-4 text-base font-medium rounded-xl bg-gradient-to-r from-[#00B5E2] to-[#00D26A] hover:opacity-90 text-white shadow-lg shadow-[#00B5E2]/25 hover:shadow-[#00D26A]/40 hover:-translate-y-[1px] transition-all duration-200 border-0" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Entrando...
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Entrar na Plataforma
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </div>
              )}
            </Button>
            
            <div className="pt-6 mt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm font-medium">
              <span className="text-gray-500">Ainda não tem uma conta?</span>
              <Link to="/register" className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B5E2] to-[#00D26A] hover:opacity-80 font-bold transition-all">
                Criar conta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

