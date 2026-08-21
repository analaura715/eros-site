import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { VenuxLogo } from "@/components/venux-logo";
import { Loader2, Mail, Lock, CheckCircle2, User, KeyRound, ArrowRight, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ 
    meta: [
      { title: "Criar Conta | Venux Plataforma de Gestão" }, 
      { name: "description", content: "Crie sua conta no Venux." }
    ] 
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", inviteKey: "" });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const keyFromUrl = params.get('key') || params.get('invite');
      if (keyFromUrl) {
        setForm((prev) => ({ ...prev, inviteKey: keyFromUrl }));
      }
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.inviteKey) {
      toast.error("Você precisa de uma chave de acesso para se cadastrar.");
      return;
    }

    setLoading(true);
    
    try {
      // 1. Valida a chave via RPC antes de tentar o signup
      const { data: inviteCheck, error: rpcError } = await supabase.rpc('validar_convite', {
        p_chave: form.inviteKey
      });

      if (rpcError) {
        throw new Error("Erro ao validar chave de acesso.");
      }

      if (inviteCheck && !inviteCheck.valido) {
        toast.error(inviteCheck.erro || "Chave inválida.");
        setLoading(false);
        return;
      }

      // 2. Se a chave for válida, tenta registrar enviando a chave no metadata
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nome: form.name,
            chave_acesso: form.inviteKey
          }
        }
      });

      if (error) {
        if (error.message?.toLowerCase().includes('rate limit') || error.status === 429) {
          throw new Error("Muitas tentativas de cadastro em pouco tempo. Aguarde alguns minutos e tente novamente.");
        }
        if (error.message?.toLowerCase().includes('email') && error.message?.toLowerCase().includes('confirm')) {
          throw new Error("Confirme seu e-mail para continuar. Verifique sua caixa de entrada.");
        }
        if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already exists')) {
          throw new Error("Este e-mail já está cadastrado. Tente fazer login.");
        }
        throw new Error(error.message);
      }

      if (data.user && !data.user.email_confirmed_at && !data.session) {
        // Email confirmation is required — inform the user
        toast.success("Cadastro realizado! Verifique seu e-mail para confirmar e acessar o sistema.");
        return;
      }

      if (data.user) {
        toast.success("Conta criada com sucesso! Redirecionando...");
        navigate({ to: "/dashboard" });
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Ocorreu um erro ao tentar criar a conta.");
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
            Eleve a gestão de todo o seu negócio.
          </h1>
          <p className="text-white/80 text-[18px] leading-relaxed mb-10 font-normal">
            Sua chave de acesso concede entrada imediata à plataforma. Configure sua conta em segundos e tenha a plataforma de gestão mais inteligente do mercado em suas mãos.
          </p>
          
          <div className="space-y-4">
            {[
              "Acesso Seguro (Convite Exclusivo)",
              "Sincronização Instantânea com Supabase",
              "Ferramentas Corporativas de Alta Performance"
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

        {/* Footer lateral */}
        <div className="relative z-10 text-xs text-white/50 flex gap-6 pt-4 border-t border-white/10">
          <span>&copy; {new Date().getFullYear()} Venux</span>
          <Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
          <Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
        </div>
      </div>

      {/* Lado Direito - Card de Cadastro */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#F7F8FA]">
        
        <div 
          className="w-full max-w-[460px] bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-gray-100"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {/* Header do Card */}
          <div className="flex flex-col mb-8">
            <img 
              src="/logo.png" 
              alt="Venux Logo" 
              className="h-12 w-auto object-contain self-start mb-6" 
              onError={(e) => { e.currentTarget.style.display = 'none' }} 
            />
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
              Criar sua conta
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Preencha os dados e informe a sua chave de acesso.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Usuário</Label>
              <div className="relative group">
                <User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#00B5E2] transition-colors" />
                <Input 
                  id="name"
                  type="text" 
                  placeholder="Seu usuário"
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required 
                  className="h-12 pl-11 rounded-xl bg-gray-50/50 border-gray-200 focus:border-[#1F5EFF] focus:ring-[#1F5EFF] transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#00B5E2] transition-colors" />
                <Input 
                  id="email"
                  type="email" 
                  placeholder="nome@empresa.com.br"
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  required 
                  className="h-12 pl-11 rounded-xl bg-gray-50/50 border-gray-200 focus:border-[#1F5EFF] focus:ring-[#1F5EFF] transition-all text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Senha (Mín. 6 caracteres)</Label>
              <div className="relative group">
                <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#00B5E2] transition-colors" />
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  required 
                  minLength={6}
                  className="h-12 pl-11 pr-11 rounded-xl bg-gray-50/50 border-gray-200 focus:border-[#00B5E2] focus:ring-[#00B5E2] transition-all text-sm text-gray-900"
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

            <div className="space-y-1.5 pt-2">
              <Label htmlFor="inviteKey" className="text-xs font-bold text-[#0D1B4C] uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#00C875]" />
                Chave de Acesso (Convite)
              </Label>
              <div className="relative group">
                <Input 
                  id="inviteKey"
                  type="text" 
                  placeholder="Ex: NX-8F92-K0L1"
                  value={form.inviteKey} 
                  onChange={(e) => setForm({ ...form, inviteKey: e.target.value })} 
                  required 
                  className="h-12 rounded-xl bg-[#00C875]/5 border-[#00C875]/20 focus:border-[#00C875] focus:ring-[#00C875]/20 transition-all text-sm font-mono tracking-widest text-[#0D1B4C]"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 mt-4 text-base font-medium rounded-xl bg-gradient-to-r from-[#00B5E2] to-[#00D26A] hover:opacity-90 text-white shadow-lg shadow-[#00B5E2]/25 hover:shadow-[#00D26A]/40 hover:-translate-y-[1px] transition-all duration-200 border-0" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando Chave...
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Validar e Criar Conta
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </div>
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-500 pt-4 mt-2">
              Já faz parte da equipe?{" "}
              <Link to="/login" className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B5E2] to-[#00D26A] hover:opacity-80 font-bold transition-all">
                Fazer login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

