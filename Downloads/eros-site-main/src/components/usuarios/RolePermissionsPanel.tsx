import { useState, useMemo } from "react";
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
  ShieldCheck,
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

const AVAILABLE_ROLES = [
  "Administrador",
  "Desenvolvedor",
  "Suporte",
  "Comercial",
  "Financeiro",
  "Administrativo",
  "Padrão",
];

const ROLE_COLORS: Record<string, string> = {
  Administrador:  "bg-purple-100 text-purple-700 ring-purple-600/20",
  Desenvolvedor:  "bg-indigo-100 text-indigo-700 ring-indigo-600/20",
  Suporte:        "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  Comercial:      "bg-blue-100 text-blue-700 ring-blue-600/20",
  Financeiro:     "bg-amber-100 text-amber-700 ring-amber-600/20",
  Administrativo: "bg-slate-100 text-slate-700 ring-slate-600/20",
  Padrão:         "bg-gray-100 text-gray-700 ring-gray-600/20",
};

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

// ─── Componente ─────────────────────────────────────────────────────────────────

export function RolePermissionsPanel() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [permissionsMap, setPermissionsMap] = useState<Record<string, ModulePermissions>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedRoles, setSavedRoles] = useState<Set<string>>(new Set());

  // Permissões atuais do perfil selecionado (cria um default se não existir no state)
  const currentPerms = useMemo(() => {
    if (!selectedRole) return {};
    if (!permissionsMap[selectedRole]) {
      // Initialize with full permissions for Admin/Dev just as a mock example
      const isSuper = selectedRole === "Administrador" || selectedRole === "Desenvolvedor";
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
    return permissionsMap[selectedRole];
  }, [selectedRole, permissionsMap]);

  const handleToggle = (moduleId: string, featureId: string, permKey: keyof Permission, value: boolean) => {
    if (!selectedRole) return;
    setPermissionsMap((prev) => {
      const base = prev[selectedRole] ?? currentPerms;
      const modPerms = base[moduleId] ?? {};
      const featPerms = modPerms[featureId] ?? { ...DEFAULT_PERM };

      const updated = {
        ...base,
        [moduleId]: {
          ...modPerms,
          [featureId]: { ...featPerms, [permKey]: value },
        },
      };
      return { ...prev, [selectedRole]: updated };
    });
    setSavedRoles((prev) => { const n = new Set(prev); n.delete(selectedRole); return n; });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    // TODO: supabase.from('role_permissions').upsert({ role: selectedRole, permissions: currentPerms })
    await new Promise((r) => setTimeout(r, 600));
    setSavedRoles((prev) => new Set([...prev, selectedRole]));
    setIsSaving(false);
    toast.success(`Permissões padrão de ${selectedRole} salvas com sucesso!`);
  };

  const isModuleAllOn = (moduleId: string) => {
    const mod = SYSTEM_MODULES.find((m) => m.id === moduleId);
    if (!mod) return false;
    return mod.features.every((f) => {
      const p = currentPerms[moduleId]?.[f.id];
      return p?.ver && p?.criar && p?.editar && p?.excluir;
    });
  };

  const toggleAllModule = (moduleId: string, on: boolean) => {
    if (!selectedRole) return;
    const mod = SYSTEM_MODULES.find((m) => m.id === moduleId);
    if (!mod) return;
    setPermissionsMap((prev) => {
      const base = prev[selectedRole] ?? currentPerms;
      const updated: FeaturePermissions = {};
      for (const feat of mod.features) {
        updated[feat.id] = on ? { ...ALL_ON } : { ...DEFAULT_PERM };
      }
      return {
        ...prev,
        [selectedRole]: { ...base, [moduleId]: updated },
      };
    });
    setSavedRoles((prev) => { const n = new Set(prev); n.delete(selectedRole); return n; });
  };

  const isSaved = selectedRole ? savedRoles.has(selectedRole) : false;

  return (
    <div className="flex gap-6 h-full min-h-[600px]">
      {/* ── Coluna esquerda: lista de perfis ── */}
      <div className="w-72 shrink-0 flex flex-col gap-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">
          Selecione um perfil (Role)
        </div>
        <ScrollArea className="flex-1 pr-1">
          <div className="flex flex-col gap-1.5">
            {AVAILABLE_ROLES.map((role) => {
              const isActive = role === selectedRole;
              const hasSaved = savedRoles.has(role);
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all duration-200",
                    isActive
                      ? "bg-primary/5 border-primary/40 shadow-sm"
                      : "bg-white hover:bg-slate-50 border-border/60 hover:border-border"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ring-1 ring-inset",
                    ROLE_COLORS[role] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"
                  )}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold truncate">{role}</span>
                    <span className="text-xs text-muted-foreground">Padrão do sistema</span>
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
          </div>
        </ScrollArea>
      </div>

      {/* ── Coluna direita: permissões do perfil selecionado ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedRole ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed rounded-2xl bg-slate-50/50 text-muted-foreground">
            <ShieldCheck className="h-12 w-12 opacity-20" />
            <div>
              <p className="font-semibold text-base">Selecione um perfil</p>
              <p className="text-sm mt-1 opacity-70">
                Escolha um perfil à esquerda para definir suas permissões padrão no sistema.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in zoom-in-95 duration-200">
            {/* Header do painel */}
            <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-2xl border shadow-sm shrink-0">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center ring-1 ring-inset",
                  ROLE_COLORS[selectedRole] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"
                )}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Permissões: {selectedRole}</h3>
                  <p className="text-sm text-muted-foreground">Define os acessos base para todos os usuários com este cargo.</p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={cn(
                  "shadow-sm transition-all rounded-xl",
                  isSaved && "bg-emerald-500 hover:bg-emerald-600"
                )}
              >
                {isSaved ? (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Salvo</>
                ) : isSaving ? (
                  <><Save className="h-4 w-4 animate-pulse mr-2" /> Salvando...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Salvar Padrão</>
                )}
              </Button>
            </div>

            {/* Accordion de módulos */}
            <ScrollArea className="flex-1">
              <Accordion type="multiple" className="flex flex-col gap-3">
                {SYSTEM_MODULES.map((mod) => {
                  const allOn = isModuleAllOn(mod.id);
                  const unlockedFeatures = mod.features
                    .filter((feat) => {
                      const p = currentPerms[mod.id]?.[feat.id];
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
                        <div className="flex items-center gap-2 px-4 py-3.5 shrink-0">
                          <span className="text-xs text-muted-foreground">Tudo</span>
                          <Checkbox
                            id={`all-${mod.id}`}
                            checked={allOn}
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
                                  <feat.Icon className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                                  <span className="text-sm font-medium">{feat.label}</span>
                                </div>
                                
                                <div className="col-span-1 flex justify-center">
                                  <Checkbox
                                    checked={perm.ver}
                                    onCheckedChange={(v) => handleToggle(mod.id, feat.id, "ver", !!v)}
                                    className="h-4 w-4"
                                  />
                                </div>
                                <div className="col-span-2 flex justify-center">
                                  <Checkbox
                                    checked={perm.criar}
                                    onCheckedChange={(v) => handleToggle(mod.id, feat.id, "criar", !!v)}
                                    className="h-4 w-4"
                                  />
                                </div>
                                <div className="col-span-2 flex justify-center">
                                  <Checkbox
                                    checked={perm.editar}
                                    onCheckedChange={(v) => handleToggle(mod.id, feat.id, "editar", !!v)}
                                    className="h-4 w-4"
                                  />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                  <Checkbox
                                    checked={perm.excluir}
                                    onCheckedChange={(v) => handleToggle(mod.id, feat.id, "excluir", !!v)}
                                    className="h-4 w-4 border-red-200 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                  />
                                </div>
                                
                                <div className="col-span-1 flex justify-center border-l pl-2 border-border/50">
                                  <Checkbox
                                    checked={featAllOn}
                                    onCheckedChange={(v) => {
                                      handleToggle(mod.id, feat.id, "ver", !!v);
                                      handleToggle(mod.id, feat.id, "criar", !!v);
                                      handleToggle(mod.id, feat.id, "editar", !!v);
                                      handleToggle(mod.id, feat.id, "excluir", !!v);
                                    }}
                                    className="h-4 w-4 data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800"
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
