import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Search, Building2, MapPin, FileText, Phone, Users, Plus, Trash2, ShieldCheck, Mail, FileBadge2 } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const docsFiscaisOpcoes = [
  { id: "nfe", label: "NF-e (Nota Fiscal Eletrônica)" },
  { id: "nfce", label: "NFC-e (Nota Fiscal de Consumidor)" },
  { id: "cte", label: "CT-e (Conhecimento de Transporte)" },
  { id: "mdfe", label: "MDF-e (Manifesto Eletrônico)" },
  { id: "nfse", label: "NFS-e (Nota Fiscal de Serviço)" },
];

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
        className="pr-8" 
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-9 w-9 p-0 absolute right-0 top-0 text-muted-foreground hover:bg-transparent" type="button" tabIndex={-1}>
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => { onChange(d); if(d) setInputValue(format(d, 'dd/MM/yyyy')); }}
            initialFocus
            captionLayout="dropdown"
            fromYear={1900}
            toYear={new Date().getFullYear() + 10}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const formSchema = z.object({
  id: z.string().optional(),
  cnpj: z.string().optional().or(z.literal('')),
  nome: z.string().min(2, "Razão social é obrigatória"),
  nomeFantasia: z.string().min(2, "Nome fantasia é obrigatório"),
  inscricaoEstadual: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  emailContador: z.string().email("E-mail inválido").optional().or(z.literal('')),
  
  // Legacy fields (optional to prevent breaks in Comercial)
  dataInicioOperacao: z.date().optional(),
  setorAtuacao: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.string().optional(),
  
  // Segmento
  segmento: z.string().optional(),
  citricolaTipo: z.string().optional(),
  
  // Dados Fiscais
  regimeTributario: z.string().optional(),
  certificadoAnexo: z.string().optional(), // Nome do arquivo
  certificadoBase64: z.string().optional(), // Arquivo em base64
  certificadoSenha: z.string().optional(), // Senha do certificado
  certificadoVencimento: z.date().optional(),
  documentosFiscais: z.array(z.string()).optional().default([]),
  
  // Usuários e Acessos
  funcionarios: z.array(z.object({
    nome: z.string().min(1, "Nome é obrigatório"),
    telefone: z.string().optional(),
    cargo: z.string().optional(),
    id_anydesk: z.string().optional(),
    senha_anydesk: z.string().optional(),
    id_rustdesk: z.string().optional(),
    senha_rustdesk: z.string().optional(),
  })).optional().default([]),
});

export type EmpresaFormValues = z.infer<typeof formSchema>;

interface EmpresaFormProps {
  initialData?: Partial<EmpresaFormValues>;
  onSubmit: (data: EmpresaFormValues) => void;
  onCancel?: () => void;
}

export function EmpresaForm({ initialData, onSubmit, onCancel }: EmpresaFormProps) {
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [activeTab, setActiveTab] = useState("empresa");

  const form = useForm<EmpresaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cnpj: "",
      nome: "",
      nomeFantasia: "",
      inscricaoEstadual: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
      telefone: "",
      email: "",
      emailContador: "",
      regimeTributario: "",
      certificadoAnexo: "",
      certificadoBase64: "",
      certificadoSenha: "",
      certificadoVencimento: undefined,
      documentosFiscais: [],
      funcionarios: [],
      segmento: "",
      citricolaTipo: "",
      ...initialData,
    },
  });

  const { fields: funcFields, append: funcAppend, remove: funcRemove } = useFieldArray({
    control: form.control,
    name: "funcionarios"
  });

  const handleCnpjSearch = async () => {
    const cnpjValue = form.getValues("cnpj")?.replace(/\D/g, '');
    if (!cnpjValue || cnpjValue.length !== 14) {
      toast.warning("Digite um CNPJ válido com 14 dígitos");
      return;
    }

    setIsFetchingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjValue}`);
      if (!response.ok) throw new Error('CNPJ não encontrado');
      
      const data = await response.json();
      
      form.setValue("nome", data.razao_social || "");
      form.setValue("nomeFantasia", data.nome_fantasia || data.razao_social || "");
      form.setValue("cep", data.cep || "");
      form.setValue("logradouro", data.logradouro || "");
      form.setValue("numero", data.numero || "");
      form.setValue("complemento", data.complemento || "");
      form.setValue("bairro", data.bairro || "");
      form.setValue("cidade", data.municipio || "");
      form.setValue("uf", data.uf || "");
      form.setValue("telefone", data.ddd_telefone_1 || "");
      
      toast.success("Dados preenchidos via Receita Federal!");
    } catch (error) {
      toast.error("Erro ao consultar CNPJ. Verifique se está correto.");
    } finally {
      setIsFetchingCnpj(false);
    }
  };

  const handleFormSubmit = (data: EmpresaFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col h-full bg-white dark:bg-slate-950">
        
        {/* TABS HEADER */}
        <div className="border-b px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-12 bg-transparent border-none p-0 gap-6">
              <TabsTrigger 
                value="empresa" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none px-0 py-3 data-[state=active]:bg-transparent"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Dados da Empresa
              </TabsTrigger>
              <TabsTrigger 
                value="fiscais" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none px-0 py-3 data-[state=active]:bg-transparent"
              >
                <FileBadge2 className="w-4 h-4 mr-2" />
                Dados Fiscais
              </TabsTrigger>
              <TabsTrigger 
                value="acessos" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none px-0 py-3 data-[state=active]:bg-transparent"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Usuários e Acessos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* TABS CONTENT - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-transparent">
          
          {/* ABA 1: EMPRESA */}
          <div className={cn("space-y-6", activeTab !== "empresa" && "hidden")}>
            
            {/* BUSCA CNPJ */}
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl mb-6">
              <div className="flex items-end gap-3 max-w-sm">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-primary font-semibold">Consultar CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} className="bg-white dark:bg-slate-900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="button" 
                  onClick={handleCnpjSearch} 
                  disabled={isFetchingCnpj}
                  className="w-12 px-0 shrink-0"
                >
                  {isFetchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="nomeFantasia" render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Nome Fantasia <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input placeholder="Nome conhecido" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Razão Social <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input placeholder="Razão Social LTDA" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="inscricaoEstadual" render={({ field }) => (
                <FormItem>
                  <FormLabel>Inscrição Estadual (IE)</FormLabel>
                  <FormControl><Input placeholder="ISENTO ou número" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="segmento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Segmento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione o segmento" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Comércio">Comércio</SelectItem>
                      <SelectItem value="Indústria">Indústria</SelectItem>
                      <SelectItem value="Citrícola">Citrícola</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              {form.watch("segmento") === "Citrícola" && (
                <FormField control={form.control} name="citricolaTipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Citrícola</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Exportação">Exportação</SelectItem>
                        <SelectItem value="Mercado">Mercado</SelectItem>
                        <SelectItem value="Ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>

            <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2 pt-2 border-t">
              <MapPin className="w-4 h-4" /> Endereço
            </h3>
            
            <div className="grid grid-cols-12 gap-4">
              <FormField control={form.control} name="cep" render={({ field }) => (
                <FormItem className="col-span-12 sm:col-span-4">
                  <FormLabel>CEP</FormLabel>
                  <FormControl><Input placeholder="00000-000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="logradouro" render={({ field }) => (
                <FormItem className="col-span-12 sm:col-span-8">
                  <FormLabel>Endereço</FormLabel>
                  <FormControl><Input placeholder="Rua, Avenida..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="numero" render={({ field }) => (
                <FormItem className="col-span-4 sm:col-span-3">
                  <FormLabel>Número</FormLabel>
                  <FormControl><Input placeholder="123" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="complemento" render={({ field }) => (
                <FormItem className="col-span-8 sm:col-span-4">
                  <FormLabel>Complemento</FormLabel>
                  <FormControl><Input placeholder="Sala, Apto..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="bairro" render={({ field }) => (
                <FormItem className="col-span-12 sm:col-span-5">
                  <FormLabel>Bairro</FormLabel>
                  <FormControl><Input placeholder="Centro" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cidade" render={({ field }) => (
                <FormItem className="col-span-8 sm:col-span-9">
                  <FormLabel>Cidade</FormLabel>
                  <FormControl><Input placeholder="Nome da cidade" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="uf" render={({ field }) => (
                <FormItem className="col-span-4 sm:col-span-3">
                  <FormLabel>UF</FormLabel>
                  <FormControl><Input placeholder="SP" maxLength={2} className="uppercase" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2 pt-2 border-t">
              <Phone className="w-4 h-4" /> Contato
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="telefone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone Principal</FormLabel>
                  <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail Principal</FormLabel>
                  <FormControl><Input type="email" placeholder="contato@empresa.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="emailContador" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>E-mail do Contador</FormLabel>
                  <FormControl><Input type="email" placeholder="contador@contabilidade.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>


          {/* ABA 2: DADOS FISCAIS */}
          <div className={cn("space-y-6 max-w-2xl", activeTab !== "fiscais" && "hidden")}>
            <div className="grid gap-6">
              <FormField control={form.control} name="regimeTributario" render={({ field }) => (
                <FormItem>
                  <FormLabel>Regime Tributário</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione o regime" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                      <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                      <SelectItem value="MEI">MEI (Microempreendedor Individual)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="p-4 border rounded-xl bg-white shadow-sm space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">Certificado Digital</h4>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-6 space-y-2">
                    <label className="text-sm font-medium">Arquivo do Certificado (.pfx, .p12)</label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept=".pfx,.p12"
                        className="cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            form.setValue("certificadoAnexo", file.name);
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const b64 = ev.target?.result as string;
                              form.setValue("certificadoBase64", b64);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            form.setValue("certificadoAnexo", "");
                            form.setValue("certificadoBase64", "");
                          }
                        }} 
                      />
                      {form.watch("certificadoBase64") && (
                        <Button 
                          type="button" 
                          variant="outline"
                          title="Exportar Certificado"
                          onClick={() => {
                            const b64 = form.getValues("certificadoBase64");
                            const name = form.getValues("certificadoAnexo") || "certificado.pfx";
                            if (b64) {
                              const a = document.createElement('a');
                              a.href = b64;
                              a.download = name;
                              a.click();
                            }
                          }}
                        >
                          Baixar
                        </Button>
                      )}
                    </div>
                    {form.watch("certificadoAnexo") && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Anexado: {form.watch("certificadoAnexo")}
                      </p>
                    )}
                  </div>

                  <FormField control={form.control} name="certificadoSenha" render={({ field }) => (
                    <FormItem className="col-span-6 md:col-span-3">
                      <FormLabel>Senha</FormLabel>
                      <FormControl><Input type="password" placeholder="***" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="certificadoVencimento" render={({ field }) => (
                    <FormItem className="col-span-6 md:col-span-3 flex flex-col">
                      <FormLabel>Data Vencimento</FormLabel>
                      <DatePickerInput value={field.value} onChange={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="p-4 border rounded-xl bg-white shadow-sm space-y-4">
                <h4 className="font-semibold text-sm">Quais documentos fiscais emite no Eros?</h4>
                <FormField control={form.control} name="documentosFiscais" render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {docsFiscaisOpcoes.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="documentosFiscais"
                          render={({ field }) => {
                            return (
                              <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item.id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== item.id)
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm cursor-pointer w-full h-full pt-0.5">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </FormItem>
                )} />
              </div>
            </div>
          </div>


          {/* ABA 3: USUÁRIOS E ACESSOS */}
          <div className={cn("space-y-6", activeTab !== "acessos" && "hidden")}>
            <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border">
              <div>
                <h3 className="font-semibold">Lista de Usuários/Acessos Remotos</h3>
                <p className="text-xs text-muted-foreground">Adicione os funcionários do cliente e as credenciais de AnyDesk/RustDesk.</p>
              </div>
              <Button 
                type="button" 
                size="sm" 
                onClick={() => funcAppend({ nome: "", telefone: "", cargo: "", id_anydesk: "", senha_anydesk: "", id_rustdesk: "", senha_rustdesk: "" })}
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> Adicionar Usuário
              </Button>
            </div>

            {funcFields.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-xl bg-white text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>Nenhum usuário cadastrado ainda.</p>
              </div>
            )}

            <div className="space-y-4">
              {funcFields.map((field, index) => (
                <div key={field.id} className="border rounded-xl p-4 bg-white shadow-sm relative group">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => funcRemove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  <div className="grid grid-cols-12 gap-4">
                    <FormField control={form.control} name={`funcionarios.${index}.nome` as any} render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-4">
                        <FormLabel>Nome do Usuário</FormLabel>
                        <FormControl><Input placeholder="Ex: João Silva" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`funcionarios.${index}.cargo` as any} render={({ field }) => (
                      <FormItem className="col-span-6 md:col-span-4">
                        <FormLabel>Cargo / Setor</FormLabel>
                        <FormControl><Input placeholder="Ex: Financeiro" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`funcionarios.${index}.telefone` as any} render={({ field }) => (
                      <FormItem className="col-span-6 md:col-span-4">
                        <FormLabel>Telefone / WhatsApp</FormLabel>
                        <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                      </FormItem>
                    )} />

                    {/* ACESSOS */}
                    <div className="col-span-12 grid grid-cols-4 gap-4 pt-3 border-t mt-1">
                      <FormField control={form.control} name={`funcionarios.${index}.id_anydesk` as any} render={({ field }) => (
                        <FormItem className="col-span-2 md:col-span-1">
                          <FormLabel className="text-xs text-red-600 font-bold">ID AnyDesk</FormLabel>
                          <FormControl><Input placeholder="000 000 000" className="h-8" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`funcionarios.${index}.senha_anydesk` as any} render={({ field }) => (
                        <FormItem className="col-span-2 md:col-span-1">
                          <FormLabel className="text-xs text-red-600 font-bold">Senha AnyDesk</FormLabel>
                          <FormControl><Input placeholder="***" className="h-8" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`funcionarios.${index}.id_rustdesk` as any} render={({ field }) => (
                        <FormItem className="col-span-2 md:col-span-1">
                          <FormLabel className="text-xs text-blue-600 font-bold">ID RustDesk</FormLabel>
                          <FormControl><Input placeholder="000 000 000" className="h-8" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`funcionarios.${index}.senha_rustdesk` as any} render={({ field }) => (
                        <FormItem className="col-span-2 md:col-span-1">
                          <FormLabel className="text-xs text-blue-600 font-bold">Senha RustDesk</FormLabel>
                          <FormControl><Input placeholder="***" className="h-8" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* FOOTER - ALWAYS VISIBLE */}
        <div className="border-t p-4 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2 shrink-0">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit">
            Salvar Cadastro
          </Button>
        </div>

      </form>
    </Form>
  );
}
