import { useState, useEffect, useMemo } from 'react';
import { User } from '@/lib/types';
import { PermissionsService, UsuarioPermissao, UsuarioParametrosOperacionais } from '@/lib/services/permissionsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Save, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ErpUserPermissionsPanelProps {
  users: User[];
}

export function ErpUserPermissionsPanel({ users }: ErpUserPermissionsPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissions, setPermissions] = useState<UsuarioPermissao[]>([]);
  const [operParams, setOperParams] = useState<UsuarioParametrosOperacionais>({
    is_super_usuario: false,
    pode_alterar_desconto: false,
    pode_abrir_pdv: false,
    usa_tef: false,
    senha_adm: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load User Data
  useEffect(() => {
    if (!selectedUserId) {
      setPermissions([]);
      return;
    }
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const grid = await PermissionsService.getUserPermissionsGrid(selectedUserId);
        const params = await PermissionsService.getUserParams(selectedUserId);
        setPermissions(grid);
        setOperParams(params);
      } catch (err) {
        toast.error("Erro ao carregar permissões do usuário.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedUserId]);

  const filteredPermissions = useMemo(() => {
    if (!searchTerm) return permissions;
    const lower = searchTerm.toLowerCase();
    return permissions.filter(p => 
      p.descricao.toLowerCase().includes(lower) || 
      p.codigo_menu.toLowerCase().includes(lower) ||
      p.categoria.toLowerCase().includes(lower)
    );
  }, [permissions, searchTerm]);

  // Actions
  const handleTogglePerm = (id_modulo: string, field: 'habilitar' | 'super', value: boolean) => {
    setPermissions(prev => prev.map(p => {
      if (p.id_modulo === id_modulo) {
        return { ...p, [field]: value ? 'S' : 'N' };
      }
      return p;
    }));
  };

  const handleToggleAll = (value: boolean) => {
    setPermissions(prev => prev.map(p => ({ ...p, habilitar: value ? 'S' : 'N' })));
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    try {
      await PermissionsService.saveUserPermissionsBulk(
        selectedUserId, 
        permissions.map(p => ({ id_modulo: p.id_modulo, habilitar: p.habilitar, super: p.super })),
        operParams
      );
      toast.success("Permissões sincronizadas com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar permissões.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Upper Panel: Selection & Actions */}
      <Card className="border shadow-sm rounded-2xl bg-white overflow-hidden">
        <div className="bg-slate-50/80 p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 flex-1 max-w-md">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Selecionar Usuário (Colaborador)
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="bg-white border-border/60 shadow-sm rounded-xl h-11">
                <SelectValue placeholder="Selecione um usuário para configurar" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{u.name}</span>
                      <span className="text-muted-foreground text-xs">({u.role})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleToggleAll(true)}
              disabled={!selectedUserId || isLoading}
              className="bg-white"
            >
              Habilitar Tudo
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!selectedUserId || isSaving || isLoading}
              className="gap-2 rounded-xl shadow-sm bg-primary hover:bg-primary/90"
            >
              {isSaving ? <span className="animate-pulse">Salvando...</span> : <><Save className="h-4 w-4" /> Atualizar / Sincronizar</>}
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {selectedUserId ? (
        <Tabs defaultValue="menus" className="w-full flex flex-col gap-4">
          <TabsList className="bg-white border p-1 rounded-xl shadow-sm self-start h-auto">
            <TabsTrigger value="menus" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
              Menus e Ações (Grid)
            </TabsTrigger>
            <TabsTrigger value="operacional" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
              Parâmetros Operacionais
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GRID DE MENUS */}
          <TabsContent value="menus" className="mt-0">
            <Card className="border shadow-sm rounded-2xl bg-white overflow-hidden">
              <div className="p-4 border-b flex items-center gap-4 bg-slate-50/50">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Pesquisar por menu ou código..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white border-border/60 rounded-xl"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {filteredPermissions.length} rotinas encontradas.
                </div>
              </div>
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-slate-50 sticky top-0 z-10 border-b">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Cód.</th>
                      <th className="px-6 py-3 font-semibold">Descrição do Menu/Ação</th>
                      <th className="px-6 py-3 font-semibold">Categoria</th>
                      <th className="px-6 py-3 font-semibold text-center w-32 bg-primary/5">Habilitar</th>
                      <th className="px-6 py-3 font-semibold text-center w-32 bg-amber-500/5">Super</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground">
                          Carregando permissões do banco de dados...
                        </td>
                      </tr>
                    ) : filteredPermissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground">
                          Nenhuma rotina encontrada.
                        </td>
                      </tr>
                    ) : (
                      filteredPermissions.map((perm, idx) => (
                        <tr key={perm.id_modulo} className={cn("border-b hover:bg-slate-50/80 transition-colors", idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30')}>
                          <td className="px-6 py-3 font-mono text-xs text-slate-500">{perm.codigo_menu}</td>
                          <td className="px-6 py-3 font-medium">{perm.descricao}</td>
                          <td className="px-6 py-3 text-muted-foreground">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {perm.categoria}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center bg-primary/5">
                            <Checkbox 
                              checked={perm.habilitar === 'S'}
                              onCheckedChange={(val) => handleTogglePerm(perm.id_modulo, 'habilitar', !!val)}
                              className="h-5 w-5 data-[state=checked]:bg-primary"
                            />
                          </td>
                          <td className="px-6 py-3 text-center bg-amber-500/5">
                            <Checkbox 
                              checked={perm.super === 'S'}
                              onCheckedChange={(val) => handleTogglePerm(perm.id_modulo, 'super', !!val)}
                              className="h-5 w-5 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: PARÂMETROS OPERACIONAIS */}
          <TabsContent value="operacional" className="mt-0">
            <Card className="border shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  Regras de Negócio e Senhas
                </CardTitle>
                <CardDescription>
                  Configure exceções operacionais e cadastre a Senha ADM (Super) deste usuário.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* Senha ADM */}
                <div className="col-span-full md:col-span-1 p-5 rounded-2xl border-2 border-amber-500/20 bg-amber-500/5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-amber-700 font-bold mb-1">
                    <KeyRound className="h-5 w-5" />
                    Senha ADM (Supervisor)
                  </div>
                  <p className="text-xs text-amber-700/80 mb-2">
                    Esta senha será solicitada caso este usuário precise liberar uma rotina com flag "SUPER".
                  </p>
                  <Input 
                    type="password" 
                    placeholder="Digite o PIN numérico..." 
                    value={operParams.senha_adm || ''}
                    onChange={e => setOperParams(prev => ({ ...prev, senha_adm: e.target.value }))}
                    className="bg-white border-amber-500/30 focus-visible:ring-amber-500"
                  />
                </div>

                {/* Flags Globais */}
                <div className="col-span-full md:col-span-2 flex flex-col gap-4 p-5 rounded-2xl border bg-slate-50/50">
                  <h3 className="font-bold text-sm text-slate-800 mb-2 border-b pb-2">Privilégios Administrativos</h3>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={operParams.is_super_usuario}
                      onCheckedChange={v => setOperParams(p => ({ ...p, is_super_usuario: !!v }))}
                      className="mt-0.5 h-5 w-5 group-hover:border-primary data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                    />
                    <div>
                      <p className="font-semibold text-sm text-slate-900">É Super Usuário (Admin Master)?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Ignora todas as restrições da aba anterior. Acesso livre e irrestrito ao sistema.</p>
                    </div>
                  </label>

                  <h3 className="font-bold text-sm text-slate-800 mb-2 border-b pb-2 mt-4">Privilégios Operacionais (PDV / Comercial)</h3>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={operParams.pode_alterar_desconto}
                      onCheckedChange={v => setOperParams(p => ({ ...p, pode_alterar_desconto: !!v }))}
                      className="mt-0.5 group-hover:border-primary"
                    />
                    <div>
                      <p className="font-semibold text-sm text-slate-900">Pode Alterar Valor/Desconto</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Permite inserir descontos ou alterar valores finais em propostas ou PDV.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={operParams.pode_abrir_pdv}
                      onCheckedChange={v => setOperParams(p => ({ ...p, pode_abrir_pdv: !!v }))}
                      className="mt-0.5 group-hover:border-primary"
                    />
                    <div>
                      <p className="font-semibold text-sm text-slate-900">Abertura de Caixa (PDV)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Permissão para iniciar nova sessão de venda rápida (Frente de Caixa).</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={operParams.usa_tef}
                      onCheckedChange={v => setOperParams(p => ({ ...p, usa_tef: !!v }))}
                      className="mt-0.5 group-hover:border-primary"
                    />
                    <div>
                      <p className="font-semibold text-sm text-slate-900">Usa TEF (Transferência Eletrônica de Fundos)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Usuário habilitado para passar cartão diretamente na maquineta integrada.</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed rounded-2xl bg-slate-50/50 text-muted-foreground">
          <ShieldAlert className="h-12 w-12 opacity-20" />
          <div>
            <p className="font-semibold text-base text-slate-700">Nenhum colaborador selecionado</p>
            <p className="text-sm mt-1 opacity-70 max-w-sm">
              Utilize a barra superior para escolher o usuário que deseja configurar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
