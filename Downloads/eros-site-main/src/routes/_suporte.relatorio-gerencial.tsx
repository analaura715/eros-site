import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useSuporte } from "@/hooks/useSuporte";
import { Ticket } from "@/types/suporte";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, isSameMonth, subMonths, differenceInMinutes, getDay, getWeekOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, Clock, FileText, CheckCircle, BarChart } from "lucide-react";
import _ from "lodash";

export const Route = createFileRoute("/_suporte/relatorio-gerencial")({
  component: RelatorioGerencialPage,
});

function formatarTempo(minutos: number) {
  if (isNaN(minutos) || minutos === 0) return "0h";
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function calcularTMA(ticket: Ticket) {
  if (ticket.status !== "Resolvido" || !ticket.created_at) return 0;
  const start = parseISO(ticket.created_at);
  const end = ticket.data_fim ? parseISO(ticket.data_fim) : ticket.deletado_em ? parseISO(ticket.deletado_em) : new Date(start.getTime() + 60 * 60 * 1000); // fallback de 1h
  return Math.max(0, differenceInMinutes(end, start));
}

function getDiaSemanaExtenso(dia: number) {
  const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return dias[dia] || "";
}

function RelatorioGerencialPage() {
  const { fetchChamados, loading } = useSuporte();
  const [chamados, setChamados] = useState<Ticket[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    fetchChamados().then(data => setChamados(data));
  }, [fetchChamados]);

  // Opções de meses (últimos 12 meses)
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const d = subMonths(new Date(), i);
      options.push({
        value: format(d, "yyyy-MM"),
        label: format(d, "MMMM 'de' yyyy", { locale: ptBR })
      });
    }
    return options;
  }, []);

  const chamadosDoMes = useMemo(() => {
    if (!chamados.length) return [];
    const [year, month] = selectedMonth.split("-").map(Number);
    const targetDate = new Date(year, month - 1);
    
    return chamados.filter(c => {
      if (!c.created_at) return false;
      return isSameMonth(parseISO(c.created_at), targetDate);
    });
  }, [chamados, selectedMonth]);

  const metricas = useMemo(() => {
    const total = chamadosDoMes.length;

    let totalMinutosEsforco = 0;
    let resolucoesValidas = 0;

    const ticketsComTma = chamadosDoMes.map(c => {
      const tmaMinutos = calcularTMA(c);
      if (c.status === "Resolvido") {
        totalMinutosEsforco += tmaMinutos;
        resolucoesValidas++;
      }
      return { ...c, tmaMinutos };
    });

    const tmaGlobalMinutos = resolucoesValidas > 0 ? totalMinutosEsforco / resolucoesValidas : 0;

    // 1. Módulo Líder
    const porModulo = _.countBy(chamadosDoMes, c => c.modulo || 'Outros');
    let maxModulo = 0;
    let moduloLider = "Nenhum";
    Object.entries(porModulo).forEach(([name, count]) => {
      if (count > maxModulo) {
        maxModulo = count;
        moduloLider = name;
      }
    });

    // 2. Análise Temporal / Picos
    const chamadosPorSemana = _.countBy(chamadosDoMes, c => getWeekOfMonth(parseISO(c.created_at), { weekStartsOn: 0 }));
    let semanaPico = "1";
    let maxSemana = 0;
    Object.entries(chamadosPorSemana).forEach(([sem, count]) => {
      if (count > maxSemana) {
        maxSemana = count;
        semanaPico = sem;
      }
    });

    const chamadosPorDiaDaSemana = _.countBy(chamadosDoMes, c => getDay(parseISO(c.created_at)));
    let diaDaSemanaPico = 0;
    let maxDiaSemana = 0;
    Object.entries(chamadosPorDiaDaSemana).forEach(([dia, count]) => {
      if (count > maxDiaSemana) {
        maxDiaSemana = count;
        diaDaSemanaPico = Number(dia);
      }
    });

    const chamadosPorDia = _.countBy(chamadosDoMes, c => format(parseISO(c.created_at), 'dd/MM/yyyy'));
    let diaPico = "-";
    let maxDia = 0;
    Object.entries(chamadosPorDia).forEach(([data, count]) => {
      if (count > maxDia) {
        maxDia = count;
        diaPico = data;
      }
    });

    // 3. Ranking de Empresas (Volume)
    const porClienteObj = _.groupBy(ticketsComTma, c => c.empresa_id ? (c.empresa?.nome || "Cliente Desconhecido") : (c.solicitante || "Cliente Desconhecido"));
    
    let rankingVolume = Object.entries(porClienteObj).map(([nome, tickets]) => {
      const mods = _.countBy(tickets, c => c.modulo || 'Outros');
      const moduloPrincipal = Object.entries(mods).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
      return {
        nome,
        qtd: tickets.length,
        pct: total > 0 ? ((tickets.length / total) * 100).toFixed(1) : "0",
        moduloPrincipal
      };
    }).sort((a, b) => b.qtd - a.qtd).slice(0, 10);

    // 4. Ranking de Empresas (Esforço / Tempo)
    let rankingEsforco = Object.entries(porClienteObj).map(([nome, tickets]) => {
      let esforcoTotalMin = 0;
      let resolucoesCli = 0;
      tickets.forEach(t => {
        if (t.status === "Resolvido") {
          esforcoTotalMin += t.tmaMinutos;
          resolucoesCli++;
        }
      });
      const tmaLocal = resolucoesCli > 0 ? esforcoTotalMin / resolucoesCli : 0;
      return {
        nome,
        esforcoTotalMin,
        esforcoFormatado: formatarTempo(esforcoTotalMin),
        tmaLocalFormatado: formatarTempo(tmaLocal),
        pct: totalMinutosEsforco > 0 ? ((esforcoTotalMin / totalMinutosEsforco) * 100).toFixed(1) : "0",
      };
    }).sort((a, b) => b.esforcoTotalMin - a.esforcoTotalMin).slice(0, 10);

    // 5. Análise por Módulo (Tabela completa)
    const agrupadoModulo = _.groupBy(ticketsComTma, c => c.modulo || 'Outros');
    const relatorioModulos = Object.entries(agrupadoModulo).map(([modulo, tickets]) => {
      const tipos = _.countBy(tickets, c => c.tipo || 'Outro');
      const tipoPredominante = Object.entries(tipos).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
      
      let minTotal = 0;
      let res = 0;
      tickets.forEach(t => {
        if(t.status === "Resolvido") {
          minTotal += t.tmaMinutos;
          res++;
        }
      });

      return {
        modulo,
        qtd: tickets.length,
        pct: total > 0 ? ((tickets.length / total) * 100).toFixed(1) : "0",
        tma: formatarTempo(res > 0 ? minTotal / res : 0),
        tipoPredominante
      };
    }).sort((a, b) => b.qtd - a.qtd);

    return {
      total,
      tmaGlobalFormatado: formatarTempo(tmaGlobalMinutos),
      totalHorasFormatado: formatarTempo(totalMinutosEsforco),
      moduloLider,
      pctModuloLider: total > 0 ? ((maxModulo / total) * 100).toFixed(1) : "0",
      diaDaSemanaPico: getDiaSemanaExtenso(diaDaSemanaPico),
      diaPico,
      maxDia,
      semanaPico,
      rankingVolume,
      rankingEsforco,
      relatorioModulos
    };

  }, [chamadosDoMes]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Gerando relatório gerencial...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 print:bg-white pb-20">
      
      {/* BARRA DE CONTROLE (NÃO IMPRESSA) */}
      <div className="bg-white border-b sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-[210mm] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Relatório Executivo</h1>
              <p className="text-xs text-muted-foreground">Visão e exportação para PDF</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Mês Base" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(m => (
                  <SelectItem key={m.value} value={m.value} className="capitalize">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button 
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none bg-indigo-600 text-white shadow hover:bg-indigo-700 h-9 px-4 py-2 gap-2"
            >
              <Printer className="w-4 h-4" /> Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* PÁGINA A4 PRINCIPAL PARA IMPRESSÃO */}
      <div className="max-w-[210mm] mx-auto mt-8 bg-white print:mt-0 print:shadow-none shadow-[0_5px_30px_rgba(0,0,0,0.05)] border print:border-none p-10 print:p-0 min-h-[297mm]">
        
        {/* HEADER EXECUTIVO */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 uppercase tracking-tight">Relatório Gerencial</h1>
            <h2 className="text-xl font-medium text-slate-600">Atendimento e Suporte ao Cliente</h2>
            <div className="mt-4 space-y-1 text-sm text-slate-500">
              <p><strong>Período Apurado:</strong> {format(parseISO(`${selectedMonth}-01`), "MMMM 'de' yyyy", { locale: ptBR }).toUpperCase()}</p>
              <p><strong>Data de Emissão:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
            </div>
          </div>
          {/* Logo Placeholder */}
          <div className="w-40 h-16 bg-slate-100 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 font-bold text-sm">
            LOGO DA EMPRESA
          </div>
        </div>

        {/* SUMÁRIO EXECUTIVO - KPIs */}
        <div className="mb-10">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 border-l-4 border-indigo-600 pl-2">Sumário Executivo</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Chamados</p>
              <p className="text-2xl font-black text-slate-800">{metricas.total}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">TMA Geral</p>
              <p className="text-2xl font-black text-slate-800">{metricas.tmaGlobalFormatado}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Horas Dedicadas</p>
              <p className="text-2xl font-black text-slate-800">{metricas.totalHorasFormatado}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 col-span-2">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Módulo Líder / Ofensor</p>
              <p className="text-2xl font-black text-slate-800 truncate" title={metricas.moduloLider}>{metricas.moduloLider} <span className="text-sm font-medium text-slate-400">({metricas.pctModuloLider}%)</span></p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 1: RANKINGS */}
        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 border-l-4 border-indigo-600 pl-2">Seção 1: Análise por Empresas / Clientes</h3>
          
          <div className="space-y-8">
            {/* Tabela 1 */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><BarChart className="w-4 h-4"/> Top 10 Empresas (Maior Volume)</h4>
              <div className="border rounded-md overflow-hidden">
                <Table className="text-sm">
                  <TableHeader className="bg-slate-100">
                    <TableRow className="border-slate-200 hover:bg-slate-100">
                      <TableHead className="w-12 text-center font-bold text-slate-600">Pos</TableHead>
                      <TableHead className="font-bold text-slate-600">Empresa/Cliente</TableHead>
                      <TableHead className="text-center font-bold text-slate-600">Chamados</TableHead>
                      <TableHead className="text-center font-bold text-slate-600">% Vol</TableHead>
                      <TableHead className="font-bold text-slate-600">Módulo Mais Solicitado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metricas.rankingVolume.map((item, i) => (
                      <TableRow key={i} className="border-slate-100">
                        <TableCell className="text-center font-bold text-slate-400">#{i+1}</TableCell>
                        <TableCell className="font-medium text-slate-800">{item.nome}</TableCell>
                        <TableCell className="text-center font-bold">{item.qtd}</TableCell>
                        <TableCell className="text-center text-slate-500">{item.pct}%</TableCell>
                        <TableCell><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{item.moduloPrincipal}</span></TableCell>
                      </TableRow>
                    ))}
                    {metricas.rankingVolume.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-4">Sem dados no período</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Tabela 2 */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Clock className="w-4 h-4"/> Top 10 Empresas (Maior Carga/Esforço)</h4>
              <div className="border rounded-md overflow-hidden">
                <Table className="text-sm">
                  <TableHeader className="bg-slate-100">
                    <TableRow className="border-slate-200 hover:bg-slate-100">
                      <TableHead className="w-12 text-center font-bold text-slate-600">Pos</TableHead>
                      <TableHead className="font-bold text-slate-600">Empresa/Cliente</TableHead>
                      <TableHead className="text-center font-bold text-slate-600">Tempo Consumido</TableHead>
                      <TableHead className="text-center font-bold text-slate-600">TMA Individual</TableHead>
                      <TableHead className="text-center font-bold text-slate-600">% Esforço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metricas.rankingEsforco.map((item, i) => (
                      <TableRow key={i} className="border-slate-100">
                        <TableCell className="text-center font-bold text-slate-400">#{i+1}</TableCell>
                        <TableCell className="font-medium text-slate-800">{item.nome}</TableCell>
                        <TableCell className="text-center font-bold">{item.esforcoFormatado}</TableCell>
                        <TableCell className="text-center text-slate-500">{item.tmaLocalFormatado}</TableCell>
                        <TableCell className="text-center text-slate-500">{item.pct}%</TableCell>
                      </TableRow>
                    ))}
                    {metricas.rankingEsforco.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-4">Sem dados no período</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Quebra de página visual (Apenas para garantir estrutura no A4) */}
        <div className="break-after-page"></div>

        {/* SEÇÃO 2: MÓDULOS */}
        <div className="mb-10 mt-8 print:mt-0 page-break-inside-avoid">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 border-l-4 border-indigo-600 pl-2">Seção 2: Distribuição e Impacto por Módulo</h3>
          <div className="border rounded-md overflow-hidden">
            <Table className="text-sm">
              <TableHeader className="bg-slate-100">
                <TableRow className="border-slate-200 hover:bg-slate-100">
                  <TableHead className="font-bold text-slate-600">Módulo do Sistema</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">Chamados</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">% Total</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">TMA (Módulo)</TableHead>
                  <TableHead className="font-bold text-slate-600">Tipo Predominante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricas.relatorioModulos.map((item, i) => (
                  <TableRow key={i} className="border-slate-100">
                    <TableCell className="font-medium text-slate-800">{item.modulo}</TableCell>
                    <TableCell className="text-center font-bold">{item.qtd}</TableCell>
                    <TableCell className="text-center text-slate-500">{item.pct}%</TableCell>
                    <TableCell className="text-center font-medium text-slate-600">{item.tma}</TableCell>
                    <TableCell>
                      {item.tipoPredominante !== '-' ? <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"><CheckCircle className="w-3 h-3"/> {item.tipoPredominante}</span> : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {metricas.relatorioModulos.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-4">Sem dados no período</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* SEÇÃO 3: COMPORTAMENTO TEMPORAL */}
        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 border-l-4 border-indigo-600 pl-2">Seção 3: Comportamento Temporal e Picos</h3>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg p-5 shadow-sm text-center">
              <p className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Semana Mais Demandada</p>
              <p className="text-3xl font-black text-slate-800">Semana {metricas.semanaPico}</p>
              <p className="text-xs text-slate-500 mt-2">Maior volume concentrado do mês</p>
            </div>
            <div className="bg-white border rounded-lg p-5 shadow-sm text-center border-l-4 border-l-red-400">
              <p className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Dia de Maior Movimento</p>
              <p className="text-3xl font-black text-slate-800">{metricas.diaPico}</p>
              <p className="text-xs text-slate-500 mt-2"><strong>{metricas.maxDia} chamados</strong> neste único dia</p>
            </div>
            <div className="bg-white border rounded-lg p-5 shadow-sm text-center">
              <p className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Dia da Semana Frequente</p>
              <p className="text-2xl font-black text-slate-800 pt-1">{metricas.diaDaSemanaPico}</p>
              <p className="text-xs text-slate-500 mt-2">Onde os chamados costumam abrir</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
