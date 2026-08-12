import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Filter, Copy, FileText, CheckCircle2, Clock, ExternalLink, Calculator, Trash2, ChevronsUpDown, Check, Settings, LayoutDashboard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ModulosCrud } from "@/components/modulos-crud";
import { OrcamentoConfig } from "@/components/orcamento-config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute('/_comercial/diagnosticos/')({
  component: DiagnosticosPage,
});

function DiagnosticosPage() {
  const navigate = useNavigate();
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
  const [validadeLink, setValidadeLink] = useState("48h");
  
  const fetchData = async () => {
    setLoading(true);
    const { data: dData } = await supabase.from('diagnosticos').select('*').order('created_at', { ascending: false });
    if (dData) setDiagnosticos(dData);
    
    const { data: lData } = await supabase.from('leads').select('*');
    const { data: eData } = await supabase.from('empresas').select('*');
    
    const combined = [
      ...(lData || []).map(l => ({ ...l, isEmpresa: false, displayName: l.nome || l.empresa })),
      ...(eData || []).map(e => ({ ...e, isEmpresa: true, displayName: e.nome_fantasia || e.nome }))
    ].sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    
    setLeads(combined);
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
    
    // Calcula a data de expiração
    let expira_em = null;
    if (validadeLink !== 'nunca') {
      const data = new Date();
      if (validadeLink === '24h') data.setHours(data.getHours() + 24);
      if (validadeLink === '48h') data.setHours(data.getHours() + 48);
      if (validadeLink === '7d') data.setDate(data.getDate() + 7);
      if (validadeLink === '15d') data.setDate(data.getDate() + 15);
      expira_em = data.toISOString();
    }
    
    try {
      const { data, error } = await supabase.from('diagnosticos').insert({
        lead_id: lead.isEmpresa ? null : lead.id,
        razao_social: lead.displayName || 'Empresa não informada',
        cnpj: lead.cnpj || '',
        cidade_uf: lead.cidade || lead.cidade_uf || '',
        telefone_whatsapp: lead.telefone || lead.whatsapp || '',
        status: 'pendente',
        expira_em: expira_em
      }).select().maybeSingle();
      
      if (error) throw error;
      
      const link = `${window.location.origin}/questionario/${data.id}`;
      setGeneratedLink(link);
      toast.success("Diagnóstico gerado com sucesso!");
      setDiagnosticos([data, ...diagnosticos]);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar diagnóstico.");
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
    if (confirm("Tem certeza que deseja excluir?")) {
      const { error } = await supabase.from('diagnosticos').delete().eq('id', id);
      if (!error) {
        toast.success("Excluído com sucesso.");
        setDiagnosticos(diagnosticos.filter(d => d.id !== id));
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Central de Orçamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie propostas, envie diagnósticos e configure as regras do motor de cálculo.</p>
        </div>
      </div>

      <div className="px-6 flex-1 overflow-y-auto">
        <Tabs defaultValue="diagnosticos" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-6">
            <TabsTrigger value="diagnosticos" className="gap-2"><FileText className="w-4 h-4"/> Diagnósticos (Leads)</TabsTrigger>
            <TabsTrigger value="avulso" className="gap-2"><Calculator className="w-4 h-4"/> Orçamento Avulso</TabsTrigger>
            <TabsTrigger value="config" className="gap-2"><Settings className="w-4 h-4"/> Motor de Precificação</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnosticos" className="space-y-4 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-1 max-w-sm relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar por Empresa..." className="pl-9 bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if(!open) setGeneratedLink(""); }}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" /> Novo Diagnóstico
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {/* Conteudo igual ao original */}
                  <DialogHeader>
                    <DialogTitle>Gerar Novo Diagnóstico</DialogTitle>
                    <DialogDescription>Vincule a um Lead para enviar o link.</DialogDescription>
                  </DialogHeader>
                  {!generatedLink ? (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Selecione o Lead / Empresa</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                              {newLeadId ? leads.find(l => l.id === newLeadId)?.displayName : "Busque um lead ou empresa..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Pesquisar..." />
                              <CommandList>
                                <CommandEmpty>Nenhum registro encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {leads.map(lead => (
                                    <CommandItem key={lead.id} value={lead.displayName} onSelect={() => { setNewLeadId(lead.id); setOpenCombobox(false); }}>
                                      <Check className={cn("mr-2 h-4 w-4", newLeadId === lead.id ? "opacity-100" : "opacity-0")} />
                                      {lead.displayName} {lead.isEmpresa && <Badge variant="outline" className="ml-2 text-[10px] py-0">Empresa</Badge>}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Tempo de Validade do Link</Label>
                        <Select value={validadeLink} onValueChange={setValidadeLink}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o prazo..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24h">24 Horas</SelectItem>
                            <SelectItem value="48h">48 Horas</SelectItem>
                            <SelectItem value="7d">7 Dias</SelectItem>
                            <SelectItem value="15d">15 Dias</SelectItem>
                            <SelectItem value="nunca">Sem Validade (Nunca expira)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button className="w-full mt-2" onClick={handleGenerateLink} disabled={!newLeadId || isGenerating}>
                        {isGenerating ? "Gerando..." : "Gerar Link"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="bg-green-50 p-4 rounded text-green-700 text-sm">Link Gerado com Sucesso!</div>
                      <div className="flex gap-2">
                        <Input readOnly value={generatedLink} className="bg-muted text-xs" />
                        <Button size="icon" onClick={() => copyToClipboard()}><Copy className="w-4 h-4" /></Button>
                      </div>
                      <Button className="w-full" onClick={() => setIsDialogOpen(false)}>Concluir</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Carregando...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhum diagnóstico.</TableCell></TableRow>
                  ) : filtered.map(diag => (
                    <TableRow key={diag.id}>
                      <TableCell className="py-3">
                        <div className="font-medium">{new Date(diag.created_at).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-semibold">{diag.razao_social}</div>
                        <div className="text-xs text-muted-foreground">{diag.cnpj || 'Sem CNPJ'}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        {diag.status === 'pendente' ? 
                          <Badge variant="secondary" className="bg-orange-50 text-orange-600"><Clock className="w-3 h-3 mr-1"/> Pendente</Badge> :
                          <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-0"><CheckCircle2 className="w-3 h-3 mr-1"/> Respondido</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-2">
                          {diag.status === 'respondido' ? (
                            <Link to="/diagnosticos/$id" params={{ id: diag.id }}>
                              <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">Abrir Orçamento</Button>
                            </Link>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/questionario/${diag.id}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" /> Visualizar
                                </a>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => copyToClipboard(diag.id)}><Copy className="w-4 h-4 mr-2"/> Copiar Link</Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(diag.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="avulso" className="h-full">
            <Card className="border-dashed border-2 bg-slate-50/50 p-12 text-center h-[500px] flex flex-col items-center justify-center">
              <Calculator className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">Simulador de Orçamento Avulso</h3>
              <p className="text-slate-500 mb-6 max-w-md">Faça orçamentos rápidos sem precisar vincular a um Lead ou enviar um questionário.</p>
              <Link to="/orcamento-avulso">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Simulador em Tela Cheia
                </Button>
              </Link>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="pb-10">
            <OrcamentoConfig />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
