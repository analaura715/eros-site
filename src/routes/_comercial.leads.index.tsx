import { createFileRoute, useNavigate } from '@tanstack/react-router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Edit, Trash2, Building2, MapPin, Target, Flame, Snowflake, Sun, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LeadForm, LeadFormValues } from '@/components/forms/lead-form';
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute('/_comercial/leads/')({
  component: LeadsComponent,
});

function LeadsComponent() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [leadEditando, setLeadEditando] = useState<Partial<LeadFormValues> | undefined>(undefined);

  const fetchLeads = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(error);
      toast.error('Erro ao buscar leads no banco de dados. A tabela leads foi criada?');
    } else {
      setLeads(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filtered = leads.filter(e => {
    const s = search.toLowerCase();
    const matchSearch = e.nome?.toLowerCase().includes(s) || 
           e.cidade?.toLowerCase().includes(s) || 
           (e.cnpj && e.cnpj.includes(s));
           
    const matchStatus = statusFilter === 'todos' || e.status === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const handleOpenNovoLead = () => {
    setLeadEditando(undefined);
    setIsSheetOpen(true);
  };

  const handleEditLead = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeadEditando({
      id: lead.id,
      nome: lead.nome,
      cnpj: lead.cnpj || '',
      nomeFantasia: lead.nome_fantasia || lead.nome,
      inscricaoEstadual: lead.inscricao_estadual || '',
      dataInicioOperacao: lead.data_inicio_operacao ? new Date(lead.data_inicio_operacao) : undefined,
      dataProximoContato: lead.data_proximo_contato ? new Date(lead.data_proximo_contato) : undefined,
      cep: lead.cep || '',
      logradouro: lead.logradouro || '',
      numero: lead.numero || '',
      complemento: lead.complemento || '',
      bairro: lead.bairro || '',
      cidade: lead.cidade || '',
      uf: lead.uf || '',
      telefone: lead.telefone || '',
      email: lead.email || '',
      regimeTributario: lead.regime_tributario || '',
      observacoes: lead.observacoes || '',
      origem: lead.origem || 'Inbound',
      temperatura: lead.temperatura || 'Morno',
      status: lead.status || 'Em observação',
      contatoPrincipal: lead.contato_principal || '',
      cargoContato: lead.cargo_contato || '',
      receitaPotencial: lead.receita_potencial || 0,
      segmento: lead.segmento || ''
    });
    setIsSheetOpen(true);
  };

  const handleDeleteLead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este Lead?")) {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) {
        toast.error("Erro ao excluir.");
      } else {
        toast.success("Lead excluído com sucesso.");
        fetchLeads();
        setIsSheetOpen(false);
      }
    }
  };

  const handleSubmitForm = async (data: LeadFormValues) => {
    const payload = {
      cnpj: data.cnpj,
      nome: data.nome,
      nome_fantasia: data.nomeFantasia,
      inscricao_estadual: data.inscricaoEstadual,
      data_inicio_operacao: data.dataInicioOperacao ? data.dataInicioOperacao.toISOString() : null,
      data_proximo_contato: data.dataProximoContato ? data.dataProximoContato.toISOString() : null,
      segmento: data.segmento,
      cep: data.cep,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      uf: data.uf,
      telefone: data.telefone,
      email: data.email,
      regime_tributario: data.regimeTributario,
      observacoes: data.observacoes,
      origem: data.origem,
      temperatura: data.temperatura,
      status: data.status,
      contato_principal: data.contatoPrincipal,
      cargo_contato: data.cargoContato,
      receita_potencial: data.receitaPotencial
    };

    if (data.id) {
      const { error } = await supabase.from('leads').update(payload).eq('id', data.id);
      if (error) {
        toast.error("Erro ao atualizar lead.");
      } else {
        toast.success("Lead atualizado com sucesso.");
        fetchLeads();
        setIsSheetOpen(false);
      }
    } else {
      const { error } = await supabase.from('leads').insert([payload]);
      if (error) {
        toast.error("Erro ao cadastrar lead. Verifique a tabela.");
      } else {
        toast.success("Novo lead cadastrado com sucesso.");
        fetchLeads();
        setIsSheetOpen(false);
      }
    }
  };

  const limparFiltros = () => {
    setSearch('');
    setStatusFilter('todos');
  };

  const getTemperaturaIcon = (temp: string) => {
    switch (temp) {
      case 'Quente': return <Flame className="h-4 w-4 text-red-500" />;
      case 'Frio': return <Snowflake className="h-4 w-4 text-blue-500" />;
      case 'Morno': return <Sun className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Em observação': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Prospectada': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Entrar em contato': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Em contato': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Reunião agendada': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'Em negociação': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Proposta enviada': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Sem interesse': return 'bg-red-100 text-red-700 border-red-200';
      case 'Sem resposta': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatWhatsAppLink = (phone: string) => {
    if (!phone) return '#';
    const cleanNumber = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanNumber}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b px-6 py-8 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/20 shadow-sm">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Prospecção de novos potenciais clientes.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button 
            variant="outline" 
            className="shadow-sm bg-white hover:bg-slate-50 transition-colors h-10 px-4 rounded-full text-foreground/80 font-medium"
            onClick={() => {
              const headers = ['Nome', 'Localização', 'Status'];
              const csvContent = [
                headers.join(';'),
                ...filtered.map(lead => {
                  const loc = lead.cidade ? `${lead.cidade} ${lead.uf ? `- ${lead.uf}` : ''}` : 'N/A';
                  return [
                    `"${lead.nome || ''}"`,
                    `"${loc}"`,
                    `"${lead.status || ''}"`
                  ].join(';');
                })
              ].join('\n');
              
              const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = 'relatorio_leads.csv';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button 
            variant="outline" 
            className="shadow-sm bg-white hover:bg-slate-50 transition-colors h-10 px-4 rounded-full text-foreground/80 font-medium"
            onClick={() => {
              const doc = new jsPDF();
              
              // Título e cabeçalho
              doc.setFontSize(18);
              doc.setTextColor(40);
              doc.text('Relatório de Leads', 14, 22);
              
              doc.setFontSize(10);
              doc.setTextColor(100);
              doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
              doc.text(`Total de registros: ${filtered.length}`, 14, 36);

              const tableColumn = ["Nome / Empresa", "Localização", "Status"];
              const tableRows: any[] = [];

              filtered.forEach(lead => {
                const loc = lead.cidade ? `${lead.cidade} ${lead.uf ? `- ${lead.uf}` : ''}` : 'Não informada';
                tableRows.push([
                  lead.nome || '—',
                  loc,
                  lead.status || '—'
                ]);
              });

              autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 42,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 4 },
                headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
              });

              // --- Resumo de Status no Final ---
              const finalY = (doc as any).lastAutoTable.finalY || 42;
              let currentY = finalY + 15;

              // Calcular métricas
              const totalLeads = filtered.length;
              const notContactedStatuses = ['Entrar em contato', 'Em observação'];
              const contactedCount = filtered.filter(lead => {
                const st = lead.status || '';
                return !notContactedStatuses.includes(st);
              }).length;

              const statusCounts: Record<string, number> = {};
              filtered.forEach(lead => {
                const st = lead.status || 'Sem status definido';
                statusCounts[st] = (statusCounts[st] || 0) + 1;
              });

              const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);

              // Nova página se não houver espaço suficiente para o início do resumo
              if (currentY > 250) {
                doc.addPage();
                currentY = 20;
              }

              // Título do resumo
              doc.setFontSize(14);
              doc.setTextColor(40);
              doc.setFont("helvetica", "bold");
              doc.text("Resumo e Métricas", 14, currentY);

              currentY += 8;
              doc.setFontSize(10);
              doc.setTextColor(80);
              doc.setFont("helvetica", "normal");
              doc.text(`Total de leads no relatório: ${totalLeads}`, 14, currentY);
              
              currentY += 6;
              doc.text(`Leads já contatados: ${contactedCount}`, 14, currentY);

              currentY += 10;
              doc.setFont("helvetica", "bold");
              doc.setTextColor(40);
              doc.text("Quantidades por status (decrescente):", 14, currentY);

              currentY += 6;
              doc.setFont("helvetica", "normal");
              doc.setTextColor(80);
              
              sortedStatuses.forEach(([status, count]) => {
                if (currentY > 280) {
                  doc.addPage();
                  currentY = 20;
                }
                doc.text(`- ${status}: ${count}`, 18, currentY);
                currentY += 6;
              });

              doc.save('Relatorio_Leads.pdf');
            }}
          >
            <Printer className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button 
            className="shadow-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg transition-all duration-300 h-10 px-5 rounded-full text-white"
            onClick={handleOpenNovoLead}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
        
        {/* Barra de Pesquisa e Filtros */}
        <div className="bg-card p-2 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar Lead, Contato, CNPJ ou Cidade..."
              className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 shadow-none text-base sm:text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-[220px] pr-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 bg-transparent border-0 shadow-none focus:ring-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="Em observação">Em observação</SelectItem>
                <SelectItem value="Prospectada">Prospectada</SelectItem>
                <SelectItem value="Entrar em contato">Entrar em contato</SelectItem>
                <SelectItem value="Em contato">Em contato</SelectItem>
                <SelectItem value="Reunião agendada">Reunião agendada</SelectItem>
                <SelectItem value="Em negociação">Em negociação</SelectItem>
                <SelectItem value="Proposta enviada">Proposta enviada</SelectItem>
                <SelectItem value="Sem interesse">Sem interesse</SelectItem>
                <SelectItem value="Sem resposta">Sem resposta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabela de Leads */}
        <div className="bg-card border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b-border/50 hover:bg-transparent">
                  <TableHead className="w-[280px] pl-6 font-semibold text-foreground/80">Lead / Empresa</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Contato Principal</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Temperatura</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Status</TableHead>
                  <TableHead className="font-semibold text-foreground/80">Localização</TableHead>
                  <TableHead className="text-right pr-6 font-semibold text-foreground/80">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow 
                    key={lead.id}
                    className="cursor-pointer group hover:bg-primary/[0.02] border-b-border/50 transition-colors duration-200"
                    onClick={() => handleEditLead(lead, { stopPropagation: () => {} } as any)}
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">{lead.nome}</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Origem: {lead.origem || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground/80">{lead.contato_principal || '—'}</span>
                        {lead.telefone ? (
                          <a 
                            href={formatWhatsAppLink(lead.telefone)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[11px] text-green-600 hover:text-green-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                            {lead.telefone}
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">{lead.email || ''}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {getTemperaturaIcon(lead.temperatura)}
                        {lead.temperatura}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {lead.cidade ? (
                          <>
                            <MapPin className="h-3 w-3" />
                            {lead.cidade} {lead.uf ? `- ${lead.uf}` : ''}
                          </>
                        ) : '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Editar"
                          onClick={(e) => handleEditLead(lead, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                          title="Excluir"
                          onClick={(e) => handleDeleteLead(lead.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Target className="h-5 w-5 opacity-40" />
                        </div>
                        <p className="font-medium">Nenhum lead encontrado</p>
                        <p className="text-xs mt-1 max-w-sm mx-auto">Adicione um novo lead para começar a sua prospecção.</p>
                        {search && (
                          <Button variant="link" onClick={limparFiltros} className="mt-2">Limpar busca</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="bg-muted/30 border-t px-6 py-4 text-xs font-medium text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              Exibindo <strong>{filtered.length}</strong> leads de prospecção.
            </span>
          </div>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[100vw] sm:max-w-[800px] overflow-y-auto border-l-0 sm:border-l shadow-2xl">
          <SheetHeader className="mb-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                {leadEditando ? <Edit className="h-5 w-5 text-blue-600" /> : <Target className="h-5 w-5 text-blue-600" />}
              </div>
              <SheetTitle className="text-xl">{leadEditando ? 'Editar Lead' : 'Novo Lead'}</SheetTitle>
            </div>
            <SheetDescription className="text-sm">
              {leadEditando 
                ? 'Atualize os dados de prospecção deste lead.' 
                : 'Preencha os dados básicos para iniciar a prospecção.'}
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-2">
            <LeadForm 
              key={leadEditando?.id || 'novo'}
              initialData={leadEditando} 
              onSubmit={handleSubmitForm} 
              onCancel={() => setIsSheetOpen(false)}
              onDelete={leadEditando?.id ? () => handleDeleteLead(leadEditando.id) : undefined}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
