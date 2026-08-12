import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ 
    meta: [
      { title: "Recuperar Senha | Nexa CRM" }, 
      { name: "description", content: "Recupere o acesso à sua conta." }
    ] 
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Link de recuperação enviado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro ao tentar enviar o link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex font-sans bg-[#F7F8FA]">
      
      {/* Lado Esquerdo - Imersão Visual (Desktop Only) */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0D1B4C] flex-col justify-between p-14 overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#00B5E2] opacity-[0.25] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#00D26A] opacity-[0.25] blur-[150px] pointer-events-none" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-[#00B5E2] opacity-[0.20] blur-[80px] pointer-events-none" />
        
        {/* Logo Branca Grande */}
        <div className="relative z-10 flex items-center gap-3">
           <img 
             src="/logo.png" 
             alt="Nexa Logo" 
             className="h-16 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]" 
             onError={(e) => { e.currentTarget.style.display = 'none' }} 
           />
        </div>
        
        {/* Conteúdo Central */}
        <div className="relative z-10 max-w-[480px] mt-10">
          <h1 className="text-[42px] font-bold mb-6 leading-[1.1] text-white tracking-tight">
            Recupere seu acesso com segurança.
          </h1>
          <p className="text-white/70 text-[17px] leading-relaxed mb-10 font-light">
            Esqueceu sua senha? Não se preocupe. Nosso sistema envia um link seguro diretamente para o seu e-mail corporativo.
          </p>
          
          <div className="space-y-4">
            {[
              "Processo Criptografado",
              "Recuperação Imediata"
            ].map((feature, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 text-white/90 text-sm font-medium"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) ${0.3 + i * 0.1}s`
                }}
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#00C875]/20 text-[#00C875]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
        
        {/* Ilustração 3D */}
        <div 
          className="absolute right-0 top-[25%] translate-x-[15%] pointer-events-none"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateX(15%) translateY(0) scale(1)' : 'translateX(25%) translateY(20px) scale(0.95)',
            transition: 'all 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s'
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B4C] to-transparent z-10 w-32" />
            <img 
              src="/hero-3d.jpg" 
              alt="CRM Abstract 3D" 
              className="w-[500px] h-[500px] object-cover rounded-full mix-blend-screen opacity-90 blur-[1px] shadow-2xl" 
            />
            <div className="absolute inset-0 rounded-full border-[1px] border-white/10 shadow-[0_0_100px_rgba(31,94,255,0.2)]" />
          </div>
        </div>

        {/* Footer lateral */}
        <div className="relative z-10 text-xs text-white/40 flex gap-6">
          <span>&copy; {new Date().getFullYear()} Nexa CRM</span>
        </div>
      </div>

      {/* Lado Direito - Card de Recuperação */}
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
            <Link to="/login" className="self-start p-2 -ml-2 mb-4 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            <div className="w-12 h-12 bg-gradient-to-r from-[#00B5E2]/10 to-[#00D26A]/10 rounded-2xl flex items-center justify-center mb-6 text-[#00B5E2]">
              <KeyRound className="w-6 h-6" />
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
              Recuperar Senha
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Informe seu e-mail corporativo cadastrado e nós enviaremos instruções de redefinição.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email corporativo</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#00B5E2] transition-colors" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="nome@empresa.com.br"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="h-12 pl-11 rounded-xl bg-gray-50/50 border-gray-200 focus:border-[#00B5E2] focus:ring-[#00B5E2] focus:bg-white transition-all text-sm text-gray-900"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-[#00B5E2] to-[#00D26A] hover:opacity-90 text-white shadow-lg shadow-[#00B5E2]/25 hover:shadow-[#00D26A]/40 hover:-translate-y-[1px] transition-all duration-200 border-0" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
            </form>
          ) : (
            <div className="p-6 bg-[#00C875]/10 border border-[#00C875]/20 rounded-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
              <div className="w-12 h-12 bg-[#00C875] rounded-full flex items-center justify-center mb-4 text-white shadow-lg shadow-[#00C875]/30">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#0D1B4C] text-lg mb-2">Verifique seu e-mail</h3>
              <p className="text-sm text-gray-600 mb-6 font-medium">
                Enviamos um link seguro para <strong>{email}</strong>. Siga as instruções do e-mail para cadastrar sua nova senha.
              </p>
              <Button 
                variant="outline" 
                className="w-full h-11 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => navigate({ to: "/login" })}
              >
                Voltar para o Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
