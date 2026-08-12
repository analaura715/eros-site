import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Eye, Edit, Trash2, CalendarIcon, Building2, MapPin, Hash, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmpresaForm, EmpresaFormValues } from '@/components/forms/empresa-form';
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute('/_suporte/clientes/')({
  component: EmpresasComponent,
});

function EmpresasComponent() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Partial<EmpresaFormValues> | undefined>(undefined);

  const fetchEmpresas = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(error);
      toast.error('Erro ao buscar empresas no banco de dados.');
    } else {
      setEmpresas(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const filtered = empresas.filter(e => {
    const s = search.toLowerCase();
    return e.nome?.toLowerCase().includes(s) || 
           e.cidade?.toLowerCase().includes(s) || 
           (e.cnpj && e.cnpj.includes(s));
  });

  const handleOpenNovaEmpresa = () => {
    setEmpresaEditando(undefined);
    setIsSheetOpen(true);
  };

  const handleEditEmpresa = (empresa: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmpresaEditando({
      id: empresa.id,
      nome: empresa.nome,
      segmento: empresa.segmento,
      cidade: empresa.cidade.split(' - ')[0],
      uf: empresa.cidade.split(' - ')[1] || 'SP',
      dataInicioOperacao: empresa.data_inicio_operacao ? new Date(empresa.data_inicio_operacao) : undefined,
      cnpj: empresa.cnpj || '',
      nomeFantasia: empresa.nome_fantasia || empresa.nome,
      cep: empresa.cep || '',
      logradouro: empresa.logradouro || '',
      numero: empresa.numero || '',
      bairro: empresa.bairro || '',
      telefone: empresa.telefone || '',
      email: empresa.email || '',
      regimeTributario: empresa.regime_tributario || 'Sem Regime Tributário',
      observacoes: empresa.observacoes || ''
    });
    setIsSheetOpen(true);
  };

  const handleDeleteEmpresa = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir esta empresa?")) {
      const { error } = await supabase.from('empresas').delete().eq('id', id);
      if (error) {
        toast.error("Erro ao excluir.");
      } else {
        toast.success("Empresa excluída com sucesso.");
        fetchEmpresas();
      }
    }
  };

  const handleSubmitForm = async (data: EmpresaFormValues) => {
    const payload = {
      cnpj: data.cnpj,
      nome: data.nome,
      nome_fantasia: data.nomeFantasia,
      inscricao_estadual: data.inscricaoEstadual,
      data_inicio_operacao: data.dataInicioOperacao ? format(data.dataInicioOperacao, 'yyyy-MM-dd') : null,
      segmento: data.segmento,
      cep: data.cep,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade + ' - ' + data.uf,
      uf: data.uf,
      telefone: data.telefone,
      email: data.email,
      regime_tributario: data.regimeTributario,
      observacoes: data.observacoes
    };

    if (data.id) {
      const { error } = await supabase.from('empresas').update(payload).eq('id', data.id);
      if (error) {
        toast.error("Erro ao atualizar empresa.");
      } else {
        toast.success("Empresa atualizada com sucesso.");
        fetchEmpresas();
        setIsSheetOpen(false);
      }
    } else {
      const { error } = await supabase.from('empresas').insert([payload]);
      if (error) {
        toast.error("Erro ao cadastrar empresa.");
      } else {
        toast.success("Nova empresa cadastrada com sucesso.");
        fetchEmpresas();
        setIsSheetOpen(false);
      }
    }
  };

  const limparFiltros = () => {
    setSearch('');
  };

  const getSegmentIcon = (segmento: string) => {
    switch (segmento) {
      case 'Produtor': return <Factory className="h-3.5 w-3.5" />;
      case 'Indústria': return <Building2 className="h-3.5 w-3.5" />;
      default: return <Hash className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b px-6 py-8 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-sm">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie o portfólio de clientes do suporte e realize a manutenção de dados.</p>
          </div>
        </div>
        <Button 
          className="relative z-10 shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary hover:shadow-lg transition-all duration-300 h-10 px-5 rounded-full"
          onClick={handleOpenNovaEmpresa}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
        
        {/* Aviso */}
        <div className="bg-primary/10 border border-primary/20 text-primary text-sm px-4 py-3 rounded-xl flex items-center shadow-sm">
          <div className="h-2 w-2 rounded-full bg-primary mr-3 animate-pulse" />
          <p><strong>Aviso:</strong> Esta tela é destinada ao gerenciamento de <strong>clientes que já estão fechados (ativos)</strong>.</p>
        </div>

        {/* Barra de Pesquisa e Filtros (Card Envolvente) */}
        <div className="bg-card p-2 rounded-2xl border shadow-sm flex items-center justify-between">
          <div className="relative flex-1 w-full ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Nome, CNPJ ou Cidade..."
              className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 shadow-none text-base sm:text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Empresas (Premium) */}
        <div className="bg-card border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b-border/50 hover:bg-transparent">
                  <TableHead className="w-[300px] pl-6 font-semibold text-foreground/80">Empresa</TableHead>
                  <TableHead className="font-semibold text-foreground/80">CNPJ</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Segmento</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Localização</TableHead>
                  <TableHead className="text-right pr-6 font-semibold text-foreground/80">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => (
                  <TableRow 
                    key={emp.id}
                    className="cursor-pointer group hover:bg-primary/[0.02] border-b-border/50 transition-colors duration-200"
                    onClick={() => navigate({ to: `/clientes/${emp.id}` })}
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{emp.nome}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">Adicionado em {format(new Date(emp.created_at || new Date()), "MMM/yy", { locale: ptBR })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground font-mono">
                        {emp.cnpj || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-foreground/70">
                        {getSegmentIcon(emp.segmento)}
                        {emp.segmento}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {emp.cidade}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Visualizar"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({ to: `/clientes/${emp.id}` });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Editar"
                          onClick={(e) => handleEditEmpresa(emp, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                          title="Excluir"
                          onClick={(e) => handleDeleteEmpresa(emp.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Search className="h-5 w-5 opacity-40" />
                        </div>
                        <p className="font-medium">Nenhuma empresa encontrada</p>
                        <p className="text-xs mt-1 max-w-sm mx-auto">Não encontramos nenhum registro com a busca atual.</p>
                        <Button variant="link" onClick={limparFiltros} className="mt-2">Limpar busca</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="bg-muted/30 border-t px-6 py-4 text-xs font-medium text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Exibindo <strong>{filtered.length}</strong> de <strong>{empresas.length}</strong> clientes ativos.
            </span>
          </div>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[100vw] sm:max-w-[800px] overflow-y-auto border-l-0 sm:border-l shadow-2xl">
          <SheetHeader className="mb-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {empresaEditando ? <Edit className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-primary" />}
              </div>
              <SheetTitle className="text-xl">{empresaEditando ? 'Editar Cadastro' : 'Novo Cadastro'}</SheetTitle>
            </div>
            <SheetDescription className="text-sm">
              {empresaEditando 
                ? 'Atualize os dados desta empresa abaixo.' 
                : 'Preencha os dados da nova empresa. Use o CNPJ para preenchimento automático.'}
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-2">
            <EmpresaForm 
              initialData={empresaEditando} 
              onSubmit={handleSubmitForm} 
              onCancel={() => setIsSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
