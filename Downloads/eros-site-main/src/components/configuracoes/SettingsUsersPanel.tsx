import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Save, Plus, Trash2, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { SYSTEM_MODULES } from '@/lib/permissions';

export function SettingsUsersPanel() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // States for forms
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // States for permissions
  const [perms, setPerms] = useState<Record<string, { visualizar: boolean, edicação: boolean, bloquear: boolean }>>({});

  const handleTogglePerm = (id: string, field: 'visualizar' | 'edicação' | 'bloquear') => {
    setPerms(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: !prev[id]?.[field]
      }
    }));
  };

  const isAllChecked = (field: 'visualizar' | 'edicação' | 'bloquear') => {
    const allIds = [
      ...SYSTEM_MODULES.map(m => m.id),
      ...SYSTEM_MODULES.flatMap(m => m.features).map(f => f.id)
    ];
    if (allIds.length === 0) return false;
    return allIds.every(id => perms[id]?.[field]);
  };

  const handleToggleAll = (field: 'visualizar' | 'edicação' | 'bloquear') => {
    const allIds = [
      ...SYSTEM_MODULES.map(m => m.id),
      ...SYSTEM_MODULES.flatMap(m => m.features).map(f => f.id)
    ];
    
    const newValue = !isAllChecked(field);

    const newPerms = { ...perms };
    allIds.forEach(id => {
      if (!newPerms[id]) newPerms[id] = { visualizar: false, edicação: false, bloquear: false };
      newPerms[id][field] = newValue;
    });
    setPerms(newPerms);
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
    setSenha(''); // Reset password field when selecting a user
    // Asumimos que `u.permissoes` guarda as regras em JSON na tabela
    setPerms(u.permissoes || {});
  };

  const handleNew = () => {
    setSelectedUser(null);
    setNome('');
    setEmail('');
    setSenha('');
    setPerms({});
  };

  const handleSaveUser = async () => {
    if (!nome || !email) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    
    toast.loading('Salvando usuário...', { id: 'saveUser' });

    try {
      const payload: any = {
        nome,
        email,
        permissoes: perms,
        // Mantém a role antiga ou joga pra padrão se for novo
        cargo: selectedUser?.cargo || 'Padrão'
      };

      if (senha.trim()) {
        payload.senha = senha.trim();
      }

      if (selectedUser?.id) {
        // Update
        const { error } = await supabase.from('usuarios').update(payload).eq('id', selectedUser.id);
        if (error) throw error;
      } else {
        // Insert (gerando uma senha padrão temporária para novos usuários se não usarem convite)
        const tempPassword = senha.trim() || Math.random().toString(36).slice(-8);
        const novoId = crypto.randomUUID();
        const { error } = await supabase.from('usuarios').insert([{
          ...payload,
          id: novoId,
          senha: tempPassword
        }]);
        if (error) throw error;
      }

      toast.success('Usuário e permissões salvos com sucesso!', { id: 'saveUser' });
      fetchUsuarios();
      // Não chamamos handleNew() aqui para que o usuário veja que as marcações foram salvas!
      if (!selectedUser?.id) {
        // Se for novo usuário, limpamos a tela para ele criar o próximo ou apenas damos reload
        handleNew();
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao salvar usuário: ' + (error.message || ''), { id: 'saveUser' });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    toast.loading('Excluindo usuário...', { id: 'delUser' });
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', selectedUser.id);
      if (error) throw error;
      toast.success('Usuário excluído com sucesso!', { id: 'delUser' });
      fetchUsuarios();
      handleNew();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao excluir usuário: ' + (error.message || ''), { id: 'delUser' });
    }
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
          <h2 className="text-xl font-bold tracking-tight">Gestão de Usuários e Acessos</h2>
          <p className="text-sm text-muted-foreground mt-1">Controle de cadastros e defina as permissões individuais de cada usuário do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Lista de Usuários */}
        <Card className="col-span-1 border shadow-sm h-fit">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="text-base flex justify-between items-center">
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col max-h-[700px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
              ) : usuarios.map(u => (
                <button 
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={`flex flex-col items-start p-4 border-b hover:bg-slate-50 transition-colors ${selectedUser?.id === u.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                >
                  <span className="font-semibold text-sm text-left">{u.nome}</span>
                  <div className="flex justify-between w-full mt-1">
                    <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                  </div>
                </button>
              ))}
              {usuarios.length === 0 && !loading && (
                <div className="p-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Cadastro e Permissões */}
        <Card className="col-span-1 lg:col-span-3 border shadow-sm h-fit">
          <CardHeader className="bg-slate-50/50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedUser ? 'Permissões do Usuário' : 'Nenhum usuário selecionado'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {selectedUser 
                    ? 'Altere as permissões de acesso deste usuário na plataforma.' 
                    : 'Selecione um usuário na lista ao lado para gerenciar seus acessos.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            
            {/* Dados Cadastrais */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label>Nome Completo</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="João da Silva" />
              </div>
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label>E-mail de Acesso</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="joao@empresa.com.br" />
              </div>
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label>Nova Senha</Label>
                <Input value={senha} onChange={e => setSenha(e.target.value)} type="password" placeholder={selectedUser ? "Digite para alterar" : "Senha do usuário"} />
              </div>
            </div>

            {/* Matriz de Permissões */}
            <div className="border-t pt-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Matriz de Acessos</h3>
                  <p className="text-sm text-muted-foreground">Defina os privilégios granulares deste usuário na plataforma.</p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden shadow-sm">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs text-muted-foreground uppercase border-b sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-4 font-semibold align-top">Módulo / Funcionalidade</th>
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
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase px-2 hover:bg-blue-500/20 text-blue-700" onClick={() => handleToggleAll('edicação')}>
                              {isAllChecked('edicação') ? 'Desmarcar' : 'Sel. Todos'}
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
                              <span className="text-xs text-muted-foreground mt-0.5">Módulo Principal</span>
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
                              checked={!!perms[mod.id]?.edicação} 
                              onCheckedChange={() => handleTogglePerm(mod.id, 'edicação')}
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
                      
                      {/* Features filhas */}
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
                              checked={!!perms[feat.id]?.edicação} 
                              onCheckedChange={() => handleTogglePerm(feat.id, 'edicação')}
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
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-6 border-t mt-8">
              <Button onClick={handleSaveUser} className="gap-2 px-8" disabled={!selectedUser}>
                <Save className="h-4 w-4" /> Gravar Permissões
              </Button>
              <Button variant="outline" onClick={handleNew} disabled={!selectedUser}>
                Cancelar Seleção
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
