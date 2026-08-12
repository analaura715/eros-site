import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, Search, Sparkles, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { enriquecerDadosEmpresa, buscarEmpresasPorNome } from "@/lib/gemini";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function DatePickerInput({ value, onChange }: { value: Date | undefined, onChange: (d: Date | undefined) => void }) {
  const [inputValue, setInputValue] = useState(value ? format(value, 'dd/MM/yyyy') : '');
  
  useEffect(() => {
    if (value) setInputValue(format(value, 'dd/MM/yyyy'));
    else setInputValue('');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
    if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5, 9);
    setInputValue(val);
    
    if (val.length === 10) {
      const [day, month, year] = val.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900) onChange(date);
    } else if (val.length === 0) {
      onChange(undefined);
    }
  };

  return (
    <div className="flex gap-1 relative w-full">
      <Input 
        placeholder="DD/MM/AAAA" 
        value={inputValue} 
        onChange={handleInputChange} 
        maxLength={10} 
        className="h-8 text-xs w-full pr-8" 
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 absolute right-0 top-0 text-muted-foreground hover:bg-transparent" type="button" tabIndex={-1}>
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => { onChange(d); if(d) setInputValue(format(d, 'dd/MM/yyyy')); }}
            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            initialFocus
            captionLayout="dropdown"
            fromYear={1900}
            toYear={new Date().getFullYear()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const formSchema = z.object({
  id: z.string().optional(),
  cnpj: z.string().min(14, "CNPJ inválido"),
  nome: z.string().min(2, "Razão social é obrigatória"),
  nomeFantasia: z.string().min(2, "Nome fantasia é obrigatório"),
  inscricaoEstadual: z.string()
    .regex(/^\d{12}$/, "A Inscrição Estadual deve ter exatamente 12 números")
    .optional()
    .or(z.literal('')),
  dataInicioOperacao: z.date({
    required_error: "A data é obrigatória.",
  }),
  segmento: z.string().min(1, "Segmento é obrigatório"),
  cep: z.string().min(8, "CEP inválido"),
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  uf: z.string().length(2, "UF deve ter 2 caracteres"),
  
  // Novos campos adicionados
  telefone: z.string().min(10, "Telefone é obrigatório (mín. 10 dígitos)"),
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  regimeTributario: z.string().optional(),
  observacoes: z.string().optional(),
});

export type EmpresaFormValues = z.infer<typeof formSchema>;

interface EmpresaFormProps {
  initialData?: Partial<EmpresaFormValues>;
  onSubmit: (data: EmpresaFormValues) => void;
  onCancel?: () => void;
}

export function EmpresaForm({ initialData, onSubmit, onCancel }: EmpresaFormProps) {
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [isFetchingIA, setIsFetchingIA] = useState(false);
  const [empresasIA, setEmpresasIA] = useState<{nome: string, cidade: string, cnpj: string}[]>([]);
  const [isModalIAOpen, setIsModalIAOpen] = useState(false);

  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    const fetchL = async () => {
      const { data } = await supabase.from('leads').select('*').order('nome');
      if (data) setLeads(data);
    }
    fetchL();
  }, []);

  const handleImportLead = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    
    if (lead.cnpj) form.setValue("cnpj", lead.cnpj);
    if (lead.nome) form.setValue("nome", lead.nome);
    if (lead.nome_fantasia) form.setValue("nomeFantasia", lead.nome_fantasia);
    if (lead.inscricao_estadual) form.setValue("inscricaoEstadual", lead.inscricao_estadual);
    if (lead.segmento) form.setValue("segmento", lead.segmento);
    if (lead.cep) form.setValue("cep", lead.cep);
    if (lead.logradouro) form.setValue("logradouro", lead.logradouro);
    if (lead.numero) form.setValue("numero", lead.numero);
    if (lead.complemento) form.setValue("complemento", lead.complemento);
    if (lead.bairro) form.setValue("bairro", lead.bairro);
    if (lead.cidade) form.setValue("cidade", lead.cidade);
    if (lead.uf) form.setValue("uf", lead.uf);
    if (lead.telefone || lead.whatsapp) form.setValue("telefone", lead.telefone || lead.whatsapp);
    if (lead.email) form.setValue("email", lead.email);
    if (lead.regime_tributario) form.setValue("regimeTributario", lead.regime_tributario);
    
    toast.success("Dados do Lead importados com sucesso!");
  };

  const form = useForm<EmpresaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || "",
      cnpj: initialData?.cnpj || "",
      nome: initialData?.nome || "",
      nomeFantasia: initialData?.nomeFantasia || "",
      inscricaoEstadual: initialData?.inscricaoEstadual || "",
      dataInicioOperacao: initialData?.dataInicioOperacao || new Date(), // Preenchida com hoje
      segmento: initialData?.segmento || "",
      cep: initialData?.cep || "",
      logradouro: initialData?.logradouro || "",
      numero: initialData?.numero || "",
      complemento: initialData?.complemento || "",
      bairro: initialData?.bairro || "",
      cidade: initialData?.cidade || "",
      uf: initialData?.uf || "SP", // Preenchido como SP por padrão
      telefone: initialData?.telefone || "",
      email: initialData?.email || "",
      regimeTributario: initialData?.regimeTributario || "Sem Regime Tributário",
      observacoes: initialData?.observacoes || "",
    },
  });

  const buscarCNPJ = async (cnpjForcado?: string | React.MouseEvent) => {
    let input = typeof cnpjForcado === 'string' ? cnpjForcado : (form.getValues("cnpj") || "");
    let apenasNumeros = input.replace(/\D/g, "");

    if (/[a-zA-Z]/.test(input) || (apenasNumeros.length > 0 && apenasNumeros.length < 14)) {
      if (input.trim().length < 2) {
        toast.error("Digite pelo menos 2 caracteres para buscar pelo nome.");
        return;
      }
      setIsFetchingIA(true);
      try {
        const resultados = await buscarEmpresasPorNome(input);
        if (resultados && resultados.length > 0) {
          setEmpresasIA(resultados);
          setIsModalIAOpen(true);
        } else {
          toast.error("Nenhuma empresa encontrada com esse nome pela IA.");
        }
      } catch (e) {
        toast.error("Erro ao buscar empresas pela IA.");
      } finally {
        setIsFetchingIA(false);
      }
      return;
    }

    if (apenasNumeros.length !== 14) {
      toast.error("Por favor, informe um CNPJ válido com 14 dígitos ou digite o nome da empresa.");
      return;
    }

    const cnpjParaBuscar = apenasNumeros;
    setIsFetchingCnpj(true);
    try {
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjParaBuscar}`);
      if (!response.ok) {
        throw new Error("CNPJ não encontrado ou erro na API");
      }
      const data = await response.json();
      const est = data.estabelecimento;
      
      form.setValue("nome", data.razao_social);
      form.setValue("nomeFantasia", est.nome_fantasia || data.razao_social);
      form.setValue("cep", est.cep);
      form.setValue("logradouro", `${est.tipo_logradouro} ${est.logradouro}`.trim());
      form.setValue("numero", est.numero);
      form.setValue("complemento", est.complemento || "");
      form.setValue("bairro", est.bairro);
      form.setValue("cidade", est.cidade.nome);
      form.setValue("uf", est.estado.sigla);
      
      if (est.ddd1 && est.telefone1) {
        form.setValue("telefone", `(${est.ddd1}) ${est.telefone1}`);
      }
      if (est.email) {
        form.setValue("email", est.email);
      }

      if (est.data_inicio_atividade) {
        form.setValue("dataInicioOperacao", new Date(est.data_inicio_atividade));
      }

      toast.success("Dados preenchidos com sucesso!");
      
      // Chamada da IA para enriquecer dados
      toast.info("Enriquecendo dados com Inteligência Artificial...");
      const iaData = await enriquecerDadosEmpresa(cnpjParaBuscar, data.razao_social);
      
      if (iaData) {
        if (iaData.telefone && !form.getValues("telefone")) form.setValue("telefone", iaData.telefone);
        if (iaData.email && !form.getValues("email")) form.setValue("email", iaData.email);
        if (iaData.segmento && !form.getValues("segmento")) form.setValue("segmento", iaData.segmento);
        if (iaData.observacoes) {
          const currentObs = form.getValues("observacoes") || "";
          form.setValue("observacoes", currentObs ? `${currentObs}\n\n[IA]: ${iaData.observacoes}` : `[IA]: ${iaData.observacoes}`);
        }
        toast.success("Dados enriquecidos com Inteligência Artificial!");
      }
      
    } catch (error) {
      toast.error("Erro ao buscar CNPJ. Verifique se o número está correto.");
    } finally {
      setIsFetchingCnpj(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="space-y-2 mb-4 bg-muted/30 p-4 rounded-lg border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Importar do Cadastro de Lead</h3>
          <div className="grid grid-cols-1">
             <Select onValueChange={handleImportLead}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione um lead para puxar os dados gravados automaticamente..." />
                </SelectTrigger>
                <SelectContent>
                   {leads.map(l => (
                     <SelectItem key={l.id} value={l.id} className="text-xs">{l.nome} {l.cnpj ? `(${l.cnpj})` : ''}</SelectItem>
                   ))}
                </SelectContent>
             </Select>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dados Principais</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-3 gap-y-2">
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem className="md:col-span-2 space-y-1">
                  <FormLabel className="text-xs">Busca Inteligente (Nome ou CNPJ) *</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      <Input placeholder="Nome da empresa ou CNPJ" className="h-8 text-xs" {...field} />
                      <Button type="button" variant="secondary" className="h-8 w-8 p-0" onClick={buscarCNPJ} disabled={isFetchingCnpj || isFetchingIA}>
                        {isFetchingCnpj || isFetchingIA ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="inscricaoEstadual"
              render={({ field }) => (
                <FormItem className="md:col-span-2 space-y-1">
                  <FormLabel className="text-xs">Inscrição Estadual</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="12 números (Opcional)" 
                      className="h-8 text-xs" 
                      maxLength={12}
                      {...field} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem className="md:col-span-2 space-y-1">
                  <FormLabel className="text-xs">Razão Social *</FormLabel>
                  <FormControl>
                    <Input className="h-8 text-xs" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nomeFantasia"
              render={({ field }) => (
                <FormItem className="md:col-span-2 space-y-1">
                  <FormLabel className="text-xs">Nome Fantasia *</FormLabel>
                  <FormControl>
                    <Input className="h-8 text-xs" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem className="md:col-span-1 space-y-1">
                  <FormLabel className="text-xs">Telefone (WhatsApp) *</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" className="h-8 text-xs" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="md:col-span-1 space-y-1">
                  <FormLabel className="text-xs">E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Opcional" className="h-8 text-xs" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataInicioOperacao"
              render={({ field }) => (
                <FormItem className="md:col-span-1 space-y-1">
                  <FormLabel className="text-xs">Data de Início</FormLabel>
                  <FormControl>
                    <DatePickerInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="segmento"
              render={({ field }) => (
                <FormItem className="md:col-span-1 space-y-1">
                  <FormLabel className="text-xs">Segmento *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mercado" className="text-xs">Mercado</SelectItem>
                      <SelectItem value="Exportação" className="text-xs">Exportação</SelectItem>
                      <SelectItem value="Ambos" className="text-xs">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="regimeTributario"
              render={({ field }) => (
                <FormItem className="md:col-span-2 space-y-1">
                  <FormLabel className="text-xs">Regime Tributário</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sem Regime Tributário" className="text-xs">Sem Regime Tributário</SelectItem>
                      <SelectItem value="Simples Nacional" className="text-xs">Simples Nacional</SelectItem>
                      <SelectItem value="Lucro Presumido" className="text-xs">Lucro Presumido</SelectItem>
                      <SelectItem value="Lucro Real" className="text-xs">Lucro Real</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-3 gap-y-2">
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem className="md:col-span-1 space-y-1">
                  <FormLabel className="text-xs">CEP *</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-000" className="h-8 text-xs" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logradouro"
              render={({ field }) => (
                <FormItem className="md:col-span-2 space-y-1">
                  <FormLabel className="text-xs">Logradouro *</FormLabel>
                  <FormControl>
                    <Input className="h-8 text-xs" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem className="md:col-span-1 space-y-1">
                  <FormLabel className="text-xs">Número *</FormLabel>
                  <FormControl>
                    <Input className="h-8 text-xs" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="complemento"
              render={({ field }) => (
                <FormItem className="md:col-span-1 space-y-1">
                  <FormLabel className="text-xs">Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" className="h-8 text-xs" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => (
                <FormItem className="md:col-span-1 space-y-1">
                  <FormLabel className="text-xs">Bairro *</FormLabel>
                  <FormControl>
                    <Input className="h-8 text-xs" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem className="md:col-span-1 space-y-1">
                  <FormLabel className="text-xs">Cidade *</FormLabel>
                  <FormControl>
                    <Input className="h-8 text-xs" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uf"
              render={({ field }) => (
                <FormItem className="md:col-span-1 space-y-1">
                  <FormLabel className="text-xs">UF *</FormLabel>
                  <FormControl>
                    <Input maxLength={2} className="uppercase h-8 text-xs" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Outras Informações</h3>
          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormControl>
                  <Textarea 
                    placeholder="Observações adicionais (Opcional)..." 
                    className="resize-none min-h-[60px] text-xs py-2"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t mt-4">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" size="sm">
            {initialData?.id ? "Salvar Alterações" : "Cadastrar Empresa"}
          </Button>
        </div>
      </form>

      <Dialog open={isModalIAOpen} onOpenChange={setIsModalIAOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Empresas Encontradas (IA)
            </DialogTitle>
            <DialogDescription>
              Selecione a empresa correta para preencher os dados automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2 max-h-[350px] overflow-y-auto pr-2">
            {empresasIA.map((emp, i) => (
              <div 
                key={i} 
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => {
                  form.setValue("cnpj", emp.cnpj);
                  setIsModalIAOpen(false);
                  buscarCNPJ(emp.cnpj);
                }}
              >
                <div className="flex flex-col gap-1 pr-4">
                  <span className="font-semibold text-sm">{emp.nome}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {emp.cidade}
                  </span>
                </div>
                <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {emp.cnpj}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
