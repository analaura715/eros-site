import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Phone, Mail, ArrowLeft, MoreVertical, Plus, FileText, Target, MapPin, Globe, Clock, CheckCircle2, MessageCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute('/_suporte/clientes/$id')({
  component: EmpresaDetailComponent,
});

function EmpresaDetailComponent() {
  const { id } = Route.useParams();
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmpresa = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('empresas').select('*').eq('id', id).single();
      if (!error && data) {
        setEmpresa(data);
      }
      setLoading(false);
    };
    fetchEmpresa();
  }, [id]);

  if (loading) return <div className="p-8">Carregando dados da empresa...</div>;
  if (!empresa) return <div className="p-8">Empresa não encontrada.</div>;

  return (
    <div className="flex flex-col h-full bg-background max-h-screen">
      {/* Header Visão 360 */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => history.back()} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{empresa.nome}</h1>
              <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400 font-normal">
                Cliente Ativo
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {empresa.cidade} - {empresa.uf}</span>
              {empresa.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {empresa.email}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50 dark:border-green-900/50 dark:hover:bg-green-900/20">
            <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
          </Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Nova Nota</Button>
        </div>
      </header>

      {/* Corpo */}
      <div className="flex flex-1 overflow-hidden">
        {/* Coluna Esquerda (Sidebar de Dados) */}
        <aside className="w-[340px] border-r bg-muted/20 flex flex-col gap-6 p-6 overflow-y-auto hidden md:flex shrink-0">
          
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sobre a Empresa</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">CNPJ</span>
                <span className="font-medium">{empresa.cnpj || 'Não informado'}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Inscrição Estadual</span>
                <span className="font-medium">{empresa.inscricao_estadual || 'Isento/Não informado'}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Segmento</span>
                <span className="font-medium">{empresa.segmento || 'Não classificado'}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Regime Tributário</span>
                <span className="font-medium">{empresa.regime_tributario || 'Sem Regime'}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Telefone</span>
                <span className="font-medium">{empresa.telefone || 'Não informado'}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">E-mail</span>
                <span className="font-medium">{empresa.email || 'Não informado'}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Início de Operação</span>
                <span className="font-medium">{empresa.data_inicio_operacao ? format(new Date(empresa.data_inicio_operacao), 'dd/MM/yyyy') : 'Não informado'}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Endereço Completo</span>
                <span className="font-medium leading-tight">
                  {empresa.logradouro}, {empresa.numero} {empresa.complemento && ` - ${empresa.complemento}`}<br/>
                  {empresa.bairro}, {empresa.cidade} - {empresa.uf}<br/>
                  CEP: {empresa.cep}
                </span>
              </div>
              {empresa.observacoes && (
                <div className="grid gap-1 pt-2 border-t mt-2">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Observações</span>
                  <span className="font-medium text-xs whitespace-pre-wrap">{empresa.observacoes}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" /> Contatos (2)
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-3 w-3" /></Button>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                  MD
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-medium truncate">Marcos Dias</span>
                  <span className="text-xs text-muted-foreground truncate">Diretor de Operações</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                  AS
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-medium truncate">Ana Silva</span>
                  <span className="text-xs text-muted-foreground truncate">Gerente Financeira</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Timeline Central */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background p-6">
          <div className="max-w-3xl w-full mx-auto flex flex-col gap-6">
            
            {/* Quick Note Input */}
            <div className="relative">
              <Textarea 
                placeholder="Adicione uma anotação sobre esta empresa..."
                className="min-h-[100px] resize-none pb-12 shadow-sm focus-visible:ring-1 bg-card"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Button size="sm">Salvar Anotação</Button>
              </div>
            </div>

            {/* Tabs de Filtro */}
            <Tabs defaultValue="tudo" className="w-full">
              <TabsList className="bg-transparent border-b w-full justify-start rounded-none p-0 h-auto space-x-6">
                <TabsTrigger value="tudo" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 shadow-none data-[state=active]:shadow-none">
                  Tudo
                </TabsTrigger>
                <TabsTrigger value="notas" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 shadow-none data-[state=active]:shadow-none">
                  Anotações
                </TabsTrigger>
                <TabsTrigger value="atividades" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 shadow-none data-[state=active]:shadow-none">
                  Atividades
                </TabsTrigger>
              </TabsList>

              {/* Timeline Feed */}
              <TabsContent value="tudo" className="mt-6 flex flex-col gap-6">
                
                {/* Item Timeline: Atividade Completa */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2 mt-1">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="w-px h-full bg-border"></div>
                  </div>
                  <div className="flex flex-col gap-2 pb-6 w-full">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Ligação Realizada</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Hoje, 10:30</span>
                    </div>
                    <Card className="shadow-sm">
                      <CardContent className="p-4 text-sm text-muted-foreground">
                        Falei com o Marcos sobre a proposta enviada. Ele disse que estão analisando com a diretoria, mas gostaram muito do módulo de rastreabilidade. Pediu para retornar na sexta-feira.
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Item Timeline: Mudança de Fase */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2 mt-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="w-px h-full bg-border"></div>
                  </div>
                  <div className="flex flex-col gap-1 pb-6 w-full">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-semibold">Oportunidade avançada</span> para <Badge variant="secondary" className="text-[10px]">Negociação</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Ontem, 16:45</span>
                    </div>
                  </div>
                </div>

                {/* Item Timeline: Email */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2 mt-1">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="w-px h-full bg-border"></div>
                  </div>
                  <div className="flex flex-col gap-2 pb-6 w-full">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">E-mail Enviado</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> 22 de Jul, 09:15</span>
                    </div>
                    <Card className="shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm">Proposta Comercial - Nexa ERP</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-sm text-muted-foreground line-clamp-3">
                        Olá Marcos, tudo bem? Conforme conversamos, segue em anexo a nossa proposta comercial para a implementação do Nexa ERP na Fazenda Citrosul...
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Item Timeline: Criação */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2 mt-1">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Empresa Criada</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(empresa.created_at || new Date()), "dd 'de' MMM, HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>
                </div>

              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
