import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert, KeyRound, Loader2 } from 'lucide-react';
import { PermissionsService } from '@/lib/services/permissionsService';
import { toast } from 'sonner';

interface SuperAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string; // The current logged in user ID
  onSuccess: () => void;
  actionDescription?: string;
}

export function SuperAdminModal({ open, onOpenChange, userId, onSuccess, actionDescription }: SuperAdminModalProps) {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) {
      toast.error('Informe a senha do supervisor.');
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await PermissionsService.validateSupervisorPassword(userId, password);
      if (isValid) {
        toast.success('Autorização concedida.');
        onSuccess();
        onOpenChange(false);
        setPassword('');
      } else {
        toast.error('Senha incorreta. Ação negada.');
      }
    } catch (err) {
      toast.error('Erro ao verificar autorização.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">Autorização Necessária</DialogTitle>
          <DialogDescription className="text-center pt-2">
            A ação <strong className="text-foreground">{actionDescription || 'solicitada'}</strong> exige privilégios de Supervisor.
            Informe a senha ADM para prosseguir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4 py-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Senha ADM / PIN"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 text-center text-lg tracking-widest h-12 font-mono"
              autoFocus
            />
          </div>
          <DialogFooter className="sm:justify-center flex-col gap-2 sm:space-x-0 mt-6">
            <Button 
              type="submit" 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-sm h-11"
              disabled={isVerifying || !password}
            >
              {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Autorizar Ação'}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full h-11"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
