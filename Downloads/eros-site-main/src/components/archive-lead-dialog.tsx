import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ArchiveLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onConfirm: (reason: string) => Promise<void>;
}

export function ArchiveLeadDialog({ open, onOpenChange, lead, onConfirm }: ArchiveLeadDialogProps) {
  const [reason, setReason] = useState<string>("Sem interesse");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lead) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm(reason);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Arquivar Lead</DialogTitle>
          <DialogDescription>
            Por favor, selecione o motivo para arquivar o lead <strong>{lead.nome}</strong>. 
            Ele não aparecerá mais no funil principal de leads ativos.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <RadioGroup value={reason} onValueChange={setReason} className="flex flex-col gap-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Sem interesse" id="r1" />
              <Label htmlFor="r1" className="cursor-pointer">Sem interesse</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Sem resposta" id="r2" />
              <Label htmlFor="r2" className="cursor-pointer">Sem resposta</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Já tem sistema" id="r3" />
              <Label htmlFor="r3" className="cursor-pointer">Já tem sistema</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Arquivado (Outro)" id="r4" />
              <Label htmlFor="r4" className="cursor-pointer">Outro</Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            Confirmar Arquivamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
