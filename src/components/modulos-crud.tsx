import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function ModulosCrud() {
  const [modulos, setModulos] = useState<any[]>([]);
  const [isModuloDialogOpen, setIsModuloDialogOpen] = useState(false);
  const [editingModulo, setEditingModulo] = useState<any>(null);
  const [moduloForm, setModuloForm] = useState({
    nome: '',
    categoria: 'Operacional',
    descricao: '',
    preco_setup: 0,
    preco_mensalidade: 0,
    ativo: true
  });

  const fetchModulos = async () => {
    const { data } = await supabase.from('catalogo_modulos').select('*').order('categoria').order('nome');
    if (data) setModulos(data);
  };

  useEffect(() => {
    fetchModulos();
  }, []);

  const handleSaveModulo = async () => {
    try {
      if (editingModulo) {
        const { error } = await supabase.from('catalogo_modulos').update(moduloForm).eq('id', editingModulo.id);
        if (error) throw error;
        toast.success("Módulo atualizado!");
      } else {
        const { error } = await supabase.from('catalogo_modulos').insert([moduloForm]);
        if (error) throw error;
        toast.success("Módulo criado!");
      }
      setIsModuloDialogOpen(false);
      setEditingModulo(null);
      fetchModulos();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar módulo.");
    }
  };

  const handleDeleteModulo = async (id: string) => {
    if(confirm("Tem certeza que deseja excluir este módulo?")) {
      const { error } = await supabase.from('catalogo_modulos').delete().eq('id', id);
      if (error) toast.error("Erro ao excluir.");
      else {
        toast.success("Módulo excluído.");
        setModulos(modulos.filter(m => m.id !== id));
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Catálogo de Módulos</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os módulos e seus respectivos valores.</p>
        </div>
        <Button onClick={() => {
          setEditingModulo(null);
          setModuloForm({ nome: '', categoria: 'Operacional', descricao: '', preco_setup: 0, preco_mensalidade: 0, ativo: true });
          setIsModuloDialogOpen(true);
        }}>
          Novo Módulo
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden bg-white dark:bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Módulo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Setup (R$)</TableHead>
              <TableHead className="text-right">Mensalidade (R$)</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modulos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum módulo cadastrado.</TableCell>
              </TableRow>
            ) : modulos.map(mod => (
              <TableRow key={mod.id}>
                <TableCell className="font-medium">{mod.nome}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-muted rounded-full text-xs font-semibold">{mod.categoria}</span>
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mod.preco_setup)}
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mod.preco_mensalidade)}
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditingModulo(mod);
                    setModuloForm({
                      nome: mod.nome,
                      categoria: mod.categoria,
                      descricao: mod.descricao || '',
                      preco_setup: mod.preco_setup,
                      preco_mensalidade: mod.preco_mensalidade,
                      ativo: mod.ativo
                    });
                    setIsModuloDialogOpen(true);
                  }}>Editar</Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteModulo(mod.id)}>Excluir</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModuloDialogOpen} onOpenChange={setIsModuloDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModulo ? 'Editar Módulo' : 'Novo Módulo'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Módulo</Label>
              <Input value={moduloForm.nome} onChange={e => setModuloForm({...moduloForm, nome: e.target.value})} placeholder="Ex: Entrada de Frutas" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select 
                value={moduloForm.categoria} 
                onChange={e => setModuloForm({...moduloForm, categoria: e.target.value})}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Operacional">Operacional & Agrícola</option>
                <option value="Financeiro">Financeiro & Gestão</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço de Setup (R$)</Label>
                <Input type="number" value={moduloForm.preco_setup} onChange={e => setModuloForm({...moduloForm, preco_setup: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Preço Mensalidade (R$)</Label>
                <Input type="number" value={moduloForm.preco_mensalidade} onChange={e => setModuloForm({...moduloForm, preco_mensalidade: Number(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição (Opcional)</Label>
              <Input value={moduloForm.descricao} onChange={e => setModuloForm({...moduloForm, descricao: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModuloDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveModulo}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
