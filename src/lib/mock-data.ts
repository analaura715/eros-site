import type { Prospect, Meeting, User, Note, Opportunity, HistoryEvent, GoalSettings } from "./types";

export const MOCK_USERS: User[] = [
  { id: "u1", name: "Alex Morgan", email: "alex@acme.io", avatar: "AM", role: "Sales Lead", timezone: "America/Sao_Paulo" },
  { id: "u2", name: "Priya Shah", email: "priya@acme.io", avatar: "PS", role: "AE", timezone: "America/Sao_Paulo" },
  { id: "u3", name: "Diego Vargas", email: "diego@acme.io", avatar: "DV", role: "SDR", timezone: "America/Sao_Paulo" },
  { id: "u4", name: "Sam Chen", email: "sam@acme.io", avatar: "SC", role: "AE", timezone: "America/Sao_Paulo" },
];

const today = new Date();
const iso = (d: Date) => d.toISOString();
const addDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
};
const at = (n: number, h: number, m = 0) => {
  const d = addDays(n);
  d.setHours(h, m, 0, 0);
  return d;
};

export const MOCK_PROSPECTS: Prospect[] = [
  { id: "p1", company: "Northwind Robotics", contactName: "Emma Larsen", email: "emma@northwind.co", phone: "+14155550110", status: "meeting_scheduled", priority: "high", ownerId: "u1", nextContact: iso(addDays(1)), value: 24000, createdAt: iso(addDays(-14)) },
  { id: "p2", company: "Helix Biotech", contactName: "Rahul Menon", email: "rahul@helixbio.com", phone: "+442071838750", status: "in_contact", priority: "high", ownerId: "u2", nextContact: iso(addDays(2)), value: 48000, createdAt: iso(addDays(-30)) },
  { id: "p3", company: "Solstice Media", contactName: "Nora Kim", email: "nora@solstice.tv", phone: "+16475550142", status: "new", priority: "medium", ownerId: "u3", nextContact: iso(addDays(3)), value: 12000, createdAt: iso(addDays(-4)) },
  { id: "p4", company: "Beacon Freight", contactName: "Marco Bianchi", email: "marco@beaconfr.com", phone: "+390255558877", status: "proposal_sent", priority: "high", ownerId: "u1", nextContact: iso(addDays(0)), value: 82000, createdAt: iso(addDays(-45)) },
  { id: "p5", company: "Verdant Farms", contactName: "Aisha Osei", email: "aisha@verdant.ag", phone: "+2348034451122", status: "attempted", priority: "medium", ownerId: "u4", nextContact: iso(addDays(5)), value: 9000, createdAt: iso(addDays(-9)) },
  { id: "p6", company: "Quantum Ledger", contactName: "Yuki Tanaka", email: "yuki@qledger.io", phone: "+81345678910", status: "closed_won", priority: "high", ownerId: "u2", nextContact: iso(addDays(30)), value: 156000, createdAt: iso(addDays(-90)) },
  { id: "p7", company: "Alpine Outfitters", contactName: "Lena Fischer", email: "lena@alpine.gear", phone: "+41442771122", status: "closed_lost", priority: "low", ownerId: "u3", nextContact: iso(addDays(60)), value: 0, createdAt: iso(addDays(-120)) },
  { id: "p8", company: "Copper Analytics", contactName: "Jamal Turner", email: "jamal@copperanalytics.com", phone: "+12125550188", status: "meeting_scheduled", priority: "medium", ownerId: "u1", nextContact: iso(addDays(1)), value: 36000, createdAt: iso(addDays(-20)) },
  { id: "p9", company: "Lumen Health", contactName: "Sofia Ramirez", email: "sofia@lumenhealth.co", phone: "+34911223344", status: "in_contact", priority: "low", ownerId: "u4", nextContact: iso(addDays(7)), value: 18000, createdAt: iso(addDays(-11)) },
  { id: "p10", company: "Halcyon Studios", contactName: "Theo Wright", email: "theo@halcyon.games", phone: "+61292234567", status: "new", priority: "high", ownerId: "u2", nextContact: iso(addDays(4)), value: 27000, createdAt: iso(addDays(-2)) },
];

export const MOCK_NOTES: Note[] = [
  { id: "n1", prospectId: "p1", authorId: "u1", type: "call", body: "Ligou para Emma — apresentou preços e MSA. Ela vai envolver o procurement.", createdAt: iso(addDays(-3)) },
  { id: "n2", prospectId: "p1", authorId: "u1", type: "email", body: "Enviou e-mail de follow-up com whitepaper de segurança.", createdAt: iso(addDays(-2)) },
  { id: "n3", prospectId: "p2", authorId: "u2", type: "note", body: "Rahul é o champion. O decisor real é o CFO — focar na próxima demo.", createdAt: iso(addDays(-6)) },
  { id: "n4", prospectId: "p4", authorId: "u1", type: "email", body: "Proposta enviada. Validade de 30 dias. Follow-up na quinta.", createdAt: iso(addDays(-4)) },
  { id: "n5", prospectId: "p6", authorId: "u2", type: "note", body: "Negócio fechado. Kickoff agendado com CS na próxima semana.", createdAt: iso(addDays(-1)) },
];

export const MOCK_MEETINGS: Meeting[] = [
  { id: "m1", prospectId: "p1", ownerId: "u1", title: "Discovery Call — Northwind", type: "video", link: "https://meet.google.com/abc-defg-hij", start: iso(at(0, 10, 0)), durationMin: 30, status: "scheduled", reminder: true, notes: "Focar nos timelines de integração.", description: "Primeira reunião de descoberta de necessidades." },
  { id: "m2", prospectId: "p8", ownerId: "u1", title: "Demo — Copper Analytics", type: "video", link: "https://zoom.us/j/8877665544", start: iso(at(0, 14, 30)), durationMin: 45, status: "scheduled", reminder: true, notes: "", description: "Demonstração completa da plataforma." },
  { id: "m3", prospectId: "p2", ownerId: "u2", title: "Revisão de Preços — Helix", type: "phone", link: "", start: iso(at(1, 11, 0)), durationMin: 30, status: "scheduled", reminder: false, notes: "", description: "Discussão sobre condições comerciais." },
  { id: "m4", prospectId: "p4", ownerId: "u1", title: "Apresentação da Proposta — Beacon", type: "in_person", link: "Beacon HQ, Milão", start: iso(at(2, 9, 30)), durationMin: 60, status: "scheduled", reminder: true, notes: "Trazer proposta impressa.", description: "Walkthrough completo da proposta comercial." },
  { id: "m5", prospectId: "p3", ownerId: "u3", title: "Intro — Solstice Media", type: "video", link: "https://meet.google.com/xyz-1234-abc", start: iso(at(3, 15, 0)), durationMin: 30, status: "scheduled", reminder: true, notes: "", description: "Primeira apresentação da empresa." },
  { id: "m6", prospectId: "p6", ownerId: "u2", title: "Assinatura de Contrato — Quantum", type: "video", link: "https://zoom.us/j/1122334455", start: iso(at(-2, 13, 0)), durationMin: 45, status: "completed", reminder: false, notes: "Assinado. Ótima reunião.", description: "Formalização do contrato." },
  { id: "m7", prospectId: "p9", ownerId: "u4", title: "Discovery — Lumen Health", type: "phone", link: "", start: iso(at(5, 10, 30)), durationMin: 30, status: "scheduled", reminder: true, notes: "", description: "Entender necessidades de saúde digital." },
];

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: "o1", prospectId: "p1", ownerId: "u1", title: "Northwind — Automação Robótica", stage: "demonstracao", value: 24000, probability: 60, expectedCloseDate: iso(addDays(30)), createdAt: iso(addDays(-14)), updatedAt: iso(addDays(-3)) },
  { id: "o2", prospectId: "p2", ownerId: "u2", title: "Helix — Plataforma de Pesquisa", stage: "proposta", value: 48000, probability: 75, expectedCloseDate: iso(addDays(15)), createdAt: iso(addDays(-30)), updatedAt: iso(addDays(-5)) },
  { id: "o3", prospectId: "p4", ownerId: "u1", title: "Beacon — Gestão de Frota", stage: "negociacao", value: 82000, probability: 85, expectedCloseDate: iso(addDays(7)), createdAt: iso(addDays(-45)), updatedAt: iso(addDays(-1)) },
  { id: "o4", prospectId: "p6", ownerId: "u2", title: "Quantum — Ledger Corporativo", stage: "fechado_ganho", value: 156000, probability: 100, expectedCloseDate: iso(addDays(-2)), createdAt: iso(addDays(-90)), updatedAt: iso(addDays(-2)) },
  { id: "o5", prospectId: "p7", ownerId: "u3", title: "Alpine — E-commerce", stage: "fechado_perdido", value: 0, probability: 0, expectedCloseDate: iso(addDays(-30)), createdAt: iso(addDays(-120)), updatedAt: iso(addDays(-30)), lostReason: "Optou por concorrente" },
  { id: "o6", prospectId: "p8", ownerId: "u1", title: "Copper — Analytics Dashboard", stage: "demonstracao", value: 36000, probability: 50, expectedCloseDate: iso(addDays(20)), createdAt: iso(addDays(-20)), updatedAt: iso(addDays(-2)) },
  { id: "o7", prospectId: "p9", ownerId: "u4", title: "Lumen — Portal do Paciente", stage: "qualificacao", value: 18000, probability: 30, expectedCloseDate: iso(addDays(45)), createdAt: iso(addDays(-11)), updatedAt: iso(addDays(-7)) },
  { id: "o8", prospectId: "p10", ownerId: "u2", title: "Halcyon — Plataforma de Games", stage: "qualificacao", value: 27000, probability: 25, expectedCloseDate: iso(addDays(60)), createdAt: iso(addDays(-2)), updatedAt: iso(addDays(-1)) },
];

export const MOCK_HISTORY_EVENTS: HistoryEvent[] = [
  { id: "h1", prospectId: "p1", authorId: "u1", type: "status_change", title: "Status atualizado", description: "Status alterado de 'Novo' para 'Em Contato'", createdAt: iso(addDays(-14)) },
  { id: "h2", prospectId: "p1", authorId: "u1", type: "call_logged", title: "Ligação registrada", description: "Apresentou preços e MSA. Procurement será envolvido.", createdAt: iso(addDays(-3)) },
  { id: "h3", prospectId: "p1", authorId: "u1", type: "email_sent", title: "E-mail enviado", description: "Follow-up com whitepaper de segurança.", createdAt: iso(addDays(-2)) },
  { id: "h4", prospectId: "p1", authorId: "u1", type: "meeting_scheduled", title: "Reunião agendada", description: "Discovery Call agendada para hoje às 10h.", createdAt: iso(addDays(-1)) },
  { id: "h5", prospectId: "p2", authorId: "u2", type: "status_change", title: "Status atualizado", description: "Status alterado de 'Novo' para 'Em Contato'", createdAt: iso(addDays(-30)) },
  { id: "h6", prospectId: "p2", authorId: "u2", type: "note_added", title: "Nota adicionada", description: "Rahul é champion. Decisor real é o CFO.", createdAt: iso(addDays(-6)) },
  { id: "h7", prospectId: "p4", authorId: "u1", type: "proposal_sent", title: "Proposta enviada", description: "Proposta de R$ 82.000 enviada. Validade 30 dias.", createdAt: iso(addDays(-4)) },
  { id: "h8", prospectId: "p6", authorId: "u2", type: "meeting_completed", title: "Reunião realizada", description: "Contrato assinado. Kickoff agendado.", createdAt: iso(addDays(-2)) },
  { id: "h9", prospectId: "p6", authorId: "u2", type: "deal_won", title: "Negócio fechado!", description: "Contrato de R$ 156.000 assinado com Quantum Ledger.", createdAt: iso(addDays(-2)) },
  { id: "h10", prospectId: "p7", authorId: "u3", type: "deal_lost", title: "Negócio perdido", description: "Alpine optou por concorrente. Perda de R$ 0 estimado.", createdAt: iso(addDays(-30)) },
  { id: "h11", prospectId: "p3", authorId: "u3", type: "opportunity_created", title: "Oportunidade criada", description: "Nova oportunidade criada para Solstice Media.", createdAt: iso(addDays(-4)) },
  { id: "h12", prospectId: "p8", authorId: "u1", type: "meeting_scheduled", title: "Demo agendada", description: "Demonstração completa agendada para hoje às 14h30.", createdAt: iso(addDays(-1)) },
];

export const MOCK_GOAL: GoalSettings = {
  quantity: 5,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  label: "Clientes Novos",
};
