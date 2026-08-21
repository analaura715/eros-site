import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSuporte, SuporteConfiguracoes, ConfigItem } from "@/hooks/useSuporte";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Settings, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_suporte/ajustes")({
  component: SuporteConfiguracoesPage,
});

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", 
  "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", 
  "#d946ef", "#ec4899", "#f43f5e", "#64748b", "#09090b"
];

function SuporteConfiguracoesPage() {
  const { fetchConfiguracoes, updateConfiguracoes } = useSuporte();
  const [config, setConfig] = useState<SuporteConfiguracoes | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<keyof SuporteConfiguracoes | null>(null);
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
  const [formData, setFormData] = useState({ nome: "", cor: PRESET_COLORS[0] });

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
      toast.success("Configurações atualizadas!");
    } catch (e) {
      toast.error("Erro ao atualizar configurações.");
    }
  };

  const openDialog = (field: keyof SuporteConfiguracoes, item?: ConfigItem) => {
    setEditingField(field);
    if (item) {
      setEditingItem(item);
      setFormData({ nome: item.nome, cor: item.cor });
    } else {
      setEditingItem(null);
      setFormData({ nome: "", cor: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] });
    }
    setDialogOpen(true);
  };

  const submitDialog = () => {
    if (!editingField || !config) return;
    if (!formData.nome.trim()) {
      toast.warning("O nome não pode ficar vazio.");
      return;
    }

    const currentArray = config[editingField] as ConfigItem[];
    let newArray;

    if (editingItem) {
      // Edit existing
      newArray = currentArray.map(item => 
        item.id === editingItem.id ? { ...item, nome: formData.nome.trim(), cor: formData.cor } : item
      );
    } else {
      // Add new
      if (currentArray.some(i => i.nome.toLowerCase() === formData.nome.trim().toLowerCase())) {
        toast.warning("Este item já existe.");
        return;
      }
      newArray = [...currentArray, { id: crypto.randomUUID(), nome: formData.nome.trim(), cor: formData.cor }];
    }

    handleSave({ [editingField]: newArray });
    setDialogOpen(false);
  };

  const removeItem = (field: keyof SuporteConfiguracoes, id: string) => {
    if (!config || !confirm("Tem certeza que deseja excluir este item?")) return;
    const newArray = (config[field] as ConfigItem[]).filter(x => x.id !== id);
    handleSave({ [field]: newArray });
  };

  if (loading || !config) return <div className="p-8 text-center">Carregando configurações...</div>;

  const renderTable = (field: keyof SuporteConfiguracoes, title: string, desc: string) => {
    const items = config[field] as ConfigItem[];
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-4">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{desc}</CardDescription>
          </div>
          <Button onClick={() => openDialog(field)} size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Novo
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg bg-muted/20">
              Nenhum item cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ borderColor: item.cor, color: item.cor, backgroundColor: `${item.cor}10` }}>
                        {item.nome}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(field, item)}>
                        <Edit className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(field, item.id)}>
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
    );
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto py-6">
      <div className="flex items-center gap-2 mb-6 px-2">
        <Settings className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ajustes do Suporte</h1>
          <p className="text-sm text-muted-foreground">Esta página foi descontinuada.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Migradas</CardTitle>
          <CardDescription>
            Os cadastros de Setores, Tipos de Ticket e Módulos foram movidos para o novo menu lateral <strong>Cadastros</strong>.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
