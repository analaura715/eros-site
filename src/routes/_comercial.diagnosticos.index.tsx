import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Filter, Copy, FileText, CheckCircle2, Clock, Link as LinkIcon, ExternalLink, Calculator, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ModulosCrud } from "@/components/modulos-crud";

export const Route = createFileRoute('/_comercial/diagnosticos/')({
  component: DiagnosticosPage,
});

function DiagnosticosPage() {
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newLeadId, setNewLeadId] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  
  // Modulos Dialog state
  const [isModulosCrudOpen, setIsModulosCrudOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    // Fetch diagnosticos
    const { data: dData, error: dError } = await supabase
      .from('diagnosticos')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (dData) setDiagnosticos(dData);
    
    // Fetch leads
    const { data: lData } = await supabase
      .from('leads')
      .select('*')
      .order('nome', { ascending: true });
      
    if (lData) setLeads(lData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateLink = async () => {
    const targetLeadId = newLeadId || selectedLeadId;
    if (!targetLeadId) {
      toast.error("Por favor, selecione um Lead.");
      return;
    }
    
    setIsGenerating(true);
    const lead = leads.find(l => l.id === targetLeadId);
    
    try {
      const { data, error } = await supabase.from('diagnosticos').insert({
        lead_id: lead.id,
        razao_social: lead.nome || lead.empresa || 'Empresa não informada',
        cnpj: lead.cnpj || '',
        cidade_uf: lead.cidade || '',
        telefone_whatsapp: lead.telefone || lead.whatsapp || '',
        status: 'pendente'
      }).select().single();
      
      if (error) throw error;
      
      const link = `${window.location.origin}/questionario/${data.id}`;
      setGeneratedLink(link);
      toast.success("Diagnóstico gerado com sucesso!");
      
      // Refresh list
      setDiagnosticos([data, ...diagnosticos]);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar diagnóstico. Verifique se a tabela foi criada no Supabase.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (id?: string) => {
    const link = id ? `${window.location.origin}/questionario/${id}` : generatedLink;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const filtered = diagnosticos.filter(d => 
    d.razao_social?.toLowerCase().includes(search.toLowerCase()) || 
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este diagnóstico? Esta ação não pode ser desfeita.")) {
      const { error } = await supabase.from('diagnosticos').delete().eq('id', id);
      if (error) {
        toast.error("Erro ao excluir diagnóstico.");
      } else {
        toast.success("Diagnóstico excluído com sucesso.");
        setDiagnosticos(diagnosticos.filter(d => d.id !== id));
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Diagnósticos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie questionários enviados para leads e clientes.</p>
        </div>
        <div className="flex items-center gap-3">
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calculator className="w-4 h-4" /> Orçamento Avulso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Novo Orçamento Avulso</DialogTitle>
                <DialogDescription>
                  Gere um documento de proposta vazio para um cliente que não respondeu ao diagnóstico.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa (Para o cabeçalho)</Label>
                  <Input id="avulso-nome" placeholder="Ex: Fruticultura João..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Implantação (R$)</Label>
                    <Input id="avulso-setup" type="number" placeholder="Ex: 1500" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensalidade (R$)</Label>
                    <Input id="avulso-mensal" type="number" placeholder="Ex: 850" defaultValue="0" />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                    onClick={() => {
                      const nome = (document.getElementById('avulso-nome') as HTMLInputElement).value;
                      const setup = (document.getElementById('avulso-setup') as HTMLInputElement).value;
                      const mensalidade = (document.getElementById('avulso-mensal') as HTMLInputElement).value;
                      window.location.href = `/proposta/avulso?isManual=true&nome=${encodeURIComponent(nome || 'Empresa (Orçamento Avulso)')}&setup=${setup}&mensalidade=${mensalidade}`;
                    }}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Montar Documento A4
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isModulosCrudOpen} onOpenChange={setIsModulosCrudOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calculator className="w-4 h-4" /> Gerenciar Módulos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
              <ModulosCrud />
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if(!open) setGeneratedLink(""); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> Novo Diagnóstico
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Gerar Novo Diagnóstico</DialogTitle>
                <DialogDescription>
                  Selecione um Lead para preencher os dados institucionais iniciais e gerar um link exclusivo.
                </DialogDescription>
              </DialogHeader>
              
              {!generatedLink ? (
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Selecione o Lead</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="w-full justify-between font-normal text-left px-3"
                        >
                          {newLeadId
                            ? leads.find((lead) => lead.id === newLeadId)?.nome || leads.find((lead) => lead.id === newLeadId)?.empresa
                            : "Busque e selecione um lead..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full sm:w-[460px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Pesquisar empresa..." />
                          <CommandList>
                            <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>
                            <CommandGroup>
                              {leads.map((lead) => (
                                <CommandItem
                                  key={lead.id}
                                  value={lead.nome || lead.empresa}
                                  onSelect={() => {
                                    setNewLeadId(lead.id);
                                    setOpenCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newLeadId === lead.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {lead.nome || lead.empresa}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleGenerateLink} disabled={isGenerating || !newLeadId}>
                      {isGenerating ? "Gerando..." : "Gerar Link do Questionário"}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="py-4 space-y-6">
                  <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm flex gap-3 items-start border border-green-200">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Link Gerado com Sucesso!</p>
                      <p className="mt-1 opacity-90">Envie o link abaixo para o cliente preencher o questionário.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Link do Diagnóstico</Label>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={generatedLink} className="bg-muted font-mono text-xs" />
                      <Button size="icon" onClick={() => copyToClipboard()} title="Copiar Link">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="outline" asChild title="Abrir Link">
                        <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button onClick={() => { setIsDialogOpen(false); setGeneratedLink(""); setSelectedLeadId(""); }}>
                      Concluir
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="px-6 pb-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por Empresa ou ID..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0" title="Filtros">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead>Empresa (Lead)</TableHead>
                <TableHead>CNPJ / Local</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Carregando diagnósticos...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <FileText className="mx-auto h-8 w-8 opacity-20 mb-2" />
                    Nenhum diagnóstico encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((diag) => (
                  <TableRow key={diag.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="align-top py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {new Date(diag.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(diag.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    
                    <TableCell className="align-top py-4">
                      <div className="font-semibold text-base">{diag.razao_social}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">ID: {diag.id.split('-')[0]}...</div>
                    </TableCell>
                    
                    <TableCell className="align-top py-4">
                      <div className="text-sm">{diag.cnpj || '-'}</div>
                      <div className="text-xs text-muted-foreground">{diag.cidade_uf || '-'}</div>
                    </TableCell>
                    
                    <TableCell className="align-top py-4">
                      {diag.status === 'pendente' ? (
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 gap-1">
                          <Clock className="w-3 h-3" /> Pendente
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Respondido
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right align-top py-4">
                      <div className="flex justify-end gap-2">
                        {diag.status === 'respondido' ? (
                          <Link to="/diagnosticos/$id" params={{ id: diag.id }}>
                            <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                              <Calculator className="h-4 w-4 mr-2" />
                              Ver Orçamento
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(diag.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Link
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`${window.location.origin}/questionario/${diag.id}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 px-2"
                          onClick={() => handleDelete(diag.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
