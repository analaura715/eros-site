import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import {
  Loader2, KeyRound, Copy, CheckCircle2, Clock, Plus, User, Users,
  ShieldAlert, Trash2, Link as LinkIcon, Eye, Pencil, Ban, Shield,
  UserCheck, Calendar, Activity, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_comercial/convites")({
  component: ConvitesPage,
});

/* ── Apenas 2 níveis de acesso ─────────────────────────────────────── */
const NIVEIS_ACESSO = [
  { value: "Padrão",         label: "Usuário Padrão" },
  { value: "Suporte",        label: "Usuário de Suporte" },
  { value: "Comercial",      label: "Usuário Comercial" },
  { value: "Financeiro",     label: "Usuário Financeiro" },
  { value: "Administrador",  label: "Usuário Administrador" },
];

function labelNivel(cargo: string) {
  if (cargo === "Administrador") return "Usuário Administrador";
  if (cargo === "Suporte") return "Usuário de Suporte";
  if (cargo === "Comercial") return "Usuário Comercial";
  if (cargo === "Financeiro") return "Usuário Financeiro";
  return "Usuário Padrão";
}

/* ── Tipos internos ─────────────────────────────────────────────────── */
interface UsuarioRow {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  status?: string;
  criado_em: string;
  ultimo_acesso?: string;
  telefone?: string;
}

interface ConviteRow {
  id: string;
  chave: string;
  cargo: string;
  expira_em: string;
  criado_em: string;
  usado_em?: string;
}

/* ══════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════════════════ */
function ConvitesPage() {
  const { auth } = useStore();

  /* ── Estado de dados ── */
  const [convites, setConvites]             = useState<ConviteRow[]>([]);
  const [usuarios, setUsuarios]             = useState<UsuarioRow[]>([]);
  const [loadingConvites, setLoadingConvites] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  /* ── Formulário de geração ── */
  const [cargo, setCargo]                   = useState("Padrão");
  const [validadeHoras, setValidadeHoras]   = useState("24");
  const [generating, setGenerating]         = useState(false);

  /* ── Modais de usuário ── */
  const [viewUser,   setViewUser]   = useState<UsuarioRow | null>(null);
  const [editUser,   setEditUser]   = useState<UsuarioRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UsuarioRow | null>(null);

  /* ── Modal de chave gerada ── */
  const [novaChaveModal, setNovaChaveModal] = useState<ConviteRow | null>(null);

  /* ── Estados de loading por linha ── */
  const [updatingId,  setUpdatingId]  = useState<string | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [revokingId,  setRevokingId]  = useState<string | null>(null);

  /* ── Formulário de edição ── */
  const [editForm, setEditForm] = useState({
    nome: "", email: "", cargo: "Padrão", status: "Ativo",
  });

  /* ─────────────────────── FETCH ─────────────────────── */
  const fetchConvites = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("convites")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      setConvites(data ?? []);
    } catch (err: any) {
      toast.error("Erro ao carregar convites: " + err.message);
    } finally {
      setLoadingConvites(false);
    }
  }, []);

  const fetchUsuarios = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      setUsuarios(data ?? []);
    } catch (err: any) {
      toast.error("Erro ao carregar usuários: " + err.message);
    } finally {
      setLoadingUsuarios(false);
    }
  }, []);

  useEffect(() => {
    fetchConvites();
    fetchUsuarios();
  }, [fetchConvites, fetchUsuarios]);

  /* ─────────────────────── GERAR CHAVE ─────────────────────── */
  const gerarChave = async () => {
    setGenerating(true);
    try {
      const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const novaChave = `NX-${p1}-${p2}`;

      const { data: userAuth } = await supabase.auth.getUser();
      const creatorId = userAuth?.user?.id || auth?.id || null;

      const expira = new Date();
      expira.setHours(expira.getHours() + parseInt(validadeHoras));

      const payload: any = {
        chave: novaChave,
        cargo,
        expira_em: expira.toISOString(),
      };
      if (creatorId?.includes("-")) payload.criado_por = creatorId;

      const { error } = await supabase.from("convites").insert(payload);
      if (error) throw error;

      const novoCv: ConviteRow = {
        id: Math.random().toString(36).slice(2),
        chave: novaChave,
        cargo,
        expira_em: expira.toISOString(),
        criado_em: new Date().toISOString(),
      };

      /* Atualiza lista em tempo real e abre modal */
      setConvites((prev) => [novoCv, ...prev]);
      setNovaChaveModal(novoCv);
    } catch (err: any) {
      toast.error("Erro ao gerar chave: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  /* ─────────────────────── REVOGAR CHAVE ─────────────────────── */
  const revogarChave = async (conviteId: string) => {
    setRevokingId(conviteId);
    try {
      const { error } = await supabase.from("convites").delete().eq("id", conviteId);
      if (error) throw error;
      setConvites((prev) => prev.filter((c) => c.id !== conviteId));
      toast.success("Chave revogada com sucesso.");
    } catch (err: any) {
      toast.error("Erro ao revogar chave: " + err.message);
    } finally {
      setRevokingId(null);
    }
  };

  /* ─────────────────────── EDITAR USUÁRIO ─────────────────────── */
  const openEdit = (u: UsuarioRow) => {
    setEditForm({
      nome: u.nome,
      email: u.email,
      cargo: u.cargo,
      status: u.status ?? "Ativo",
    });
    setEditUser(u);
  };

  const salvarEdicao = async () => {
    if (!editUser) return;
    setUpdatingId(editUser.id);
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ nome: editForm.nome, email: editForm.email, cargo: editForm.cargo, status: editForm.status })
        .eq("id", editUser.id);
      if (error) throw error;
      setUsuarios((prev) =>
        prev.map((u) => u.id === editUser.id ? { ...u, ...editForm } : u)
      );
      toast.success("Usuário atualizado com sucesso!");
      setEditUser(null);
    } catch (err: any) {
      toast.error("Erro ao atualizar: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ─────────────────────── TROCAR CARGO INLINE ─────────────────── */
  const updateCargo = async (userId: string, novoCargo: string) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ cargo: novoCargo })
        .eq("id", userId);
      if (error) throw error;
      setUsuarios((prev) =>
        prev.map((u) => u.id === userId ? { ...u, cargo: novoCargo } : u)
      );
      toast.success(`Permissão alterada para ${labelNivel(novoCargo)}!`);
    } catch (err: any) {
      toast.error("Erro ao atualizar cargo: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ─────────────────────── EXCLUIR USUÁRIO ─────────────────────── */
  const confirmarExclusao = async () => {
    if (!deleteUser) return;
    setDeletingId(deleteUser.id);
    try {
      const { error } = await supabase.rpc("delete_user", { target_user_id: deleteUser.id });
      if (error) throw error;
      setUsuarios((prev) => prev.filter((u) => u.id !== deleteUser.id));
      toast.success("Usuário excluído com sucesso.");
      setDeleteUser(null);
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  /* ─────────────────────── HELPERS ─────────────────────── */
  const copiarTexto = (txt: string, msg = "Copiado!") => {
    navigator.clipboard.writeText(txt);
    toast.success(msg);
  };

  const copiarLink = (chave: string) =>
    copiarTexto(`${window.location.origin}/register?key=${chave}`, "Link de cadastro copiado!");

  const isExpirado = (dataISO: string) => new Date(dataISO) < new Date();

  const avatarLetras = (nome: string) => nome?.substring(0, 2).toUpperCase() ?? "??";

  /* ══════════════════════ RENDER ══════════════════════════════════ */
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Controle quem tem acesso à plataforma e configure as permissões de cada perfil.
          </p>
        </div>
      </div>

      <Tabs defaultValue="equipe" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="equipe" className="gap-2">
            <Users className="w-4 h-4" /> Membros da Equipe
          </TabsTrigger>
          <TabsTrigger value="chaves" className="gap-2">
            <KeyRound className="w-4 h-4" /> Chaves de Acesso
          </TabsTrigger>
        </TabsList>

        {/* ══════ ABA EQUIPE ══════ */}
        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários Ativos</CardTitle>
              <CardDescription>
                Gerencie os perfis e permissões das pessoas cadastradas no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsuarios ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  Nenhum usuário encontrado.
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Usuário</th>
                        <th className="px-4 py-3 font-medium hidden md:table-cell">E-mail</th>
                        <th className="px-4 py-3 font-medium">Cargo / Permissão</th>
                        <th className="px-4 py-3 font-medium hidden lg:table-cell">Ingresso</th>
                        <th className="px-4 py-3 font-medium text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {usuarios.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                          {/* Avatar + Nome */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                {avatarLetras(user.nome)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate">{user.nome}</div>
                                <div className="text-xs text-muted-foreground md:hidden truncate">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* E-mail */}
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {user.email}
                          </td>

                          {/* Cargo dropdown */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {user.cargo === "Administrador"
                                ? <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                                : <User className="w-4 h-4 text-muted-foreground shrink-0" />
                              }
                              <Select
                                value={user.cargo}
                                onValueChange={(val) => updateCargo(user.id, val)}
                                disabled={updatingId === user.id}
                              >
                                <SelectTrigger className="h-8 w-[170px] text-xs">
                                  {updatingId === user.id
                                    ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    : null}
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {NIVEIS_ACESSO.map((n) => (
                                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </td>

                          {/* Data de ingresso */}
                          <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                            {new Date(user.criado_em).toLocaleDateString("pt-BR")}
                          </td>

                          {/* Ações */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {/* Visualizar */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                title="Visualizar usuário"
                                onClick={() => setViewUser(user)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {/* Editar */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                                title="Editar usuário"
                                onClick={() => openEdit(user)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>

                              {/* Excluir */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                title="Excluir usuário"
                                onClick={() => setDeleteUser(user)}
                                disabled={deletingId === user.id}
                              >
                                {deletingId === user.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Trash2 className="w-4 h-4" />
                                }
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ ABA CHAVES ══════ */}
        <TabsContent value="chaves">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card gerar convite */}
            <div className="md:col-span-1">
              <Card className="border-primary/20 shadow-md">
                <CardHeader className="bg-primary/5 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    Gerar Convite
                  </CardTitle>
                  <CardDescription>Crie uma chave de acesso segura.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Nível de Acesso Inicial</Label>
                    <Select value={cargo} onValueChange={setCargo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVEIS_ACESSO.map((n) => (
                          <SelectItem key={n.value} value={n.value}>
                            <div className="flex items-center gap-2">
                              {n.value === "Administrador"
                                ? <Shield className="h-3.5 w-3.5 text-rose-500" />
                                : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                              {n.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Validade da Chave</Label>
                    <Select value={validadeHoras} onValueChange={setValidadeHoras}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hora</SelectItem>
                        <SelectItem value="12">12 horas</SelectItem>
                        <SelectItem value="24">24 horas</SelectItem>
                        <SelectItem value="48">48 horas</SelectItem>
                        <SelectItem value="168">7 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={gerarChave} disabled={generating} className="w-full">
                    {generating
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <Plus className="mr-2 h-4 w-4" />}
                    Gerar Chave de Acesso
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Lista de chaves */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Chaves Emitidas</CardTitle>
                  <CardDescription>
                    Histórico de todos os convites gerados e seus status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingConvites ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : convites.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                      Nenhuma chave gerada ainda.<br />
                      Use o painel ao lado para gerar o primeiro convite.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {convites.map((convite) => {
                        const usada    = !!convite.usado_em;
                        const expirada = isExpirado(convite.expira_em);
                        const ativa    = !usada && !expirada;

                        return (
                          <div
                            key={convite.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl gap-4 bg-card hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex flex-col gap-1.5 min-w-0">
                              {/* Chave + badge de status */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-base tracking-widest text-primary">
                                  {convite.chave}
                                </span>
                                {/* Botão copiar inline ao lado da chave */}
                                {ativa && (
                                  <button
                                    onClick={() => copiarTexto(convite.chave, "Chave copiada!")}
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                    title="Copiar chave"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {/* Badge status */}
                                {usada && (
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[10px]">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Utilizada
                                  </Badge>
                                )}
                                {!usada && expirada && (
                                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-[10px]">
                                    <XCircle className="h-3 w-3 mr-1" /> Expirada
                                  </Badge>
                                )}
                                {ativa && (
                                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-[10px]">
                                    Disponível
                                  </Badge>
                                )}
                              </div>

                              {/* Metadados */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                {/* Badge nível formatado */}
                                <span className="flex items-center gap-1">
                                  {convite.cargo === "Administrador"
                                    ? <Shield className="h-3 w-3 text-rose-500" />
                                    : <User className="h-3 w-3" />}
                                  <span className="font-medium text-foreground/80">
                                    {labelNivel(convite.cargo)}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Expira: {new Date(convite.expira_em).toLocaleString("pt-BR", {
                                    dateStyle: "short", timeStyle: "short",
                                  })}
                                </span>
                                {usada && (
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <UserCheck className="h-3 w-3" />
                                    Ativada em {new Date(convite.usado_em!).toLocaleDateString("pt-BR")}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Botões de ação */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              {ativa && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copiarLink(convite.chave)}
                                    className="gap-1.5 text-xs h-8"
                                  >
                                    <LinkIcon className="h-3.5 w-3.5" />
                                    Copiar Link
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copiarTexto(convite.chave, "Chave copiada!")}
                                    className="gap-1.5 text-xs h-8"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    Chave
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                    title="Revogar chave"
                                    onClick={() => revogarChave(convite.id)}
                                    disabled={revokingId === convite.id}
                                  >
                                    {revokingId === convite.id
                                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      : <Ban className="h-3.5 w-3.5" />}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ══════ MODAL VISUALIZAR USUÁRIO ══════ */}
      <Dialog open={!!viewUser} onOpenChange={(o) => !o && setViewUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>Informações completas do perfil selecionado.</DialogDescription>
          </DialogHeader>

          {viewUser && (
            <div className="space-y-5">
              {/* Avatar grande */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {avatarLetras(viewUser.nome)}
                </div>
                <div>
                  <div className="text-lg font-semibold">{viewUser.nome}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {viewUser.cargo === "Administrador"
                      ? <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                      : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className="text-sm text-muted-foreground">{labelNivel(viewUser.cargo)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">E-mail</div>
                  <div className="font-medium break-all">{viewUser.email}</div>
                </div>
                {viewUser.telefone && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Telefone</div>
                    <div className="font-medium">{viewUser.telefone}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Status da Conta
                  </div>
                  <Badge
                    className={
                      (viewUser.status ?? "Ativo") === "Ativo"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    }
                  >
                    {viewUser.status ?? "Ativo"}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Data de Ingresso
                  </div>
                  <div className="font-medium flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {new Date(viewUser.criado_em).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                {viewUser.ultimo_acesso && (
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Último Acesso
                    </div>
                    <div className="font-medium flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(viewUser.ultimo_acesso).toLocaleString("pt-BR")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUser(null)}>Fechar</Button>
            <Button onClick={() => { setViewUser(null); openEdit(viewUser!); }}>
              <Pencil className="w-4 h-4 mr-2" /> Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ MODAL EDITAR USUÁRIO ══════ */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Atualize as informações e permissões do usuário.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-nome">Nome Completo</Label>
              <Input
                id="edit-nome"
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cargo / Permissão</Label>
              <Select
                value={editForm.cargo}
                onValueChange={(v) => setEditForm({ ...editForm, cargo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NIVEIS_ACESSO.map((n) => (
                    <SelectItem key={n.value} value={n.value}>
                      <div className="flex items-center gap-2">
                        {n.value === "Administrador"
                          ? <Shield className="h-3.5 w-3.5 text-rose-500" />
                          : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                        {n.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status da Conta</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Ativo
                    </div>
                  </SelectItem>
                  <SelectItem value="Suspenso">
                    <div className="flex items-center gap-2">
                      <Ban className="h-3.5 w-3.5 text-red-500" />
                      Suspenso
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={updatingId === editUser?.id}>
              {updatingId === editUser?.id
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ MODAL CONFIRMAR EXCLUSÃO ══════ */}
      <Dialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Excluir Usuário
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir permanentemente o usuário{" "}
              <strong className="text-foreground">{deleteUser?.nome}</strong>?
              <span className="block mt-2 text-red-500 font-medium text-xs">
                ⚠️ Esta ação não poderá ser desfeita e revogará o acesso imediatamente.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={deletingId === deleteUser?.id}
            >
              {deletingId === deleteUser?.id
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <Trash2 className="h-4 w-4 mr-2" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ MODAL CHAVE GERADA ══════ */}
      <Dialog open={!!novaChaveModal} onOpenChange={(o) => !o && setNovaChaveModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" /> Chave Gerada com Sucesso!
            </DialogTitle>
            <DialogDescription>
              Compartilhe esta chave com o novo membro da equipe para que ele possa se cadastrar.
            </DialogDescription>
          </DialogHeader>

          {novaChaveModal && (
            <div className="space-y-4">
              {/* Caixa de destaque da chave */}
              <div className="bg-muted rounded-xl p-4 text-center border-2 border-dashed border-primary/30">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Código da Chave</div>
                <div className="font-mono font-bold text-3xl tracking-[0.25em] text-primary">
                  {novaChaveModal.chave}
                </div>
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                  {novaChaveModal.cargo === "Administrador"
                    ? <Shield className="h-3 w-3 text-rose-500" />
                    : <User className="h-3 w-3" />}
                  {labelNivel(novaChaveModal.cargo)}
                  <span className="mx-1">·</span>
                  <Clock className="h-3 w-3" />
                  Expira em {validadeHoras}h
                </div>
              </div>

              {/* Botões de copiar */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => copiarTexto(novaChaveModal.chave, "Chave copiada!")}
                >
                  <Copy className="h-4 w-4" />
                  Copiar Chave
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => copiarLink(novaChaveModal.chave)}
                >
                  <LinkIcon className="h-4 w-4" />
                  Copiar Convite
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" className="w-full" onClick={() => setNovaChaveModal(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
