import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import type { PipelineStatus, Priority, Prospect } from "@/lib/types";
import { PIPELINE_STAGES } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prospect?: Prospect;
}

const empty = {
  company: "",
  contactName: "",
  email: "",
  phone: "",
  status: "new" as PipelineStatus,
  priority: "medium" as Priority,
  ownerId: "",
  nextContact: new Date().toISOString().slice(0, 10),
  value: 0,
};

export function ProspectDialog({ open, onOpenChange, prospect }: Props) {
  const { state, addProspect, updateProspect, auth } = useStore();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (prospect) {
      setForm({
        company: prospect.company,
        contactName: prospect.contactName,
        email: prospect.email,
        phone: prospect.phone,
        status: prospect.status,
        priority: prospect.priority,
        ownerId: prospect.ownerId,
        nextContact: prospect.nextContact.slice(0, 10),
        value: prospect.value,
      });
    } else if (open) {
      setForm({ ...empty, ownerId: auth?.id ?? state.users[0]?.id ?? "" });
    }
  }, [prospect, open, auth, state.users]);

  const submit = () => {
    if (!form.company || !form.contactName || !form.email) {
      toast.error("Company, contact, and email are required.");
      return;
    }
    const payload = { ...form, nextContact: new Date(form.nextContact).toISOString(), value: Number(form.value) || 0 };
    if (prospect) {
      updateProspect(prospect.id, payload);
      toast.success("Prospect updated");
    } else {
      addProspect(payload);
      toast.success("Prospect added");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{prospect ? "Edit prospect" : "Add new prospect"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Company</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div>
            <Label>Contact name</Label>
            <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Phone / WhatsApp</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1..." />
          </div>
          <div>
            <Label>Deal value ($)</Label>
            <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Pipeline stage</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PipelineStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Owner</Label>
            <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
              <SelectTrigger><SelectValue placeholder="Assign to..." /></SelectTrigger>
              <SelectContent>
                {state.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Next contact</Label>
            <Input type="date" value={form.nextContact} onChange={(e) => setForm({ ...form, nextContact: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{prospect ? "Save" : "Add prospect"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
