import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSuporte } from "@/hooks/useSuporte";
import { StatusRotina } from "@/types/suporte";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, CalendarDays, MessageCircle, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_suporte/rotinas")({
  component: RotinasPage,
});

function RotinasPage() {
  const { calcularStatusRotina, registrarCheckin } = useSuporte();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Check-in Modal
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [tipoInteracao, setTipoInteracao] = useState("WhatsApp");
  const [notas, setNotas] = useState("");

  const fetchEmpresas = async () => {
    setLoading(true);
    const { data } = await supabase.from('empresas').select('id, nome, dias_cadencia, ultimo_contato_em').eq('status', 'Ativo');
    if (data) setEmpresas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleOpenCheckin = (emp: any) => {
    setSelectedEmpresa(emp);
    setTipoInteracao("WhatsApp");
    setNotas("");
    setCheckinOpen(true);
  };

  const handleSaveCheckin = async () => {
    if (!selectedEmpresa) return;
    try {
      await registrarCheckin(selectedEmpresa.id, tipoInteracao, notas);
      toast.success("Check-in registrado com sucesso!");
      setCheckinOpen(false);
      fetchEmpresas(); // recarrega a lista
    } catch (err) {
      toast.error("Erro ao registrar check-in.");
    }
  };

  const getStatusColor = (status: StatusRotina) => {
    switch (status) {
      case "Em dia": return "bg-green-100 text-green-700 border-green-200";
      case "Alerta": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Atrasado": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: StatusRotina) => {
    switch (status) {
      case "Em dia": return <CheckCircle className="w-3.5 h-3.5 mr-1" />;
      case "Alerta": return <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      case "Atrasado": return <Clock className="w-3.5 h-3.5 mr-1" />;
      default: return <CalendarDays className="w-3.5 h-3.5 mr-1" />;
    }
  };

  const empresasComStatus = empresas.map(emp => ({
    ...emp,
    statusRotina: calcularStatusRotina(emp.ultimo_contato_em, emp.dias_cadencia || 30)
  }));

  // Ordena para que os "Atrasados" apareçam primeiro, seguidos de "Alerta", depois "Em dia" e "Sem contato"
  const orderWeight = { "Atrasado": 1, "Alerta": 2, "Sem contato": 3, "Em dia": 4 };
  empresasComStatus.sort((a, b) => orderWeight[a.statusRotina] - orderWeight[b.statusRotina]);

  const filtered = empresasComStatus.filter(emp => emp.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            Rotina de Contatos Pró-ativos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie a SLA de follow-up com clientes ativos.</p>
        </div>
      </div>

      <div className="px-6 pb-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
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
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead>Cadência</TableHead>
                <TableHead>Status da Rotina</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhuma empresa encontrada.</TableCell></TableRow>
              ) : (
                filtered.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.nome}</TableCell>
                    <TableCell>
                      {emp.ultimo_contato_em ? format(parseISO(emp.ultimo_contato_em), "dd/MM/yyyy", { locale: ptBR }) : 'Nunca contatado'}
                    </TableCell>
                    <TableCell>{emp.dias_cadencia || 30} dias</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-semibold ${getStatusColor(emp.statusRotina)}`}>
                        {getStatusIcon(emp.statusRotina)} {emp.statusRotina}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="secondary" size="sm" onClick={() => handleOpenCheckin(emp)}>
                        Registrar Check-in
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Check-in: {selectedEmpresa?.nome}</DialogTitle>
            <DialogDescription>O check-in atualiza a data do último contato e recalcula a cadência.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Canal de Comunicação</Label>
              <Select value={tipoInteracao} onValueChange={setTipoInteracao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Telefone">Telefone</SelectItem>
                  <SelectItem value="E-mail">E-mail</SelectItem>
                  <SelectItem value="Reunião">Reunião (Meet/Zoom)</SelectItem>
                  <SelectItem value="Visita Técnica">Visita Presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Anotações do Contato</Label>
              <Textarea 
                value={notas} 
                onChange={(e) => setNotas(e.target.value)} 
                placeholder="Como foi o contato? O cliente relatou algo? Tudo OK?" 
                className="resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckinOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCheckin}>Salvar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
