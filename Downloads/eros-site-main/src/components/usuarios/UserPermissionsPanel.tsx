import { useState, useMemo } from "react";
import { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  LayoutDashboard,
  Building2,
  Target,
  KanbanSquare,
  CalendarDays,
  ListTodo,
  BarChart3,
  Settings,
  LifeBuoy,
  Contact,
  BarChart,
  Users,
  KeyRound,
  ShieldCheck,
  UserCircle2,
  Lock,
  Bell,
  Sliders,
  Save,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Permission, 
  FeaturePermissions, 
  ModulePermissions, 
  UserPermissionsMap, 
  DEFAULT_PERM, 
  ALL_ON, 
  SYSTEM_MODULES 
} from "@/lib/permissions";

// ─── Helpers ────────────────────────────────────────────────────────────────────

const buildDefaultPermissions = (): ModulePermissions => {
  const map: ModulePermissions = {};
  for (const mod of SYSTEM_MODULES) {
    map[mod.id] = {};
    for (const feat of mod.features) {
      map[mod.id][feat.id] = { ...DEFAULT_PERM };
    }
  }
  return map;
};

const ROLE_COLORS: Record<string, string> = {
  Administrador: "bg-purple-100 text-purple-700 ring-purple-600/20",
  Desenvolvedor: "bg-indigo-100 text-indigo-700 ring-indigo-600/20",
  Suporte: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  Comercial: "bg-blue-100 text-blue-700 ring-blue-600/20",
  Financeiro: "bg-amber-100 text-amber-700 ring-amber-600/20",
  Administrativo: "bg-slate-100 text-slate-700 ring-slate-600/20",
  Vendedor: "bg-cyan-100 text-cyan-700 ring-cyan-600/20",
};

function getInitials(name: string) {
  return name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "US";
}

// ─── Componente Principal ──────────────────────────────────────────────────────

interface UserPermissionsPanelProps {
  users: User[];
}

export function UserPermissionsPanel({ users }: UserPermissionsPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [permissionsMap, setPermissionsMap] = useState<UserPermissionsMap>({});
  const [isInheritedMap, setIsInheritedMap] = useState<Record<string, boolean>>({});
  const [savedUsers, setSavedUsers] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  // Garante que o usuário tenha permissões inicializadas
  const isInherited = selectedUserId ? (isInheritedMap[selectedUserId] ?? true) : true;
  
  const currentPerms = useMemo<ModulePermissions>(() => {
    if (!selectedUserId || !selectedUser) return {};
    
    if (isInherited) {
      // Mock: Recuperaria do backend as permissões base do cargo.
      // Por enquanto, simula que Admin tem tudo, outros não têm nada.
      const isSuper = selectedUser.role === "Administrador" || selectedUser.role === "Desenvolvedor";
      const initial = buildDefaultPermissions();
      if (isSuper) {
        for (const mod of SYSTEM_MODULES) {
          for (const feat of mod.features) {
            initial[mod.id][feat.id] = { ...ALL_ON };
          }
        }
      }
      return initial;
    }
    
    return permissionsMap[selectedUserId] ?? buildDefaultPermissions();
  }, [selectedUserId, selectedUser, permissionsMap, isInherited]);

  const setPermission = (
    moduleId: string,
    featureId: string,
    field: keyof Permission,
    value: boolean
  ) => {
    if (!selectedUserId) return;
    setPermissionsMap((prev) => {
      const base = prev[selectedUserId] ?? buildDefaultPermissions();
      return {
        ...prev,
        [selectedUserId]: {
          ...base,
          [moduleId]: {
            ...base[moduleId],
            [featureId]: {
              ...base[moduleId][featureId],
              [field]: value,
            },
          },
        },
      };
    });
    setSavedUsers((prev) => {
      const next = new Set(prev);
      next.delete(selectedUserId);
      return next;
    });
  };

  const toggleAllFeature = (moduleId: string, featureId: string, on: boolean) => {
    if (!selectedUserId) return;
    setPermissionsMap((prev) => {
      const base = prev[selectedUserId] ?? buildDefaultPermissions();
      return {
        ...prev,
        [selectedUserId]: {
          ...base,
          [moduleId]: {
            ...base[moduleId],
            [featureId]: on ? { ...ALL_ON } : { ...DEFAULT_PERM },
          },
        },
      };
    });
    setSavedUsers((prev) => { const n = new Set(prev); n.delete(selectedUserId!); return n; });
  };

  const toggleAllModule = (moduleId: string, on: boolean) => {
    if (!selectedUserId) return;
    const mod = SYSTEM_MODULES.find((m) => m.id === moduleId);
    if (!mod) return;
    setPermissionsMap((prev) => {
      const base = prev[selectedUserId!] ?? buildDefaultPermissions();
      const updated: FeaturePermissions = {};
      for (const feat of mod.features) {
        updated[feat.id] = on ? { ...ALL_ON } : { ...DEFAULT_PERM };
      }
      return {
        ...prev,
        [selectedUserId!]: { ...base, [moduleId]: updated },
      };
    });
    setSavedUsers((prev) => { const n = new Set(prev); n.delete(selectedUserId!); return n; });
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    // TODO: supabase.from('user_permissions').upsert({ user_id: selectedUserId, permissions: currentPerms })
    await new Promise((r) => setTimeout(r, 600));
    setSavedUsers((prev) => new Set([...prev, selectedUserId]));
    setIsSaving(false);
    toast.success(`Permissões de ${selectedUser?.name} salvas com sucesso!`);
  };

  const isModuleAllOn = (moduleId: string) => {
    const mod = SYSTEM_MODULES.find((m) => m.id === moduleId);
    if (!mod) return false;
    return mod.features.every((f) => {
      const p = currentPerms[moduleId]?.[f.id];
      return p?.ver && p?.criar && p?.editar && p?.excluir;
    });
  };

  const isSaved = selectedUserId ? savedUsers.has(selectedUserId) : false;

  return (
    <div className="flex gap-6 h-full min-h-[600px]">
      {/* ── Coluna esquerda: lista de usuários ── */}
      <div className="w-72 shrink-0 flex flex-col gap-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">
          Selecione um usuário
        </div>
        <ScrollArea className="flex-1 pr-1">
          <div className="flex flex-col gap-1.5">
            {users.map((user) => {
              const isActive = user.id === selectedUserId;
              const hasSaved = savedUsers.has(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={cn(
                    "group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all duration-200",
                    isActive
                      ? "bg-primary/5 border-primary/40 shadow-sm"
                      : "bg-white hover:bg-slate-50 border-border/60 hover:border-border"
                  )}
                >
                  <Avatar className="h-10 w-10 border shrink-0">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                    <AvatarFallback className="text-xs font-bold">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold truncate">{user.name}</span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset w-fit mt-0.5",
                        ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"
                      )}
                    >
                      {user.role}
                    </span>
                  </div>
                  {hasSaved && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
            {users.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Coluna direita: permissões do usuário selecionado ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed rounded-2xl bg-slate-50/50 text-muted-foreground">
            <ShieldCheck className="h-12 w-12 opacity-20" />
            <div>
              <p className="font-semibold text-base">Selecione um usuário</p>
              <p className="text-sm mt-1 opacity-70">
                Escolha um usuário à esquerda para gerenciar suas permissões por módulo.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1">
            {/* Header do usuário selecionado */}
            <div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border-2 border-primary/20">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name}`} />
                  <AvatarFallback className="font-bold">{getInitials(selectedUser.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-base">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset border-0",
                    ROLE_COLORS[selectedUser.role] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"
                  )}
                >
                  {selectedUser.role}
                </Badge>
              </div>
              
              <div className="flex items-center gap-6 ml-auto">
                {/* Switch de Herança */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isInherited ? "Herdando Perfil" : "Permissões Específicas"}
                  </span>
                  <button
                    onClick={() => {
                      setIsInheritedMap(prev => ({ ...prev, [selectedUserId]: !isInherited }));
                      setSavedUsers(prev => { const n = new Set(prev); n.delete(selectedUserId); return n; });
                    }}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      !isInherited ? "bg-primary" : "bg-slate-200"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        !isInherited ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                <Button
                onClick={handleSave}
                disabled={isSaving || isSaved}
                size="sm"
                className={cn(
                  "gap-2 transition-all",
                  isSaved && "bg-emerald-500 hover:bg-emerald-600"
                )}
              >
                {isSaved ? (
                  <><CheckCircle2 className="h-4 w-4" /> Salvo</>
                ) : isSaving ? (
                  <><Save className="h-4 w-4 animate-pulse" /> Salvando...</>
                ) : (
                  <><Save className="h-4 w-4" /> Salvar Permissões</>
                )}
              </Button>
              </div>
            </div>

            {/* Accordion de módulos */}
            <ScrollArea className="flex-1">
              <Accordion type="multiple" className="flex flex-col gap-3">
                {SYSTEM_MODULES.map((mod) => {
                  const allOn = isModuleAllOn(mod.id);
                  const unlockedFeatures = mod.features
                    .filter((feat) => {
                      const p = currentPerms[mod.id]?.[feat.id];
                      // Show it as unlocked if they can at least "ver"
                      return p?.ver;
                    })
                    .map((feat) => feat.label);

                  return (
                    <AccordionItem
                      key={mod.id}
                      value={mod.id}
                      className={cn(
                        "rounded-2xl border bg-gradient-to-br shadow-sm overflow-hidden",
                        mod.color
                      )}
                    >
                      {/* Wrapper: trigger lado a lado com o checkbox "Tudo" — evita button dentro de button */}
                      <div className="flex items-center">
                        <AccordionTrigger className="flex-1 px-4 py-3.5 hover:no-underline hover:bg-black/5 transition-colors group">
                          <div className="flex items-center gap-3 w-full text-left">
                            <div className="h-9 w-9 rounded-xl bg-white/70 border flex items-center justify-center shrink-0 shadow-sm">
                              <mod.Icon className="h-4 w-4 text-foreground/70" />
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                              <span className="font-semibold text-sm">{mod.label}</span>
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground truncate w-full pr-4">
                                {mod.features.length} func.
                                {unlockedFeatures.length > 0 && (
                                  <>
                                    <span className="opacity-50">•</span>
                                    <span className="truncate text-primary/80 font-medium">
                                      Liberado: {unlockedFeatures.join(", ")}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        {/* Checkbox "Tudo" FORA do AccordionTrigger para evitar button aninhado */}
                        <div className="flex items-center gap-2 px-4 py-3.5 shrink-0">
                          <span className="text-xs text-muted-foreground">Tudo</span>
                          <Checkbox
                            id={`all-${mod.id}`}
                            checked={allOn}
                            disabled={isInherited}
                            onCheckedChange={(v) => toggleAllModule(mod.id, !!v)}
                            className="h-4 w-4"
                          />
                        </div>
                      </div>

                      <AccordionContent className="px-4 pb-4">
                        <div className="rounded-xl border bg-white/80 overflow-hidden">
                          {/* Cabeçalho da tabela */}
                          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-50/80 border-b text-xs font-semibold text-muted-foreground">
                            <div className="col-span-5">Funcionalidade</div>
                            <div className="col-span-1 text-center">Ver</div>
                            <div className="col-span-2 text-center">Criar</div>
                            <div className="col-span-2 text-center">Editar</div>
                            <div className="col-span-1 text-center">Excluir</div>
                            <div className="col-span-1 text-center">Tudo</div>
                          </div>

                          {/* Linhas de funcionalidades */}
                          {mod.features.map((feat, idx) => {
                            const perm = currentPerms[mod.id]?.[feat.id] ?? { ...DEFAULT_PERM };
                            const featAllOn = perm.ver && perm.criar && perm.editar && perm.excluir;
                            return (
                              <div
                                key={feat.id}
                                className={cn(
                                  "grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors",
                                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/40",
                                  "hover:bg-primary/5"
                                )}
                              >
                                <div className="col-span-5 flex items-center gap-2">
                                  <feat.Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="text-sm font-medium">{feat.label}</span>
                                </div>
                                <div className="col-span-1 flex justify-center">
                                  <Checkbox
                                    checked={perm.ver}
                                    disabled={isInherited}
                                    onCheckedChange={(v) => setPermission(mod.id, feat.id, "ver", !!v)}
                                    className="h-4 w-4"
                                  />
                                </div>
                                <div className="col-span-2 flex justify-center">
                                  <Checkbox
                                    checked={perm.criar}
                                    disabled={isInherited}
                                    onCheckedChange={(v) => setPermission(mod.id, feat.id, "criar", !!v)}
                                    className="h-4 w-4"
                                  />
                                </div>
                                <div className="col-span-2 flex justify-center">
                                  <Checkbox
                                    checked={perm.editar}
                                    disabled={isInherited}
                                    onCheckedChange={(v) => setPermission(mod.id, feat.id, "editar", !!v)}
                                    className="h-4 w-4"
                                  />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                  <Checkbox
                                    checked={perm.excluir}
                                    disabled={isInherited}
                                    onCheckedChange={(v) => setPermission(mod.id, feat.id, "excluir", !!v)}
                                    className="h-4 w-4"
                                  />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                  <Checkbox
                                    id={`${mod.id}-${feat.id}-all`}
                                    checked={featAllOn}
                                    disabled={isInherited}
                                    onCheckedChange={(v) =>
                                      toggleAllFeature(mod.id, feat.id, !!v)
                                    }
                                    className="h-4 w-4 border-primary/40 data-[state=checked]:bg-primary"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
