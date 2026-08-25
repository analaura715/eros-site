import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmpresaForm, EmpresaFormValues } from '@/components/forms/empresa-form';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onSuccess: () => void;
}

export function ConvertLeadDialog({ open, onOpenChange, lead, onSuccess }: ConvertLeadDialogProps) {
  if (!lead) return null;

  const initialData: Partial<EmpresaFormValues> = {
    nome: lead.nome,
    nomeFantasia: lead.nome_fantasia || lead.nome,
    cnpj: lead.cnpj || '',
    inscricaoEstadual: lead.inscricao_estadual || '',
    cep: lead.cep || '',
    logradouro: lead.logradouro || '',
    numero: lead.numero || '',
    complemento: lead.complemento || '',
    bairro: lead.bairro || '',
    cidade: lead.cidade ? lead.cidade.split(' - ')[0] : '',
    uf: lead.uf || 'SP',
    telefone: lead.telefone || '',
    email: lead.email || '',
    segmento: lead.segmento || '',
    observacoes: lead.observacoes || '',
    dataInicioOperacao: lead.data_inicio_operacao ? new Date(lead.data_inicio_operacao) : undefined,
    status: 'Em Negociação',
  };

  const handleConvertSubmit = async (data: EmpresaFormValues) => {
    // 1. Create Empresa
    const payload = {
      cnpj: data.cnpj,
      nome: data.nome,
      nome_fantasia: data.nomeFantasia,
      inscricao_estadual: data.inscricaoEstadual,
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
      segmento: data.segmento,
      observacoes: [
        data.observacoes,
        data.emailContador ? `Email Contador: ${data.emailContador}` : '',
        data.setorAtuacao ? `Setor: ${data.setorAtuacao}` : '',
        data.citricolaTipo ? `Tipo (Citricola): ${data.citricolaTipo}` : ''
      ].filter(Boolean).join('\n'),
      status: 'Ativo' // Ao converter, já nasce ativa na implantação?
    };

    const { data: novaEmpresa, error: errEmpresa } = await supabase.from('empresas').insert([payload]).select('id').single();
    
    if (errEmpresa) { 
      toast.error("Erro ao converter em empresa."); 
      console.error(errEmpresa);
      return; 
    }
    
    // 2. Create Implantacao
    const { error: errImpl } = await supabase.from('implantacoes').insert([{
       empresa_id: novaEmpresa.id,
       status: 'Não Iniciada'
    }]);

    if (errImpl) {
      console.error(errImpl);
      toast.error("Empresa criada, mas houve um erro ao iniciar a implantação.");
    }
    
    // 3. Update Lead
    await supabase.from('leads').update({ status: 'Convertido' }).eq('id', lead.id);
    
    toast.success("Lead convertido em empresa e enviado para Implantação!");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 h-[85vh] flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-white dark:bg-slate-950 shrink-0">
          <DialogTitle>Converter Lead em Empresa</DialogTitle>
          <DialogDescription>
            Confirme e preencha os dados abaixo para transformar o lead <strong>{lead.nome}</strong> em uma empresa ativa e iniciar sua implantação.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <EmpresaForm 
            initialData={initialData} 
            onSubmit={handleConvertSubmit} 
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
