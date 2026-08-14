import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GripVertical, Save, AlignLeft, Table, FileText, Type, CheckSquare, Image as ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type BlockType = 'header' | 'text' | 'client_data' | 'modules_table' | 'investment_table' | 'steps' | 'benefits' | 'signatures';

export interface BlockItem {
  id: string;
  type: BlockType;
  content: string;
}

const AVAILABLE_BLOCKS: { type: BlockType; label: string; icon: any; defaultContent: string }[] = [
  { type: 'header', label: 'Cabeçalho (Logo e Data)', icon: ImageIcon, defaultContent: '' },
  { type: 'client_data', label: 'Dados do Cliente', icon: FileText, defaultContent: '' },
  { type: 'text', label: 'Bloco de Texto', icon: Type, defaultContent: 'Digite seu texto aqui. Você pode usar variáveis como {{nome_empresa}}, {{valor_total}}, {{valor_mensalidade}} e {{valor_implantacao}}.' },
  { type: 'modules_table', label: 'Lista de Módulos', icon: Table, defaultContent: '' },
  { type: 'investment_table', label: 'Tabela de Investimento', icon: Table, defaultContent: '' },
  { type: 'steps', label: 'Etapas de Implantação', icon: AlignLeft, defaultContent: '' },
  { type: 'benefits', label: 'Benefícios Adicionais', icon: CheckSquare, defaultContent: '' },
  { type: 'signatures', label: 'Área de Assinaturas', icon: FileText, defaultContent: '' },
];

export function BuilderProposta() {
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.from('configuracoes_orcamento').select('*').limit(1).maybeSingle();
      if (error) throw error;
      
      if (data) {
        setConfigId(data.id);
        if (data.formulario_builder && data.formulario_builder.template_proposta) {
          setBlocks(data.formulario_builder.template_proposta);
        } else {
          // Default initial blocks fallback
          const legacyTexts = data.formulario_builder?.textos_proposta || {};
          setBlocks([
            { id: 'h1', type: 'header', content: '' },
            { id: 'c1', type: 'client_data', content: '' },
            { id: 't1', type: 'text', content: legacyTexts.introducao || 'Agradecemos a oportunidade de apresentar nossa proposta comercial. Oferecemos uma plataforma completa de gestão...' },
            { id: 't2', type: 'text', content: legacyTexts.conhecimento_negocio || 'O setor exige controle rigoroso...' },
            { id: 'm1', type: 'modules_table', content: '' },
            { id: 'i1', type: 'investment_table', content: '' },
            { id: 't3', type: 'text', content: legacyTexts.sobre_implantacao || 'A Taxa de Implantação é um investimento único...' },
            { id: 's1', type: 'steps', content: '' },
            { id: 'b1', type: 'benefits', content: '' },
          ]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar o modelo da proposta.");
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setBlocks(items);
  };

  const addBlock = (type: BlockType) => {
    const blockDef = AVAILABLE_BLOCKS.find(b => b.type === type);
    if (!blockDef) return;
    
    const newBlock: BlockItem = {
      id: `block-${Date.now()}`,
      type,
      content: blockDef.defaultContent
    };
    
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const updateBlockContent = (id: string, newContent: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content: newContent } : b));
  };

  const handleSave = async () => {
    if (!configId) {
      toast.error("Configuração de orçamento não encontrada. Salve o Motor de Preços primeiro.");
      return;
    }
    
    try {
      const { data: currentData } = await supabase.from('configuracoes_orcamento').select('formulario_builder').eq('id', configId).single();
      const currentBuilder = currentData?.formulario_builder || {};
      
      const payload = {
        formulario_builder: {
          ...currentBuilder,
          template_proposta: blocks
        }
      };

      const { error } = await supabase.from('configuracoes_orcamento').update(payload).eq('id', configId);
      if (error) throw error;
      
      toast.success("Modelo da proposta salvo com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar o modelo da proposta.");
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  if (loading) return <div className="p-4">Carregando construtor...</div>;

  return (
    <div className="flex h-[700px] border rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="w-64 bg-slate-50 border-r flex flex-col">
        <div className="p-4 border-b bg-slate-100/50">
          <h3 className="font-semibold text-slate-700">Blocos Disponíveis</h3>
          <p className="text-xs text-slate-500 mt-1">Clique para adicionar ao final.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {AVAILABLE_BLOCKS.map(block => (
            <button
              key={block.type}
              onClick={() => addBlock(block.type)}
              className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-md hover:border-indigo-400 hover:shadow-sm transition-all text-left group"
            >
              <div className="p-1.5 bg-slate-100 text-slate-500 rounded group-hover:bg-indigo-50 group-hover:text-indigo-600">
                <block.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{block.label}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t bg-white">
          <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            <Save className="w-4 h-4 mr-2" /> Salvar Modelo
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-100">
        <div className="p-4 border-b bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-bold text-slate-800">Estrutura do Documento</h2>
            <p className="text-xs text-slate-500">Arraste para reordenar. Selecione um bloco para editá-lo.</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[800px] mx-auto bg-white min-h-full border shadow-sm p-8 rounded-sm">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="builder-canvas">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 min-h-[500px]">
                    {blocks.map((block, index) => {
                      const blockDef = AVAILABLE_BLOCKS.find(b => b.type === block.type);
                      return (
                        <Draggable key={block.id} draggableId={block.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={() => setSelectedBlockId(block.id)}
                              className={`flex items-stretch border rounded-md bg-white group cursor-pointer transition-all ${
                                snapshot.isDragging ? 'shadow-lg border-indigo-500' : 
                                selectedBlockId === block.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div {...provided.dragHandleProps} className="w-8 flex items-center justify-center bg-slate-50 border-r rounded-l-md text-slate-400 group-hover:text-slate-600">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <div className="flex-1 p-4">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{blockDef?.label}</span>
                                  {selectedBlockId === block.id && (
                                    <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="text-red-400 hover:text-red-600">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <div className="text-sm text-slate-700 line-clamp-2">
                                  {block.type === 'text' ? block.content || <span className="italic text-slate-400">Texto vazio</span> : <span className="italic text-slate-400">Bloco dinâmico gerado pelo sistema</span>}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    
                    {blocks.length === 0 && (
                      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500 mt-4">
                        Nenhum bloco adicionado. Comece clicando nos blocos da barra lateral.
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>

      {selectedBlock && (
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Propriedades</h3>
            <button onClick={() => setSelectedBlockId(null)} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="p-3 bg-slate-100 rounded text-sm text-slate-600">
              Editando: <strong>{AVAILABLE_BLOCKS.find(b => b.type === selectedBlock.type)?.label}</strong>
            </div>
            
            {selectedBlock.type === 'text' && (
              <div className="space-y-2 flex-1 flex flex-col h-full">
                <Label>Conteúdo do Texto</Label>
                <Textarea 
                  value={selectedBlock.content} 
                  onChange={(e) => updateBlockContent(selectedBlock.id, e.target.value)}
                  className="min-h-[250px] resize-y"
                />
                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-md text-xs text-indigo-800">
                  <strong>Variáveis Dinâmicas:</strong><br/>
                  - <code>{'{nome_empresa}'}</code><br/>
                  - <code>{'{cidade_uf}'}</code><br/>
                  - <code>{'{cnpj}'}</code><br/>
                  - <code>{'{valor_total}'}</code><br/>
                  - <code>{'{valor_mensalidade}'}</code><br/>
                  - <code>{'{valor_implantacao}'}</code><br/><br/>
                  Use asteriscos duplos para **negrito**.
                </div>
              </div>
            )}
            
            {selectedBlock.type !== 'text' && (
              <div className="p-4 border border-dashed rounded text-sm text-slate-500 text-center">
                Este bloco é dinâmico e será preenchido automaticamente com os dados do orçamento no momento da geração do PDF. Nenhuma configuração extra necessária.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
