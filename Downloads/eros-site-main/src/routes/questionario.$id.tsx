import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { VenuxLogo } from "@/components/venux-logo";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute('/questionario/$id')({
  component: QuestionarioPublicoPage,
});

function QuestionarioPublicoPage() {
  const { id } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [diag, setDiag] = useState<any>(null);
  const [camposDinamicos, setCamposDinamicos] = useState<any[]>([]);
  
  // Respostas (Standard + Dinâmicas)
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [diagRes, configRes] = await Promise.all([
          supabase.from('diagnosticos').select('*').eq('id', id).maybeSingle(),
          supabase.from('configuracoes_orcamento').select('*').limit(1).maybeSingle()
        ]);
        
        if (diagRes.error) throw diagRes.error;
        setDiag(diagRes.data);
        
        if (configRes.data && configRes.data.formulario_builder) {
          setCamposDinamicos(configRes.data.formulario_builder);
        }
        
        // Inicializar form
        let initialRespostas: any = {
          razao_social: diagRes.data?.razao_social || '',
          cnpj: diagRes.data?.cnpj || '',
          cidade_uf: diagRes.data?.cidade_uf || '',
          telefone_whatsapp: diagRes.data?.telefone_whatsapp || ''
        };
        
        setRespostas(initialRespostas);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleChange = (campoId: string, value: any) => {
    setRespostas(prev => ({ ...prev, [campoId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const { razao_social, cnpj, cidade_uf, telefone_whatsapp, ...respostasDinamicas } = respostas;
      
      const payload = {
        razao_social,
        cnpj,
        cidade_uf,
        telefone_whatsapp,
        respostas_dinamicas: respostasDinamicas,
        status: 'respondido'
      };

      const { error } = await supabase.from('diagnosticos').update(payload).eq('id', id);
      if (error) throw error;
      
      toast.success('Diagnóstico enviado com sucesso!');
      setDiag({ ...diag, status: 'respondido' });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar o diagnóstico.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!diag) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full shadow-lg border-0 ring-1 ring-slate-200">
          <CardContent className="pt-8 pb-8 px-8 text-center text-slate-500">
            Link inválido ou diagnóstico não encontrado.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifica expiração
  const isExpired = diag.expira_em && new Date(diag.expira_em) < new Date();

  if (isExpired && diag.status !== 'respondido') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full shadow-lg border-0 ring-1 ring-slate-200">
          <CardContent className="pt-10 pb-8 px-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">⏰</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Este link expirou</h2>
            <p className="text-slate-500 mb-6">
              O prazo de validade deste questionário encerrou. Por favor, entre em contato com seu consultor comercial para gerar um novo link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (diag.status === 'respondido') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full shadow-lg border-0 ring-1 ring-slate-200">
          <CardContent className="pt-10 pb-8 px-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Diagnóstico Recebido!</h2>
            <p className="text-slate-500">
              Agradecemos por responder. Nossa equipe comercial já foi notificada e em breve enviará a proposta comercial.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex justify-center mb-10">
          <VenuxLogo />
        </div>
        
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Diagnóstico Operacional</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Por favor, preencha as informações abaixo para que possamos dimensionar o seu projeto com precisão.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <Card className="shadow-md border-slate-200/60 overflow-hidden">
             <div className="bg-indigo-600 px-6 py-4">
               <h2 className="text-lg font-bold text-white">Dados da Empresa</h2>
             </div>
             <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <Label>Razão Social / Nome Fantasia</Label>
                 <Input value={respostas.razao_social || ''} onChange={e => handleChange('razao_social', e.target.value)} required />
               </div>
               <div className="space-y-2">
                 <Label>CNPJ</Label>
                 <Input value={respostas.cnpj || ''} onChange={e => handleChange('cnpj', e.target.value)} required />
               </div>
               <div className="space-y-2">
                 <Label>Cidade / UF</Label>
                 <Input value={respostas.cidade_uf || ''} onChange={e => handleChange('cidade_uf', e.target.value)} required />
               </div>
               <div className="space-y-2">
                 <Label>Telefone / WhatsApp</Label>
                 <Input value={respostas.telefone_whatsapp || ''} onChange={e => handleChange('telefone_whatsapp', e.target.value)} required />
               </div>
             </CardContent>
          </Card>

          {camposDinamicos.length > 0 && (
            <Card className="shadow-md border-slate-200/60 overflow-hidden">
              <div className="bg-indigo-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white">Informações Técnicas</h2>
              </div>
              <CardContent className="p-6 space-y-6">
                
                {camposDinamicos.map(campo => (
                  <div key={campo.id} className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">{campo.pergunta}</Label>
                    
                    {campo.tipo === 'text' && (
                      <Input 
                        value={respostas[campo.id] || ''} 
                        onChange={e => handleChange(campo.id, e.target.value)} 
                        placeholder="Sua resposta..." 
                      />
                    )}
                    
                    {campo.tipo === 'number' && (
                      <Input 
                        type="number"
                        value={respostas[campo.id] || ''} 
                        onChange={e => handleChange(campo.id, Number(e.target.value))} 
                        placeholder="Apenas números" 
                      />
                    )}
                    
                    {campo.tipo === 'select' && (
                      <Select value={respostas[campo.id] || ''} onValueChange={v => handleChange(campo.id, v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione uma opção..." /></SelectTrigger>
                        <SelectContent>
                          {campo.opcoes?.split(',').map((opt: string) => (
                            <SelectItem key={opt.trim()} value={opt.trim()}>{opt.trim()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {campo.tipo === 'radio' && (
                      <div className="flex flex-col gap-2 mt-2">
                        {campo.opcoes?.split(',').map((opt: string) => (
                          <label key={opt.trim()} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name={campo.id}
                              value={opt.trim()}
                              checked={respostas[campo.id] === opt.trim()}
                              onChange={e => handleChange(campo.id, e.target.value)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                            />
                            <span className="text-sm text-slate-700">{opt.trim()}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              size="lg" 
              disabled={submitting} 
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg w-full sm:w-auto h-12 px-8 text-lg font-bold"
            >
              {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
              {submitting ? 'Enviando...' : 'Finalizar Diagnóstico'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
