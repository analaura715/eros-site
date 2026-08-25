import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Eye, Building2, PlayCircle, CheckCircle2, PauseCircle, Clock, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export const Route = createFileRoute('/_suporte/implantacoes/')({
  component: ImplantacoesIndexComponent,
});

const COLUNAS = ['Não Iniciada', 'Em Andamento', 'Pausada', 'Concluída'];

function ImplantacoesIndexComponent() {
  const navigate = useNavigate();
  const [implantacoes, setImplantacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const fetchImplantacoes = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('implantacoes')
      .select('*, empresas(nome, cidade, uf)')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(error);
      toast.error('Erro ao buscar implantações. A tabela foi criada?');
    } else {
      setImplantacoes(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchImplantacoes();
  }, []);

  const filtered = implantacoes.filter(impl => {
    const s = search.toLowerCase();
    const matchSearch = impl.empresas?.nome?.toLowerCase().includes(s) || 
                       impl.empresas?.cidade?.toLowerCase().includes(s);
           
    const matchStatus = statusFilter === 'todas' || impl.status === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Não Iniciada': return <Clock className="h-4 w-4 text-slate-500" />;
      case 'Em Andamento': return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'Concluída': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'Pausada': return <PauseCircle className="h-4 w-4 text-amber-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Não Iniciada': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Em Andamento': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Concluída': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pausada': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceStatus = result.source.droppableId;
    const destStatus = result.destination.droppableId;
    
    if (sourceStatus === destStatus) return;

    const implId = result.draggableId;
    
    // Optmistic Update
    setImplantacoes(prev => 
      prev.map(impl => 
        impl.id === implId ? { ...impl, status: destStatus } : impl
      )
    );

    // Save to DB
    const { error } = await supabase.from('implantacoes').update({ status: destStatus }).eq('id', implId);
    
    if (error) {
      toast.error('Erro ao mover implantação');
      fetchImplantacoes(); // Revert
    } else {
      // Log History
      await supabase.from('implantacao_historico').insert([{
        implantacao_id: implId,
        tipo: 'Mudança de Status',
        descricao: `O status da implantação foi movido para: ${destStatus}`,
        criado_por: 'Sistema'
      }]);
      toast.success(`Implantação movida para ${destStatus}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background">
      <div className="relative overflow-hidden border-b px-6 py-6 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/20 shadow-sm">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Implantações</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Acompanhe as empresas no processo de onboarding (Kanban).</p>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 bg-muted/30 p-1 rounded-lg border">
          <Button 
            variant={viewMode === 'kanban' ? 'default' : 'ghost'} 
            size="sm" 
            className={`h-8 px-3 ${viewMode === 'kanban' ? 'shadow-sm' : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm" 
            className={`h-8 px-3 ${viewMode === 'list' ? 'shadow-sm' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            Lista
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 w-full mx-auto overflow-hidden">
        {/* Filters */}
        <div className="bg-card p-2 rounded-xl border shadow-sm flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <div className="relative flex-1 w-full ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar Empresa ou Cidade..."
              className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 shadow-none text-base sm:text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {viewMode === 'list' && (
            <div className="w-full sm:w-[220px] pr-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 bg-transparent border-0 shadow-none focus:ring-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Implantações</SelectItem>
                  {COLUNAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Content Area */}
        {viewMode === 'list' ? (
          <div className="bg-card border rounded-2xl shadow-sm flex flex-col overflow-hidden h-full">
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-b-border/50 hover:bg-transparent">
                    <TableHead className="w-[300px] font-semibold pl-6">Empresa</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Responsável</TableHead>
                    <TableHead className="font-semibold">Início</TableHead>
                    <TableHead className="text-right pr-6 font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((impl) => (
                    <TableRow 
                      key={impl.id}
                      className="cursor-pointer group hover:bg-primary/[0.02] border-b-border/50 transition-colors duration-200"
                      onClick={() => navigate({ to: '/_suporte/implantacoes/$id', params: { id: impl.id } })}
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm">{impl.empresas?.nome || '—'}</span>
                          <span className="text-[11px] text-muted-foreground mt-0.5">
                            {impl.empresas?.cidade ? `${impl.empresas.cidade} - ${impl.empresas.uf}` : 'Localização não informada'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(impl.status)}`}>
                            {getStatusIcon(impl.status)}
                            {impl.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground/80">{impl.responsavel || 'Não atribuído'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {impl.data_inicio ? format(new Date(impl.data_inicio), "dd MMM yyyy", { locale: ptBR }) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors opacity-60 group-hover:opacity-100"
                          title="Ver Detalhes"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({ to: '/_suporte/implantacoes/$id', params: { id: impl.id } });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <Building2 className="h-8 w-8 opacity-40 mb-3" />
                          <p className="font-medium">Nenhuma implantação encontrada.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="bg-muted/30 border-t px-6 py-4 text-xs font-medium text-muted-foreground flex items-center justify-between shrink-0">
              <span className="flex items-center gap-2">
                Exibindo <strong>{filtered.length}</strong> implantações.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex h-full gap-4 pb-4 min-w-max">
                {COLUNAS.map(coluna => {
                  const itensDaColuna = filtered.filter(i => i.status === coluna);
                  
                  return (
                    <div key={coluna} className="w-[320px] shrink-0 flex flex-col h-full bg-slate-100/50 dark:bg-card border rounded-xl overflow-hidden">
                      <div className="p-3 border-b bg-white dark:bg-muted/30 flex items-center justify-between shrink-0">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          {getStatusIcon(coluna)}
                          {coluna}
                        </h3>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {itensDaColuna.length}
                        </Badge>
                      </div>

                      <Droppable droppableId={coluna}>
                        {(provided, snapshot) => (
                          <div 
                            {...provided.droppableProps} 
                            ref={provided.innerRef}
                            className={`flex-1 overflow-y-auto p-3 flex flex-col gap-3 transition-colors ${
                              snapshot.isDraggingOver ? 'bg-primary/5' : ''
                            }`}
                          >
                            {itensDaColuna.map((impl, index) => (
                              <Draggable key={impl.id} draggableId={String(impl.id)} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => navigate({ to: '/_suporte/implantacoes/$id', params: { id: impl.id } })}
                                    className={`bg-white dark:bg-card p-4 rounded-xl border shadow-sm flex flex-col gap-3 cursor-pointer group hover:border-primary/50 transition-all ${
                                      snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-primary/20 z-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">
                                        {impl.empresas?.nome || '—'}
                                      </h4>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Building2 className="h-3 w-3" />
                                      <span className="truncate">
                                        {impl.empresas?.cidade ? `${impl.empresas.cidade} - ${impl.empresas.uf}` : 'Local não informado'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-3 mt-1">
                                      <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md">
                                        {impl.responsavel || 'Sem dono'}
                                      </span>
                                      {impl.modulos_selecionados && impl.modulos_selecionados.length > 0 && (
                                        <Badge variant="outline" className="text-[10px]">
                                          {impl.modulos_selecionados.length} mods
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {itensDaColuna.length === 0 && !snapshot.isDraggingOver && (
                              <div className="h-24 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground text-xs opacity-50">
                                Arraste um card para cá
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          </div>
        )}
      </div>
    </div>
  );
}
