import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, KeyRound, Mail, Send } from "lucide-react";
import { toast } from "sonner";

export function InviteGenerator() {
  const [role, setRole] = useState("Vendedor");
  const [expiresIn, setExpiresIn] = useState("24h");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulação da geração no Supabase
    setTimeout(() => {
      const randomToken = "vnx_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setGeneratedToken(randomToken);
      setIsGenerating(false);
      toast.success("Token gerado com sucesso!");
    }, 800);
  };

  const handleCopy = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(`${window.location.origin}/register?token=${generatedToken}`);
      toast.info("Link de convite copiado para a área de transferência.");
    }
  };

  return (
    <Card className="border shadow-sm rounded-2xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/50 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Gerador de Acessos</CardTitle>
            <CardDescription>Crie tokens para convidar novos membros para a plataforma.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Perfil (Role) do Convidado</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Administrador">Administrador</SelectItem>
                <SelectItem value="Suporte">Suporte</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Expiração do Token</Label>
            <Select value={expiresIn} onValueChange={setExpiresIn}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Tempo de expiração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hora</SelectItem>
                <SelectItem value="24h">24 Horas</SelectItem>
                <SelectItem value="7d">7 Dias</SelectItem>
                <SelectItem value="never">Nunca Expira</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating} 
          className="w-full sm:w-auto h-11 px-8 rounded-xl"
        >
          {isGenerating ? "Gerando..." : "Gerar Link de Convite"}
        </Button>

        {generatedToken && (
          <div className="mt-6 p-4 bg-muted/30 border rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Link de Convite Gerado</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input 
                  readOnly 
                  value={`${window.location.origin}/register?token=${generatedToken}`}
                  className="pr-12 h-11 bg-white font-mono text-sm rounded-xl"
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-primary"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" className="h-11 rounded-xl gap-2 bg-white">
                <Mail className="h-4 w-4" /> Enviar por E-mail
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Este link garantirá acesso automático ao perfil <strong>{role}</strong> e expira em <strong>{expiresIn}</strong>.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
