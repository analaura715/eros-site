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
import { Loader2, Send, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute('/questionario/$id')({
  component: QuestionarioPublicoPage,
});

function QuestionarioPublicoPage() {
  const { id } = Route.useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const isViewMode = searchParams.get('view') === 'true';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [diag, setDiag] = useState<any>(null);
  const [camposDinamicos, setCamposDinamicos] = useState<any[]>([]);
  const [catalogoModulos, setCatalogoModulos] = useState<any[]>([]);
  
  // Respostas (Standard + Dinâmicas)
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [diagRes, configRes, modulosRes] = await Promise.all([
          supabase.from('diagnosticos').select('*').eq('id', id).maybeSingle(),
          supabase.from('configuracoes_orcamento').select('*').limit(1).maybeSingle(),
          supabase.from('catalogo_modulos').select('*').eq('ativo', true).order('nome')
        ]);
        
        if (diagRes.error) throw diagRes.error;
        setDiag(diagRes.data);
        
        if (configRes.data && configRes.data.formulario_builder) {
          setCamposDinamicos(configRes.data.formulario_builder);
        }
        if (modulosRes.data) {
          setCatalogoModulos(modulosRes.data);
        }
        
        // Inicializar form
        let initialRespostas: any = {
          razao_social: diagRes.data?.razao_social || '',
          cnpj: diagRes.data?.cnpj || '',
          cidade_uf: diagRes.data?.cidade_uf || '',
          telefone_whatsapp: diagRes.data?.telefone_whatsapp || '',
          qtd_cnpj: diagRes.data?.qtd_cnpj || 1,
          volume_mensal_notas: diagRes.data?.volume_mensal_notas || 0,
          venda_interna_externa: diagRes.data?.venda_interna_externa || '',
          tipo_mercado: diagRes.data?.tipo_mercado || '',
          qtd_usuarios_previstos: diagRes.data?.qtd_usuarios_previstos || '',
          precisa_importar_dados: diagRes.data?.precisa_importar_dados || 'Não',
          modulos_selecionados: diagRes.data?.modulos_selecionados || []
        };
        
        // Load dynamic responses if they exist
        if (diagRes.data?.respostas_dinamicas) {
           initialRespostas = { ...initialRespostas, ...diagRes.data.respostas_dinamicas };
        }
        
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
      const { 
        razao_social, cnpj, cidade_uf, telefone_whatsapp, 
        qtd_cnpj, volume_mensal_notas, venda_interna_externa,
        tipo_mercado, qtd_usuarios_previstos, precisa_importar_dados,
        modulos_selecionados,
        ...respostasDinamicas 
      } = respostas;
      
      const payload = {
        razao_social,
        cnpj,
        cidade_uf,
        telefone_whatsapp,
        qtd_cnpj: Number(qtd_cnpj),
        volume_mensal_notas: Number(volume_mensal_notas),
        venda_interna_externa,
        tipo_mercado,
        qtd_usuarios_previstos,
        precisa_importar_dados,
        modulos_selecionados: modulos_selecionados || [],
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

  if (diag.status === 'respondido' && !isViewMode) {
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

  const hasExportMarket = ['Exportação', 'Ambos'].includes(respostas.tipo_mercado);
  const etiquetasModuloId = catalogoModulos.find(m => m.nome.includes('ETIQUETAS/EMBALADEIRAS'))?.id;
  const hasEtiquetasModulo = etiquetasModuloId && (respostas.modulos_selecionados || []).includes(etiquetasModuloId);
  const showEmbaladeiraQuestions = hasExportMarket && hasEtiquetasModulo;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex justify-center mb-10">
          <img src="/logo.png" alt="Eros Sistemas" className="w-auto h-24 object-contain" />
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
                 <Input value={respostas.razao_social || ''} onChange={e => handleChange('razao_social', e.target.value)} required disabled={isViewMode} />
               </div>
               <div className="space-y-2">
                 <Label>CNPJ</Label>
                 <Input value={respostas.cnpj || ''} onChange={e => handleChange('cnpj', e.target.value)} required disabled={isViewMode} />
               </div>
               <div className="space-y-2">
                 <Label>Cidade / UF</Label>
                 <Input value={respostas.cidade_uf || ''} onChange={e => handleChange('cidade_uf', e.target.value)} required disabled={isViewMode} />
               </div>
               <div className="space-y-2">
                 <Label>Telefone / WhatsApp</Label>
                 <Input value={respostas.telefone_whatsapp || ''} onChange={e => handleChange('telefone_whatsapp', e.target.value)} required disabled={isViewMode} />
               </div>
             </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200/60 overflow-hidden">
             <div className="bg-indigo-600 px-6 py-4">
               <h2 className="text-lg font-bold text-white">Volumetria Operacional</h2>
             </div>
             <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <Label>Regime Tributário</Label>
                 <Select value={respostas.regime_tributario || ''} onValueChange={v => handleChange('regime_tributario', v)} disabled={isViewMode}>
                   <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                     <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                     <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Quantidade de Filiais/CNPJs</Label>
                 <Input type="number" value={respostas.qtd_cnpj || ''} onChange={e => handleChange('qtd_cnpj', e.target.value)} disabled={isViewMode} />
               </div>
               <div className="space-y-2">
                 <Label>Volume Mensal de Notas Fiscais</Label>
                 <Input type="number" value={respostas.volume_mensal_notas || ''} onChange={e => handleChange('volume_mensal_notas', e.target.value)} disabled={isViewMode} />
               </div>
               <div className="space-y-2">
                 <Label>Perfil de Venda</Label>
                 <Select value={respostas.venda_interna_externa || ''} onValueChange={v => handleChange('venda_interna_externa', v)} disabled={isViewMode}>
                   <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Apenas Interna">Apenas Interna (Dentro do estado)</SelectItem>
                     <SelectItem value="Apenas Externa">Apenas Externa (Fora do estado)</SelectItem>
                     <SelectItem value="Ambas">Ambas (Interna e Externa)</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Mercado de Atuação</Label>
                 <Select value={respostas.tipo_mercado || ''} onValueChange={v => handleChange('tipo_mercado', v)} disabled={isViewMode}>
                   <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Mercado Interno">Mercado Interno</SelectItem>
                     <SelectItem value="Exportação">Exportação</SelectItem>
                     <SelectItem value="Ambos">Ambos</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Usuários Adicionais (Além dos gestores)</Label>
                 <Input type="number" value={respostas.qtd_usuarios_previstos || ''} onChange={e => handleChange('qtd_usuarios_previstos', e.target.value)} disabled={isViewMode} />
               </div>
               <div className="space-y-2">
                 <Label>Precisa Importar Dados de Outro Sistema ou Planilha?</Label>
                 <Select value={respostas.precisa_importar_dados || 'Não'} onValueChange={v => handleChange('precisa_importar_dados', v)} disabled={isViewMode}>
                   <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Sim">Sim, precisa importar</SelectItem>
                     <SelectItem value="Não">Não, base limpa</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </CardContent>
          </Card>

          {catalogoModulos.length > 0 && (
            <Card className="shadow-md border-slate-200/60 overflow-hidden">
              <div className="bg-indigo-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white">Módulos de Interesse</h2>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {catalogoModulos.map(modulo => {
                    const isChecked = (respostas.modulos_selecionados || []).includes(modulo.id);
                    return (
                      <div key={modulo.id} className="flex items-start space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors">
                        <Checkbox 
                          id={`mod-${modulo.id}`} 
                          checked={isChecked}
                          disabled={isViewMode}
                          onCheckedChange={(checked) => {
                            if (isViewMode) return;
                            const atuais = respostas.modulos_selecionados || [];
                            const novos = checked 
                              ? [...atuais, modulo.id]
                              : atuais.filter((id: string) => id !== modulo.id);
                            handleChange('modulos_selecionados', novos);
                          }}
                        />
                        <div className="space-y-1 leading-none">
                          <label htmlFor={`mod-${modulo.id}`} className="text-sm font-semibold text-slate-800 cursor-pointer">
                            {modulo.nome}
                          </label>
                          <p className="text-xs text-slate-500">{modulo.descricao}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {showEmbaladeiraQuestions && (
            <Card className="shadow-md border-amber-200/60 overflow-hidden">
              <div className="bg-amber-500 px-6 py-4">
                <h2 className="text-lg font-bold text-white">Informações Específicas de Exportação</h2>
              </div>
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-amber-50/30">
                <div className="space-y-2">
                  <Label>Quantidade de Embaladeiras</Label>
                  <Input 
                    type="number" 
                    value={respostas.qtd_embaladeiras || ''} 
                    onChange={e => handleChange('qtd_embaladeiras', e.target.value)} 
                    disabled={isViewMode} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade de Containers por Semana</Label>
                  <Input 
                    type="number" 
                    value={respostas.qtd_containers_semanal || ''} 
                    onChange={e => handleChange('qtd_containers_semanal', e.target.value)} 
                    disabled={isViewMode} 
                    required 
                  />
                </div>
              </CardContent>
            </Card>
          )}

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
                        disabled={isViewMode}
                      />
                    )}
                    
                    {campo.tipo === 'number' && (
                      <Input 
                        type="number"
                        value={respostas[campo.id] || ''} 
                        onChange={e => handleChange(campo.id, Number(e.target.value))} 
                        placeholder="Apenas números"
                        disabled={isViewMode}
                      />
                    )}
                    
                    {campo.tipo === 'select' && (
                      <Select value={respostas[campo.id] || ''} onValueChange={v => handleChange(campo.id, v)} disabled={isViewMode}>
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
                              disabled={isViewMode}
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

          {!isViewMode && (
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
          )}
        </form>
      </div>
    </div>
  );
}
