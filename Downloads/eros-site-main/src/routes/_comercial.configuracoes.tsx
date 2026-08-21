import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { User, Lock, Settings, Bell, ShieldCheck, Laptop, Moon, Sun, Monitor, Save, Camera, Smartphone, Mail, Briefcase, KeyRound, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ModulosCrud } from "@/components/modulos-crud";
import { SettingsUsersPanel } from "@/components/configuracoes/SettingsUsersPanel";
import { Users } from 'lucide-react';

export const Route = createFileRoute('/_comercial/configuracoes')({
  component: ConfiguracoesComponent,
});

type Tab = 'perfil' | 'seguranca' | 'preferencias' | 'notificacoes' | 'precificacao' | 'usuarios';

export function ConfiguracoesComponent() {
  const { auth: user, updateProfile, theme: globalTheme, setTheme: setGlobalTheme } = useStore();
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = (searchParams.get('tab') as Tab) || 'perfil';
  
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form states
  const [nome, setNome] = useState(user?.name || '');
  const [telefone, setTelefone] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // Complementary Data
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  
  // Theme state 
  const [localTheme, setLocalTheme] = useState(globalTheme);
  const [timezone, setTimezone] = useState(user?.timezone || 'America/Sao_Paulo');
  const [defaultScreen, setDefaultScreen] = useState(user?.defaultScreen || 'dashboard');

  useEffect(() => {
    if (user) {
      setNome(user.name || '');
      setTimezone(user.timezone || 'America/Sao_Paulo');
      setDefaultScreen(user.defaultScreen || 'dashboard');
    }
  }, [user]);

  useEffect(() => {
    setLocalTheme(globalTheme);
  }, [globalTheme]);

  const handleChange = (setter: any) => (e: any) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length <= 10) {
      // Formato fixo: (XX) XXXX-XXXX
      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      // Formato celular: (XX) XXXXX-XXXX
      value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    setTelefone(value.trim());
    setHasChanges(true);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    setCpf(value.replace(/-$/, '').replace(/\.$/, ''));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    if (activeTab === 'seguranca') {
      if (novaSenha && novaSenha !== confirmarSenha) {
        toast.error('As senhas não conferem.');
        return;
      }
      if (novaSenha && novaSenha.length < 8) {
        toast.error('A nova senha deve ter no mínimo 8 caracteres.');
        return;
      }
      if (novaSenha && !senhaAtual) {
        toast.error('Informe a senha atual para alterá-la.');
        return;
      }
    }

    setIsSaving(true);
    
    // Simulação de salvamento
    setTimeout(() => {
      setIsSaving(false);
      setHasChanges(false);
      
      if (activeTab === 'preferencias') {
        setGlobalTheme(localTheme);
        updateProfile({ timezone, defaultScreen });
      } else if (activeTab === 'perfil') {
        updateProfile({ name: nome });
      }
      
      // Limpa os campos de senha após salvar
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      
      toast.success('Configurações salvas com sucesso!');
    }, 800);
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/80 dark:bg-background overflow-hidden relative">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b px-6 py-6 bg-white dark:bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-sm">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Meu Perfil</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua conta e suas preferências.</p>
          </div>
        </div>
        <Button 
          className="relative z-10 shadow-md transition-all duration-300 rounded-full px-6"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <span className="flex items-center"><span className="animate-spin mr-2">⚙️</span> Salvando...</span>
          ) : (
            <span className="flex items-center"><Save className="h-4 w-4 mr-2" /> Salvar Alterações</span>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col md:flex-row max-w-[1400px] mx-auto w-full p-4 md:p-6 gap-6">
          
          {/* Sidebar Interna com Design Premium */}
          <div className="w-full md:w-72 shrink-0 space-y-1">
            <nav className="flex flex-col gap-1 p-2 bg-white dark:bg-card rounded-2xl border shadow-sm">
              <button
                onClick={() => setActiveTab('perfil')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'perfil' ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <div className="flex items-center gap-3">
                  <User className={`h-4 w-4 ${activeTab === 'perfil' ? 'text-primary' : ''}`} /> 
                  Perfil Público
                </div>
                {activeTab === 'perfil' && <ChevronRight className="h-4 w-4 opacity-50" />}
              </button>
              
              <button
                onClick={() => setActiveTab('seguranca')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'seguranca' ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <div className="flex items-center gap-3">
                  <Lock className={`h-4 w-4 ${activeTab === 'seguranca' ? 'text-primary' : ''}`} /> 
                  Segurança
                </div>
                {activeTab === 'seguranca' && <ChevronRight className="h-4 w-4 opacity-50" />}
              </button>
              
              <button
                onClick={() => setActiveTab('preferencias')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'preferencias' ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <div className="flex items-center gap-3">
                  <Settings className={`h-4 w-4 ${activeTab === 'preferencias' ? 'text-primary' : ''}`} /> 
                  Preferências
                </div>
                {activeTab === 'preferencias' && <ChevronRight className="h-4 w-4 opacity-50" />}
              </button>
              
              <button
                onClick={() => setActiveTab('notificacoes')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'notificacoes' ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <div className="flex items-center gap-3">
                  <Bell className={`h-4 w-4 ${activeTab === 'notificacoes' ? 'text-primary' : ''}`} /> 
                  Notificações
                </div>
                {activeTab === 'notificacoes' && <ChevronRight className="h-4 w-4 opacity-50" />}
              </button>

              <button
                onClick={() => setActiveTab('usuarios')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'usuarios' ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <div className="flex items-center gap-3">
                  <Users className={`h-4 w-4 ${activeTab === 'usuarios' ? 'text-primary' : ''}`} /> 
                  Gestão de Usuários
                </div>
                {activeTab === 'usuarios' && <ChevronRight className="h-4 w-4 opacity-50" />}
              </button>
              
            </nav>
          </div>

          {/* Área de Conteúdo */}
          <div className="flex-1 overflow-y-auto pb-10">
            <div className="max-w-[1000px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* ABA: USUÁRIOS */}
              {activeTab === 'usuarios' && (
                <SettingsUsersPanel />
              )}

              {/* ABA: PERFIL */}
              {activeTab === 'perfil' && (
                <>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Perfil Público</h2>
                    <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações pessoais e como elas aparecem no sistema.</p>
                  </div>

                  {/* Alerta de Cadastro Incompleto */}
                  {(!cpf || !endereco || !telefone) && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4">
                      <div className="h-10 w-10 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-amber-900 dark:text-amber-400">Finalize seu cadastro</h3>
                        <p className="text-sm text-amber-700/80 dark:text-amber-500 mt-1">Preencha todas as suas informações abaixo (CPF, Endereço, Data de Nascimento) para aumentar a segurança e validar sua conta.</p>
                      </div>
                    </div>
                  )}

                  <Card className="shadow-sm border rounded-2xl overflow-hidden bg-white dark:bg-card">
                    <CardContent className="p-0">
                      
                      {/* Sessão Avatar */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 bg-muted/20 border-b">
                        <div className="relative group cursor-pointer shrink-0">
                          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl font-bold text-primary border-4 border-white dark:border-card shadow-md group-hover:shadow-lg transition-all">
                            {getInitials(nome)}
                          </div>
                          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <Camera className="h-8 w-8 text-white" />
                          </div>
                          <div className="absolute bottom-0 right-0 h-6 w-6 bg-white rounded-full flex items-center justify-center shadow-md border">
                            <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className="text-center sm:text-left space-y-1">
                          <h3 className="text-lg font-semibold">{nome || 'Seu Nome'}</h3>
                          <p className="text-sm text-muted-foreground">JPG, GIF ou PNG. Tamanho máximo de 2MB.</p>
                          <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                            <Button variant="outline" size="sm" className="rounded-full shadow-sm text-xs h-8">Trocar foto</Button>
                            <Button variant="ghost" size="sm" className="rounded-full text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50">Remover</Button>
                          </div>
                        </div>
                      </div>

                      {/* Sessão Formulário */}
                      <div className="p-6 sm:p-8 space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Usuário</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9 h-11 rounded-xl bg-muted/30 focus-visible:bg-transparent" value={nome} onChange={handleChange(setNome)} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Telefone / WhatsApp</Label>
                            <div className="relative">
                              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9 h-11 rounded-xl bg-muted/30 focus-visible:bg-transparent" value={telefone} onChange={handlePhoneChange} placeholder="(11) 99999-9999" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">CPF</Label>
                            <Input className="h-11 rounded-xl bg-muted/30 focus-visible:bg-transparent" value={cpf} onChange={handleCpfChange} placeholder="000.000.000-00" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Data de Nascimento</Label>
                            <Input type="date" className="h-11 rounded-xl bg-muted/30 focus-visible:bg-transparent" value={dataNascimento} onChange={handleChange(setDataNascimento)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">CEP</Label>
                            <Input className="h-11 rounded-xl bg-muted/30 focus-visible:bg-transparent" value={cep} onChange={handleChange(setCep)} placeholder="00000-000" />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Endereço Completo</Label>
                            <Input className="h-11 rounded-xl bg-muted/30 focus-visible:bg-transparent" value={endereco} onChange={handleChange(setEndereco)} placeholder="Rua, Número, Complemento, Bairro, Cidade - UF" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border rounded-2xl overflow-hidden bg-white dark:bg-card">
                    <CardHeader className="bg-muted/10 border-b pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" /> Dados Profissionais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">E-mail Administrativo</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input value={user?.email || 'email@exemplo.com'} disabled className="pl-9 h-11 rounded-xl bg-muted/50 border-dashed opacity-70" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Tipo de Usuário</Label>
                          <div className="h-11 px-4 bg-primary/5 border border-primary/20 rounded-xl text-sm font-semibold flex items-center gap-2 text-primary/80 w-fit">
                            <ShieldCheck className="h-4 w-4" />
                            {user?.role || 'Vendedor'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}



              {/* ABA: SEGURANÇA */}
              {activeTab === 'seguranca' && (
                <>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Segurança da Conta</h2>
                    <p className="text-sm text-muted-foreground mt-1">Mantenha sua conta segura alterando a senha regularmente e ativando o 2FA.</p>
                  </div>

                  {/* Alerta 2FA */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5">
                      <ShieldCheck className="h-32 w-32" />
                    </div>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="h-12 w-12 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-emerald-900 dark:text-emerald-400">Proteção Avançada (2FA)</h3>
                        <p className="text-sm text-emerald-700/80 dark:text-emerald-500 mt-1 mb-2 max-w-md">Sua conta está desprotegida. Adicione uma camada extra de segurança ativando a autenticação em dois fatores.</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Desativado atualmente
                        </span>
                      </div>
                    </div>
                    <Button className="shrink-0 relative z-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6">
                      Ativar Agora
                    </Button>
                  </div>

                  <Card className="shadow-sm border rounded-2xl bg-white dark:bg-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/10 pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" /> Alteração de Senha
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 space-y-5">
                      <div className="space-y-2 max-w-sm">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Senha Atual</Label>
                        <Input type="password" value={senhaAtual} onChange={(e) => { setSenhaAtual(e.target.value); setHasChanges(true); }} className="h-11 rounded-xl bg-muted/30 focus-visible:bg-transparent" placeholder="••••••••" />
                      </div>
                      
                      <div className="my-6 border-b border-border/50"></div>
                      
                      <div className="space-y-2 max-w-sm">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Nova Senha</Label>
                        <Input type="password" value={novaSenha} onChange={(e) => { setNovaSenha(e.target.value); setHasChanges(true); }} className="h-11 rounded-xl bg-muted/30 focus-visible:bg-transparent" placeholder="••••••••" />
                        <div className="flex gap-1 mt-3">
                          <div className={`h-1.5 w-full rounded-full transition-colors ${novaSenha.length > 0 ? 'bg-emerald-500' : 'bg-muted'}`}></div>
                          <div className={`h-1.5 w-full rounded-full transition-colors ${novaSenha.length >= 4 ? 'bg-emerald-500' : 'bg-muted'}`}></div>
                          <div className={`h-1.5 w-full rounded-full transition-colors ${novaSenha.length >= 6 ? 'bg-emerald-500' : 'bg-muted'}`}></div>
                          <div className={`h-1.5 w-full rounded-full transition-colors ${novaSenha.length >= 8 ? 'bg-emerald-500' : 'bg-muted'}`}></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <CheckCircle2 className={`h-3 w-3 ${novaSenha.length >= 8 ? 'text-emerald-500' : 'text-muted-foreground/50'}`} /> Pelo menos 8 caracteres
                        </p>
                      </div>
                      
                      <div className="space-y-2 max-w-sm">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Confirmar Nova Senha</Label>
                        <Input type="password" value={confirmarSenha} onChange={(e) => { setConfirmarSenha(e.target.value); setHasChanges(true); }} className="h-11 rounded-xl bg-muted/30 focus-visible:bg-transparent" placeholder="••••••••" />
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/10 border-t p-4 flex justify-between">
                      <Link to="/forgot-password" search={{ email: user?.email }} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        Esqueci minha senha
                      </Link>
                      <Button onClick={handleSave} disabled={!hasChanges} size="sm" className="rounded-full">
                        Atualizar Senha
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className="shadow-sm border rounded-2xl bg-white dark:bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Sessões Conectadas</CardTitle>
                      <CardDescription>Gerencie os dispositivos que têm acesso à sua conta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-xl bg-primary/5 border-primary/20">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Laptop className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">Chrome no Windows</p>
                            <p className="text-xs text-muted-foreground mt-0.5">São Paulo, BR • Ativo agora</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Sessão Atual
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors rounded-xl">
                        Desconectar outros dispositivos
                      </Button>
                    </CardFooter>
                  </Card>
                </>
              )}

              {/* ABA: PREFERÊNCIAS */}
              {activeTab === 'preferencias' && (
                <>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Preferências do Sistema</h2>
                    <p className="text-sm text-muted-foreground mt-1">Personalize sua experiência visual e regionalização.</p>
                  </div>

                  <Card className="shadow-sm border rounded-2xl bg-white dark:bg-card">
                    <CardHeader className="border-b bg-muted/10 pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-primary" /> Aparência e Tema
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button 
                          onClick={() => { setLocalTheme('light'); setHasChanges(true); }}
                          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${localTheme === 'light' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]' : 'border-border hover:border-primary/40 hover:bg-muted/30'}`}
                        >
                          <Sun className={`h-8 w-8 mb-3 ${localTheme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`font-semibold ${localTheme === 'light' ? 'text-primary' : ''}`}>Tema Claro</span>
                        </button>
                        <button 
                          onClick={() => { setLocalTheme('dark'); setHasChanges(true); }}
                          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${localTheme === 'dark' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]' : 'border-border hover:border-primary/40 hover:bg-muted/30'}`}
                        >
                          <Moon className={`h-8 w-8 mb-3 ${localTheme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`font-semibold ${localTheme === 'dark' ? 'text-primary' : ''}`}>Tema Escuro</span>
                        </button>
                        <button 
                          onClick={() => { setLocalTheme('system'); setHasChanges(true); }}
                          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${localTheme === 'system' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]' : 'border-border hover:border-primary/40 hover:bg-muted/30'}`}
                        >
                          <Monitor className={`h-8 w-8 mb-3 ${localTheme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`font-semibold ${localTheme === 'system' ? 'text-primary' : ''}`}>Seguir Sistema</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border rounded-2xl bg-white dark:bg-card">
                    <CardHeader className="border-b bg-muted/10 pb-4">
                      <CardTitle className="text-lg">Configurações Regionais</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Fuso Horário (Timezone)</Label>
                          <select value={timezone} onChange={handleChange(setTimezone)} className="w-full h-11 rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                            <option value="America/Sao_Paulo">(GMT-03:00) Horário de Brasília</option>
                            <option value="America/Manaus">(GMT-04:00) Horário do Amazonas</option>
                          </select>
                          <p className="text-xs text-muted-foreground mt-1">Impacta os agendamentos da Agenda.</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Tela Inicial Padrão</Label>
                          <select value={defaultScreen} onChange={handleChange(setDefaultScreen)} className="w-full h-11 rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                            <option value="dashboard">Dashboard (Início)</option>
                            <option value="pipeline">Pipeline Kanban</option>
                            <option value="agenda">Agenda Semanal</option>
                          </select>
                          <p className="text-xs text-muted-foreground mt-1">O que abrir quando você faz login.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* ABA: NOTIFICAÇÕES */}
              {activeTab === 'notificacoes' && (
                <>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Central de Notificações</h2>
                    <p className="text-sm text-muted-foreground mt-1">Controle como e quando você quer ser avisado pelo CRM.</p>
                  </div>

                  <Card className="shadow-sm border rounded-2xl bg-white dark:bg-card overflow-hidden">
                    <CardContent className="p-0">
                      <div className="border-b grid grid-cols-12 px-6 py-4 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-8">Tipo de Evento</div>
                        <div className="col-span-2 text-center flex items-center justify-center gap-1"><Monitor className="h-3 w-3" /> In-App</div>
                        <div className="col-span-2 text-center flex items-center justify-center gap-1"><Mail className="h-3 w-3" /> E-mail</div>
                      </div>
                      
                      <div className="divide-y">
                        {[
                          { title: 'Novo lead atribuído a mim', desc: 'Sempre que o sistema ou gestor direcionar um novo lead para você.' },
                          { title: 'Lead mudou de etapa', desc: 'Quando alguém da equipe avançar ou regredir um lead seu.' },
                          { title: 'Reunião iminente (15 min)', desc: 'Lembrete automático antes de eventos na sua agenda.' },
                          { title: 'Relatório semanal de metas', desc: 'Resumo enviado toda sexta-feira.' },
                        ].map((item, i) => (
                          <div key={i} className="grid grid-cols-12 px-6 py-5 items-center hover:bg-muted/10 transition-colors">
                            <div className="col-span-8 pr-4">
                              <p className="text-sm font-semibold text-foreground">{item.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked onChange={() => setHasChanges(true)} />
                                <div className="w-10 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                              </label>
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked={i === 0 || i === 3} onChange={() => setHasChanges(true)} />
                                <div className="w-10 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
