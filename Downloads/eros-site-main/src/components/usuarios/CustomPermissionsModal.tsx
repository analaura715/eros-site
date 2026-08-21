import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CustomPermissionsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

// Simulando módulos do sistema
const SYSTEM_MODULES = [
  { id: 'crm', name: 'CRM (Leads e Pipeline)' },
  { id: 'suporte', name: 'Suporte e Chamados' },
  { id: 'financeiro', name: 'Financeiro' },
  { id: 'usuarios', name: 'Gestão de Usuários' },
  { id: 'configuracoes', name: 'Configurações' },
];

export function CustomPermissionsModal({ user, isOpen, onClose }: CustomPermissionsModalProps) {
  // Simulando estado de permissões customizadas (module_id -> access_level)
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handlePermissionChange = (moduleId: string, value: string) => {
    setPermissions(prev => ({ ...prev, [moduleId]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Aqui seria a chamada ao Supabase: 
    // supabase.from('user_custom_permissions').upsert(...)
    
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Permissões atualizadas com sucesso!");
      onClose();
    }, 600);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Permissões Avançadas: {user.name}</DialogTitle>
          <DialogDescription>
            Defina acessos granulares para este usuário. Estas configurações sobrescrevem as permissões do cargo ({user.role}).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-muted-foreground pb-2 border-b">
            <div className="col-span-6">Módulo do Sistema</div>
            <div className="col-span-6">Nível de Acesso</div>
          </div>

          {SYSTEM_MODULES.map((module) => (
            <div key={module.id} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-6 text-sm font-medium">
                {module.name}
              </div>
              <div className="col-span-6">
                <Select 
                  value={permissions[module.id] || "herdar"} 
                  onValueChange={(val) => handlePermissionChange(module.id, val)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione o acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="herdar">Herdar do Cargo (Padrão)</SelectItem>
                    <SelectItem value="liberado">Liberar / Total</SelectItem>
                    <SelectItem value="somente_leitura">Somente Leitura</SelectItem>
                    <SelectItem value="oculto">Oculto / Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
