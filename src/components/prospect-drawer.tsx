import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, userById } from "@/lib/store";
import { PIPELINE_STAGES, PRIORITY_META, MEETING_STATUS_META } from "@/lib/types";
import type { Prospect } from "@/lib/types";
import { waLink } from "@/lib/csv";
import { Mail, MessageCircle, Pencil, Phone, Trash2, CalendarPlus } from "lucide-react";
import { ProspectDialog } from "./prospect-dialog";
import { MeetingDialog } from "./meeting-dialog";
import { toast } from "sonner";

interface Props {
  prospect: Prospect | null;
  onOpenChange: (v: boolean) => void;
}

export function ProspectDrawer({ prospect, onOpenChange }: Props) {
  const { state, addNote, auth, deleteProspect } = useStore();
  const [noteBody, setNoteBody] = useState("");
  const [noteType, setNoteType] = useState<"note" | "call" | "email">("note");
  const [editOpen, setEditOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);

  const p = prospect;
  const owner = p ? userById(state.users, p.ownerId) : undefined;
  const notes = p ? state.notes.filter((n) => n.prospectId === p.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  const meetings = p ? state.meetings.filter((m) => m.prospectId === p.id).sort((a, b) => b.start.localeCompare(a.start)) : [];

  const stage = p ? PIPELINE_STAGES.find((s) => s.key === p.status) : undefined;

  return (
    <>
      <Sheet open={!!p} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          {p && (
            <>
              <SheetHeader className="border-b p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <SheetTitle className="text-xl">{p.company}</SheetTitle>
                    <div className="mt-1 text-sm text-muted-foreground">{p.contactName}</div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {stage && <Badge className={`${stage.color} text-white border-transparent`}>{stage.label}</Badge>}
                      <Badge variant="outline" className={PRIORITY_META[p.priority].class}>{PRIORITY_META[p.priority].label} priority</Badge>
                      <Badge variant="secondary">${p.value.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditOpen(true)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { deleteProspect(p.id); toast.success("Prospect removed"); onOpenChange(false); }} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </SheetHeader>

              <div className="grid gap-4 p-6">
                <div className="rounded-lg border p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a className="hover:underline" href={`mailto:${p.email}`}>{p.email}</a></div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><a className="hover:underline" href={`tel:${p.phone}`}>{p.phone}</a></div>
                  <div className="flex items-center gap-2 text-muted-foreground">Owner: {owner && <span className="inline-flex items-center gap-1.5 text-foreground"><Avatar className="h-5 w-5"><AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{owner.avatar}</AvatarFallback></Avatar>{owner.name}</span>}</div>
                  <div className="flex items-center gap-2 text-muted-foreground">Next contact: <span className="text-foreground">{new Date(p.nextContact).toLocaleDateString()}</span></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm"><a href={waLink(p.phone, `Hi ${p.contactName.split(" ")[0]}, this is ${auth?.name ?? "our team"} from Acme.`)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a></Button>
                  <Button variant="outline" size="sm" onClick={() => setMeetingOpen(true)}><CalendarPlus className="h-4 w-4" /> Schedule meeting</Button>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Add interaction</h3>
                  <div className="rounded-lg border p-3 space-y-2">
                    <Select value={noteType} onValueChange={(v) => setNoteType(v as "note")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">Internal note</SelectItem>
                        <SelectItem value="call">Call log</SelectItem>
                        <SelectItem value="email">Email log</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea rows={3} placeholder="Write a quick update..." value={noteBody} onChange={(e) => setNoteBody(e.target.value)} />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => { if (!noteBody.trim()) return; addNote({ prospectId: p.id, authorId: auth?.id ?? "u1", type: noteType, body: noteBody.trim() }); setNoteBody(""); toast.success("Added"); }}>Add</Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Timeline</h3>
                  <ol className="relative border-l pl-4 space-y-3">
                    {notes.length === 0 && <div className="text-sm text-muted-foreground">No activity yet.</div>}
                    {notes.map((n) => {
                      const author = userById(state.users, n.authorId);
                      return (
                        <li key={n.id} className="relative">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="capitalize">{n.type}</Badge>
                            <span>{author?.name}</span>
                            <span>·</span>
                            <span>{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="mt-1 text-sm">{n.body}</p>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Meetings</h3>
                  <div className="space-y-2">
                    {meetings.length === 0 && <div className="text-sm text-muted-foreground">No meetings scheduled.</div>}
                    {meetings.map((m) => (
                      <div key={m.id} className="rounded-md border p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{m.title}</div>
                          <Badge variant="outline" className={MEETING_STATUS_META[m.status].class}>{MEETING_STATUS_META[m.status].label}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{new Date(m.start).toLocaleString()} · {m.durationMin}m</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      {p && <ProspectDialog open={editOpen} onOpenChange={setEditOpen} prospect={p} />}
      {p && <MeetingDialog open={meetingOpen} onOpenChange={setMeetingOpen} defaultProspectId={p.id} />}
    </>
  );
}
