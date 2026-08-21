import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, ShieldCheck, KeyRound, Save, Plus, Trash2, Edit2, Loader2, Link as LinkIcon, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { SYSTEM_MODULES } from '@/lib/permissions';

// Mock data for initial dev
const MOCK_ROLES = [
  { id: '1', nome: 'Administrador', isDefault: true },
  { id: '2', nome: 'Padrão', isDefault: true }
];

export function SettingsUsersPanel() {
  const [activeTab, setActiveTab] = useState('cadastro');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // States for forms
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('Padrão');

  // States for permissions
  const [cargoPermissoes, setCargoPermissoes] = useState('Padrão');
  const [perms, setPerms] = useState<Record<string, { visualizar: boolean, edicao: boolean, bloquear: boolean }>>({});

  const handleTogglePerm = (id: string, field: 'visualizar' | 'edicao' | 'bloquear') => {
    setPerms(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: !prev[id]?.[field]
      }
    }));
  };

  const isAllChecked = (field: 'visualizar' | 'edicao' | 'bloquear') => {
    const allIds = [
      ...SYSTEM_MODULES.map(m => m.id),
      ...SYSTEM_MODULES.flatMap(m => m.features).map(f => f.id)
    ];
    if (allIds.length === 0) return false;
    return allIds.every(id => perms[id]?.[field]);
  };

  const handleToggleAll = (field: 'visualizar' | 'edicao' | 'bloquear') => {
    const allIds = [
      ...SYSTEM_MODULES.map(m => m.id),
      ...SYSTEM_MODULES.flatMap(m => m.features).map(f => f.id)
    ];
    
    const newValue = !isAllChecked(field);

    const newPerms = { ...perms };
    allIds.forEach(id => {
      if (!newPerms[id]) newPerms[id] = { visualizar: false, edicao: false, bloquear: false };
      newPerms[id][field] = newValue;
    });
    setPerms(newPerms);
  };

  const handleSavePermissoes = () => {
    toast.success(`Permissões do cargo ${cargoPermissoes} salvas com sucesso!`);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('usuarios').select('*').order('nome');
      if (data) setUsuarios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (u: any) => {
    setSelectedUser(u);
    setNome(u.nome);
    setEmail(u.email);
    setCargo(u.cargo || 'Padrão');
  };

  const handleNew = () => {
    setSelectedUser(null);
    setNome('');
    setEmail('');
    setCargo('Padrão');
  };

  const handleSaveUser = async () => {
    if (!nome || !email) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    toast.success('Usuário salvo (Simulação)');
    // In a real scenario, we would upsert to supabase
    handleNew();
  };

  const handleDeleteUser = () => {
    toast.success('Usuário excluído (Simulação)');
    handleNew();
  };

  const handleGenerateToken = () => {
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    navigator.clipboard.writeText(`Token: ${token}`);
    toast.success(`Token ${token} gerado e copiado para a área de transferência! Envie para o usuário se cadastrar.`);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Gestão de Usuários</h2>
          <p className="text-sm text-muted-foreground mt-1">Controle de acessos, cadastros e permissões do sistema.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border shadow-sm p-1 h-12 rounded-xl mb-6">
          <TabsTrigger value="cadastro" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
            <Users className="h-4 w-4 mr-2" /> Cadastro / Usuários
          </TabsTrigger>
          <TabsTrigger value="tipos" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
            <ShieldCheck className="h-4 w-4 mr-2" /> Tipos de Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
            <KeyRound className="h-4 w-4 mr-2" /> Permissões e Acessos
          </TabsTrigger>
        </TabsList>

        {/* ── ABA 1: CADASTRO ── */}
        <TabsContent value="cadastro" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Lista de Usuários */}
            <Card className="col-span-1 border shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b pb-4">
                <CardTitle className="text-base flex justify-between items-center">
                  Lista de Usuários
                  <Button variant="outline" size="sm" onClick={handleNew} className="h-8 gap-1">
                    <Plus className="h-3.5 w-3.5" /> Novo
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col max-h-[500px] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                  ) : usuarios.map(u => (
                    <button 
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`flex flex-col items-start p-4 border-b hover:bg-slate-50 transition-colors ${selectedUser?.id === u.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                    >
                      <span className="font-semibold text-sm">{u.nome}</span>
                      <div className="flex justify-between w-full mt-1">
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-medium">{u.cargo || 'Padrão'}</span>
                      </div>
                    </button>
                  ))}
                  {usuarios.length === 0 && !loading && (
                    <div className="p-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Formulário de Cadastro */}
            <Card className="col-span-1 lg:col-span-2 border shadow-sm h-fit">
              <CardHeader className="bg-slate-50/50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {selectedUser ? 'Alteração de Usuário' : 'Novo Usuário (Cadastro Automático)'}
                  </CardTitle>
                  {!selectedUser && (
                    <Button variant="secondary" size="sm" onClick={handleGenerateToken} className="gap-2">
                      <LinkIcon className="h-4 w-4" /> Gerar Token de Login
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {selectedUser 
                    ? 'Altere os dados do usuário ou defina seu cargo.' 
                    : 'Gere um token para que o usuário se cadastre sozinho na tela de Login, ou crie a conta manualmente abaixo.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label>Nome Completo</Label>
                    <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="João da Silva" />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label>E-mail de Acesso</Label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="joao@empresa.com.br" />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label>Tipo de Usuário (Cargo)</Label>
                    <Select value={cargo} onValueChange={setCargo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                        <SelectItem value="Padrão">Padrão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t mt-6">
                  <Button onClick={handleSaveUser} className="gap-2">
                    <Save className="h-4 w-4" /> Gravar
                  </Button>
                  <Button variant="outline" onClick={handleNew}>
                    Cancelar
                  </Button>
                  {selectedUser && (
                    <Button variant="destructive" className="ml-auto gap-2" onClick={handleDeleteUser}>
                      <Trash2 className="h-4 w-4" /> Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── ABA 2: TIPOS DE USUÁRIOS ── */}
        <TabsContent value="tipos" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-base flex justify-between items-center">
                Tipos de Usuários Cadastrados
                <Button size="sm" variant="outline" className="gap-1"><Plus className="h-3.5 w-3.5" /> Adicionar Tipo</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Tipo de Usuário</th>
                    <th className="px-6 py-4 font-semibold">Regras Fixas</th>
                    <th className="px-6 py-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {MOCK_ROLES.map(role => (
                    <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold">{role.nome}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {role.nome === 'Administrador' ? 'Possui acesso total ao sistema por padrão.' : 'Necessita de liberação manual de acessos.'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm"><Edit2 className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA 3: PERMISSÕES E ACESSOS ── */}
        <TabsContent value="permissoes" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
              <div>
                <CardTitle className="text-base">Matriz de Permissões</CardTitle>
                <CardDescription>Defina os ticks de Visualização, Edição e Bloqueio para o tipo de usuário selecionado.</CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <Select value={cargoPermissoes} onValueChange={setCargoPermissoes}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione o Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Padrão">Padrão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs text-muted-foreground uppercase border-b sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 font-semibold align-top">Funcionalidade do Sistema</th>
                    <th className="px-6 py-4 font-semibold text-center w-28 bg-emerald-500/5 align-top">
                      <div className="flex flex-col items-center gap-2">
                        <span>Visualizar</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase px-2 hover:bg-emerald-500/20 text-emerald-700" onClick={() => handleToggleAll('visualizar')}>
                          {isAllChecked('visualizar') ? 'Desmarcar' : 'Sel. Todos'}
                        </Button>
                      </div>
                    </th>
                    <th className="px-6 py-4 font-semibold text-center w-28 bg-blue-500/5 align-top">
                      <div className="flex flex-col items-center gap-2">
                        <span>Edição</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase px-2 hover:bg-blue-500/20 text-blue-700" onClick={() => handleToggleAll('edicao')}>
                          {isAllChecked('edicao') ? 'Desmarcar' : 'Sel. Todos'}
                        </Button>
                      </div>
                    </th>
                    <th className="px-6 py-4 font-semibold text-center w-28 bg-red-500/5 align-top">
                      <div className="flex flex-col items-center gap-2">
                        <span>Bloquear</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase px-2 hover:bg-red-500/20 text-red-700" onClick={() => handleToggleAll('bloquear')}>
                          {isAllChecked('bloquear') ? 'Desmarcar' : 'Sel. Todos'}
                        </Button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {SYSTEM_MODULES.map((mod) => (
                    <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{mod.label}</span>
                          <span className="text-xs text-muted-foreground mt-0.5">Módulo de {mod.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-emerald-500/5">
                        <Checkbox 
                          checked={!!perms[mod.id]?.visualizar} 
                          onCheckedChange={() => handleTogglePerm(mod.id, 'visualizar')}
                          className="h-5 w-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" 
                        />
                      </td>
                      <td className="px-6 py-4 text-center bg-blue-500/5">
                        <Checkbox 
                          checked={!!perms[mod.id]?.edicao} 
                          onCheckedChange={() => handleTogglePerm(mod.id, 'edicao')}
                          className="h-5 w-5 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" 
                        />
                      </td>
                      <td className="px-6 py-4 text-center bg-red-500/5">
                        <Checkbox 
                          checked={!!perms[mod.id]?.bloquear} 
                          onCheckedChange={() => handleTogglePerm(mod.id, 'bloquear')}
                          className="h-5 w-5 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" 
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {/* Explodindo as features filhas para serem mais específicas (opcional) */}
                  {SYSTEM_MODULES.flatMap(mod => mod.features).map((feat, idx) => (
                    <tr key={feat.id + idx} className="hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                      <td className="px-6 py-3 pl-12 border-l-2 border-l-transparent group-hover:border-l-primary/30">
                        <div className="flex items-center gap-2">
                          <feat.Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-slate-700">{feat.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center bg-emerald-500/5">
                        <Checkbox 
                          checked={!!perms[feat.id]?.visualizar} 
                          onCheckedChange={() => handleTogglePerm(feat.id, 'visualizar')}
                          className="h-4 w-4 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" 
                        />
                      </td>
                      <td className="px-6 py-3 text-center bg-blue-500/5">
                        <Checkbox 
                          checked={!!perms[feat.id]?.edicao} 
                          onCheckedChange={() => handleTogglePerm(feat.id, 'edicao')}
                          className="h-4 w-4 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" 
                        />
                      </td>
                      <td className="px-6 py-3 text-center bg-red-500/5">
                        <Checkbox 
                          checked={!!perms[feat.id]?.bloquear} 
                          onCheckedChange={() => handleTogglePerm(feat.id, 'bloquear')}
                          className="h-4 w-4 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <Button onClick={handleSavePermissoes} className="gap-2">
                <Save className="h-4 w-4" /> Salvar Permissões
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
