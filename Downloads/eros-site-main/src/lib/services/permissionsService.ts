import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';

export type ModuloSistema = {
  id: string;
  codigo_menu: string;
  descricao: string;
  categoria: string;
  ativo: boolean;
};

export type UsuarioPermissao = {
  id_modulo: string;
  codigo_menu: string;
  descricao: string;
  categoria: string;
  habilitar: 'S' | 'N';
  super: 'S' | 'N';
};

export type UsuarioParametrosOperacionais = {
  senha_adm?: string;
  is_super_usuario: boolean;
  pode_alterar_desconto: boolean;
  pode_abrir_pdv: boolean;
  usa_tef: boolean;
  vendedor_id?: string;
  conta_caixa_id?: string;
};

export type ErpUser = User & UsuarioParametrosOperacionais;

// Mocks iniciais com TODAS as rotas e funções do sistema mapeadas
const MOCK_MODULOS: ModuloSistema[] = [
  // COMERCIAL
  { id: 'com_dash', codigo_menu: 'COM01', descricao: 'Dashboard Comercial', categoria: 'Comercial (CRM)', ativo: true },
  { id: 'com_emp', codigo_menu: 'COM02', descricao: 'Empresas', categoria: 'Comercial (CRM)', ativo: true },
  { id: 'com_lea', codigo_menu: 'COM03', descricao: 'Leads', categoria: 'Comercial (CRM)', ativo: true },
  { id: 'com_doc', codigo_menu: 'COM04', descricao: 'Documentos (Diagnósticos)', categoria: 'Comercial (CRM)', ativo: true },
  { id: 'com_pip', codigo_menu: 'COM05', descricao: 'Pipeline', categoria: 'Comercial (CRM)', ativo: true },
  { id: 'com_age', codigo_menu: 'COM06', descricao: 'Agenda', categoria: 'Comercial (CRM)', ativo: true },
  { id: 'com_his', codigo_menu: 'COM07', descricao: 'Histórico', categoria: 'Comercial (CRM)', ativo: true },
  { id: 'com_rel', codigo_menu: 'COM08', descricao: 'Relatórios', categoria: 'Comercial (CRM)', ativo: true },
  { id: 'com_cfg', codigo_menu: 'COM09', descricao: 'Configurações do CRM', categoria: 'Comercial (CRM)', ativo: true },

  // SUPORTE
  { id: 'sup_pan', codigo_menu: 'SUP01', descricao: 'Painel / Dashboard', categoria: 'Suporte & Chamados', ativo: true },
  { id: 'sup_cha', codigo_menu: 'SUP02', descricao: 'Chamados', categoria: 'Suporte & Chamados', ativo: true },
  { id: 'sup_pen', codigo_menu: 'SUP03', descricao: 'Tarefas', categoria: 'Suporte & Chamados', ativo: true },
  { id: 'sup_rot', codigo_menu: 'SUP04', descricao: 'Rotina de Contatos', categoria: 'Suporte & Chamados', ativo: true },
  { id: 'sup_cli', codigo_menu: 'SUP05', descricao: 'Clientes do Suporte', categoria: 'Suporte & Chamados', ativo: true },
  { id: 'sup_met', codigo_menu: 'SUP06', descricao: 'Relatórios / Métricas', categoria: 'Suporte & Chamados', ativo: true },
  { id: 'sup_aju', codigo_menu: 'SUP07', descricao: 'Ajustes do Suporte', categoria: 'Suporte & Chamados', ativo: true },

  // USUÁRIOS
  { id: 'usr_mem', codigo_menu: 'USR01', descricao: 'Membros da Equipe', categoria: 'Gestão de Usuários', ativo: true },
  { id: 'usr_con', codigo_menu: 'USR02', descricao: 'Convites', categoria: 'Gestão de Usuários', ativo: true },
  { id: 'usr_per', codigo_menu: 'USR03', descricao: 'Perfis de Acesso', categoria: 'Gestão de Usuários', ativo: true },
  { id: 'usr_grn', codigo_menu: 'USR04', descricao: 'Permissões (ERP)', categoria: 'Gestão de Usuários', ativo: true },
  { id: 'usr_cfg', codigo_menu: 'USR05', descricao: 'Configurações de Usuários', categoria: 'Gestão de Usuários', ativo: true },

  // CONFIGURAÇÕES GERAIS
  { id: 'cfg_prf', codigo_menu: 'CFG01', descricao: 'Meu Perfil', categoria: 'Configurações Gerais', ativo: true },
  { id: 'cfg_seg', codigo_menu: 'CFG02', descricao: 'Segurança', categoria: 'Configurações Gerais', ativo: true },
  { id: 'cfg_pre', codigo_menu: 'CFG03', descricao: 'Preferências', categoria: 'Configurações Gerais', ativo: true },
  { id: 'cfg_not', codigo_menu: 'CFG04', descricao: 'Notificações', categoria: 'Configurações Gerais', ativo: true },
];

let mockUserPermsStore: Record<string, UsuarioPermissao[]> = {};
let mockUserParamsStore: Record<string, UsuarioParametrosOperacionais> = {};

export const PermissionsService = {
  // 1. Pega os parâmetros do usuário
  async getUserParams(userId: string): Promise<UsuarioParametrosOperacionais> {
    // Tenta pegar do supabase (no futuro)
    // const { data } = await supabase.from('usuarios').select('*').eq('id', userId).single();
    // return data;

    // Retorna mock por enquanto
    if (!mockUserParamsStore[userId]) {
      mockUserParamsStore[userId] = {
        is_super_usuario: false,
        pode_alterar_desconto: false,
        pode_abrir_pdv: false,
        usa_tef: false,
      };
    }
    return mockUserParamsStore[userId];
  },

  // 2. Traz a Grid com o LEFT JOIN (Módulos + Permissões do Usuário)
  async getUserPermissionsGrid(userId: string): Promise<UsuarioPermissao[]> {
    // const { data } = await supabase.from('vw_permissoes_grid').select('*').eq('id_usuario', userId);
    // return data;

    // Mock
    const existing = mockUserPermsStore[userId] || [];
    return MOCK_MODULOS.map(mod => {
      const p = existing.find(x => x.id_modulo === mod.id);
      return {
        id_modulo: mod.id,
        codigo_menu: mod.codigo_menu,
        descricao: mod.descricao,
        categoria: mod.categoria,
        habilitar: p?.habilitar || 'N',
        super: p?.super || 'N'
      };
    });
  },

  // 3. Salva em Lote
  async saveUserPermissionsBulk(
    userId: string, 
    permissoes: { id_modulo: string, habilitar: 'S'|'N', super: 'S'|'N' }[],
    parametros: UsuarioParametrosOperacionais
  ): Promise<boolean> {
    // await supabase.rpc('save_user_permissions', { p_id_usuario: userId, p_permissoes: permissoes });
    // await supabase.from('usuarios').update(parametros).eq('id', userId);
    
    // Mock
    mockUserPermsStore[userId] = permissoes.map(p => {
      const mod = MOCK_MODULOS.find(m => m.id === p.id_modulo);
      return {
        ...p,
        codigo_menu: mod?.codigo_menu || '',
        descricao: mod?.descricao || '',
        categoria: mod?.categoria || ''
      };
    });
    mockUserParamsStore[userId] = parametros;

    return true;
  },

  // 4. Valida senha de administrador
  async validateSupervisorPassword(userId: string, passwordAttempt: string): Promise<boolean> {
    // const { data } = await supabase.from('usuarios').select('senha_adm').eq('id', userId).single();
    // return data?.senha_adm === passwordAttempt;

    // Mock
    const params = mockUserParamsStore[userId];
    if (!params || !params.senha_adm) return false;
    return params.senha_adm === passwordAttempt;
  }
};
