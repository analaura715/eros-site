import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";

export function OrcamentoConfig() {
  const [loading, setLoading] = useState(true);
  const [configId, setConfigId] = useState<string | null>(null);
  
  // States
  const [baseCalculo, setBaseCalculo] = useState(0);
  const [setupPadrao, setSetupPadrao] = useState(0);
  
  // Fields (Form Builder)
  const [campos, setCampos] = useState<any[]>([]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.from('configuracoes_orcamento').select('*').limit(1).maybeSingle();
      if (error) throw error;
      
      if (data) {
        setConfigId(data.id);
        setBaseCalculo(data.base_calculo || 0);
        setSetupPadrao(data.setup_padrao || 0);
        setCampos(data.formulario_builder || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar configurações. O script SQL foi executado?");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        base_calculo: baseCalculo,
        setup_padrao: setupPadrao,
        formulario_builder: campos,
      };

      if (configId) {
        await supabase.from('configuracoes_orcamento').update(payload).eq('id', configId);
      } else {
        const { data } = await supabase.from('configuracoes_orcamento').insert([payload]).select().single();
        if (data) setConfigId(data.id);
      }
      toast.success("Configurações salvas com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar.");
    }
  };

  const addCampo = () => {
    setCampos([...campos, {
      id: crypto.randomUUID(),
      pergunta: '',
      tipo: 'text', // text, number, select, radio
      opcoes: '', // comma separated if select/radio
      regra_tipo: 'nenhuma', // nenhuma, soma_fixa, multiplicador
      regra_valor: 0
    }]);
  };

  const removeCampo = (id: string) => {
    setCampos(campos.filter(c => c.id !== id));
  };

  const updateCampo = (id: string, field: string, value: any) => {
    setCampos(campos.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Valores Base</CardTitle>
          <CardDescription>Valores iniciais aplicados a todos os orçamentos.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="space-y-2 flex-1">
            <Label>Valor Base (Mensalidade) R$</Label>
            <Input type="number" value={baseCalculo} onChange={e => setBaseCalculo(Number(e.target.value))} />
          </div>
          <div className="space-y-2 flex-1">
            <Label>Valor Base (Setup/Implantação) R$</Label>
            <Input type="number" value={setupPadrao} onChange={e => setSetupPadrao(Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Construtor do Questionário</CardTitle>
            <CardDescription>Crie as perguntas que aparecerão para o lead e defina o impacto no preço.</CardDescription>
          </div>
          <Button onClick={addCampo} variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Adicionar Pergunta</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {campos.length === 0 && (
            <div className="text-center text-muted-foreground py-8 border border-dashed rounded-md">
              Nenhuma pergunta configurada.
            </div>
          )}
          
          {campos.map((campo, index) => (
            <div key={campo.id} className="p-4 border rounded-md bg-slate-50 flex gap-4 items-start">
              <div className="pt-2 text-slate-400 cursor-move">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Pergunta / Label</Label>
                    <Input value={campo.pergunta} onChange={e => updateCampo(campo.id, 'pergunta', e.target.value)} placeholder="Ex: Qual o seu faturamento?" />
                  </div>
                  <div className="space-y-1">
                    <Label>Tipo de Campo</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={campo.tipo} 
                      onChange={e => updateCampo(campo.id, 'tipo', e.target.value)}
                    >
                      <option value="text">Texto Livre</option>
                      <option value="number">Número</option>
                      <option value="select">Lista (Select)</option>
                      <option value="radio">Múltipla Escolha (Radio)</option>
                    </select>
                  </div>
                </div>

                {(campo.tipo === 'select' || campo.tipo === 'radio') && (
                  <div className="space-y-1">
                    <Label>Opções (separadas por vírgula)</Label>
                    <Input value={campo.opcoes} onChange={e => updateCampo(campo.id, 'opcoes', e.target.value)} placeholder="Ex: Sim, Não, Talvez" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div className="space-y-1">
                    <Label>Regra de Precificação</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={campo.regra_tipo} 
                      onChange={e => updateCampo(campo.id, 'regra_tipo', e.target.value)}
                    >
                      <option value="nenhuma">Não afeta o preço</option>
                      <option value="soma_fixa">Soma Fixa (Soma X se respondido)</option>
                      <option value="multiplicador">Multiplicador (Multiplica valor pela resposta numérica)</option>
                      <option value="condicional_valor">Soma Condicional (Soma X se for 'Sim' ou opção Y)</option>
                    </select>
                  </div>
                  {campo.regra_tipo !== 'nenhuma' && (
                    <div className="grid grid-cols-2 gap-2">
                      {campo.regra_tipo === 'condicional_valor' && (
                        <div className="space-y-1">
                          <Label>Se resposta for igual a:</Label>
                          <Input value={campo.regra_condicao || ''} onChange={e => updateCampo(campo.id, 'regra_condicao', e.target.value)} placeholder="Ex: Sim" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label>Valor / Fator (R$)</Label>
                        <Input type="number" value={campo.regra_valor} onChange={e => updateCampo(campo.id, 'regra_valor', Number(e.target.value))} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Button variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => removeCampo(campo.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
          <Save className="w-4 h-4 mr-2" />
          Salvar Todas as Configurações
        </Button>
      </div>
    </div>
  );
}
