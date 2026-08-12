import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import type { Meeting, MeetingType } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meeting?: Meeting;
  defaultProspectId?: string;
  defaultDate?: string; // YYYY-MM-DD
}

export function MeetingDialog({ open, onOpenChange, meeting, defaultProspectId, defaultDate }: Props) {
  const { state, addMeeting, updateMeeting, deleteMeeting, auth } = useStore();

  const init = () => {
    const d = defaultDate ? new Date(defaultDate) : new Date();
    d.setHours(10, 0, 0, 0);
    return {
      prospectId: defaultProspectId ?? state.prospects[0]?.id ?? "",
      title: "",
      type: "video" as MeetingType,
      link: "",
      start: d.toISOString().slice(0, 16),
      durationMin: 30,
      reminder: true,
      notes: "",
      ownerId: auth?.id ?? state.users[0]?.id ?? "",
      status: "scheduled" as Meeting["status"],
    };
  };
  const [form, setForm] = useState(init);

  useEffect(() => {
    if (meeting) {
      setForm({
        prospectId: meeting.prospectId,
        title: meeting.title,
        type: meeting.type,
        link: meeting.link,
        start: meeting.start.slice(0, 16),
        durationMin: meeting.durationMin,
        reminder: meeting.reminder,
        notes: meeting.notes,
        ownerId: meeting.ownerId,
        status: meeting.status,
      });
    } else if (open) {
      setForm(init());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting, open, defaultProspectId, defaultDate]);

  const submit = () => {
    if (!form.title || !form.prospectId) {
      toast.error("Title and prospect required.");
      return;
    }
    const payload = { ...form, start: new Date(form.start).toISOString(), durationMin: Number(form.durationMin) };
    if (meeting) {
      updateMeeting(meeting.id, payload);
      toast.success("Meeting updated");
    } else {
      addMeeting(payload);
      toast.success("Meeting scheduled");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{meeting ? "Meeting details" : "Schedule new meeting"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Title / subject</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Prospect</Label>
            <Select value={form.prospectId} onValueChange={(v) => setForm({ ...form, prospectId: v })}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {state.prospects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.company} — {p.contactName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date & time</Label>
            <Input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </div>
          <div>
            <Label>Duration (min)</Label>
            <Input type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as MeetingType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video call</SelectItem>
                <SelectItem value="phone">Phone call</SelectItem>
                <SelectItem value="in_person">In person</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Meeting["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Meeting link / location</Label>
            <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://meet.google.com/..." />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Send reminder</div>
              <div className="text-xs text-muted-foreground">Email/notification before meeting</div>
            </div>
            <Switch checked={form.reminder} onCheckedChange={(v) => setForm({ ...form, reminder: v })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          {meeting && (
            <Button
              variant="destructive"
              onClick={() => {
                deleteMeeting(meeting.id);
                toast.success("Meeting removed");
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit}>{meeting ? "Save" : "Schedule"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
