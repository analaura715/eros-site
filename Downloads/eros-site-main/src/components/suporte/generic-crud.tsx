import { useState, useEffect } from "react";
import { useSuporte, SuporteConfiguracoes, ConfigItem } from "@/hooks/useSuporte";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Save, X, Eye } from "lucide-react";
import * as Icons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DynamicIcon = ({ name }: { name: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return null;
  return <IconComponent className="w-4 h-4 mr-1 inline" />;
};

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", 
  "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", 
  "#d946ef", "#ec4899", "#f43f5e", "#64748b", "#09090b"
];

interface GenericCrudProps {
  title: string;
  description: string;
  field: keyof SuporteConfiguracoes;
}

export function GenericCrud({ title, description, field }: GenericCrudProps) {
  const { fetchConfiguracoes, updateConfiguracoes } = useSuporte();
  const [config, setConfig] = useState<SuporteConfiguracoes | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
  const [formData, setFormData] = useState({ nome: "", cor: PRESET_COLORS[0], cor_texto: "#ffffff", icone: "" });

  const loadConfig = async () => {
    setLoading(true);
    const data = await fetchConfiguracoes();
    if (data) setConfig(data);
    setLoading(false);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (updatedConfig: Partial<SuporteConfiguracoes>) => {
    try {
      await updateConfiguracoes(updatedConfig);
      setConfig(prev => prev ? { ...prev, ...updatedConfig } : null);
      toast.success("Atualizado com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar alterações.");
    }
  };

  const openNew = () => {
    setEditingItem(null);
    setFormData({ nome: "", cor: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)], cor_texto: "#ffffff", icone: "" });
    setIsFormOpen(true);
  };

  const openEdit = (item: ConfigItem) => {
    setEditingItem(item);
    setFormData({ nome: item.nome, cor: item.cor, cor_texto: item.cor_texto || "#ffffff", icone: item.icone || "" });
    setIsFormOpen(true);
  };
  
  const openView = (item: ConfigItem) => {
    toast.info(`Visualizando ${item.nome} (${item.cor})`);
  };

  const submitForm = () => {
    if (!config) return;
    if (!formData.nome.trim()) {
      toast.warning("O nome não pode ficar vazio.");
      return;
    }

    const currentArray = (config[field] || []) as ConfigItem[];
    let newArray;

    if (editingItem) {
      newArray = currentArray.map(item => 
        item.id === editingItem.id ? { ...item, nome: formData.nome.trim(), cor: formData.cor, cor_texto: formData.cor_texto, icone: formData.icone } : item
      );
    } else {
      if (currentArray.some(i => i.nome.toLowerCase() === formData.nome.trim().toLowerCase())) {
        toast.warning("Este item já existe.");
        return;
      }
      newArray = [...currentArray, { id: crypto.randomUUID(), nome: formData.nome.trim(), cor: formData.cor, cor_texto: formData.cor_texto, icone: formData.icone }];
    }

    handleSave({ [field]: newArray });
    setIsFormOpen(false);
  };

  const removeItem = (id: string) => {
    if (!config || !confirm("Tem certeza que deseja excluir este registro?")) return;
    const newArray = ((config[field] || []) as ConfigItem[]).filter(x => x.id !== id);
    handleSave({ [field]: newArray });
  };

  if (loading || !config) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>;

  const items = (config[field] || []) as ConfigItem[];

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto py-6">
      <div className="flex items-center gap-2 mb-6 px-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {isFormOpen ? (
        <Card className="mb-6 border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle>{editingItem ? 'Editar Cadastro' : 'Novo Cadastro'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome / Título</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Suporte N1, Bug Crítico..."
                  className="max-w-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icone">Ícone (Opcional - Ex: LayoutDashboard, Users...)</Label>
                <Input
                  id="icone"
                  value={formData.icone}
                  onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                  placeholder="Nome do ícone (Lucide)"
                  className="max-w-md"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor de Identificação (Fundo)</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md max-w-xl">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, cor: color })}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all cursor-pointer",
                        formData.cor === color ? 'border-primary scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                      type="button"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor da Fonte (Texto)</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="color" 
                    value={formData.cor_texto}
                    onChange={(e) => setFormData({ ...formData, cor_texto: e.target.value })}
                    className="w-16 h-10 p-1 cursor-pointer" 
                  />
                  <div className="p-2 px-4 rounded-md border font-medium text-sm flex items-center gap-2" style={{ backgroundColor: formData.cor, color: formData.cor_texto }}>
                    {formData.icone ? <DynamicIcon name={formData.icone} /> : null}
                    Preview
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-4">
                <Button onClick={submitForm} className="gap-1">
                  <Save className="w-4 h-4" /> Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsFormOpen(false)} className="gap-1">
                  <X className="w-4 h-4" /> Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-end mb-4 px-2">
          <Button onClick={openNew} className="gap-1">
            <Plus className="w-4 h-4" /> Novo
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground border-b border-dashed">
              Nenhum registro encontrado. Clique em "Novo" para adicionar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Identificação Visual</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ borderColor: item.cor, color: item.cor_texto || item.cor, backgroundColor: `${item.cor}10` }}>
                        {item.icone ? <DynamicIcon name={item.icone} /> : null}
                        {item.nome}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openView(item)} title="Visualizar">
                        <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Editar">
                        <Edit className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} title="Excluir">
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
