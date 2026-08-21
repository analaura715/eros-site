import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { ModulePermissions } from '@/utils/rbac';

/**
 * Hook para gerenciar e validar permissões do usuário logado baseado no Supabase
 * ou mock state caso o Supabase não esteja disponível/configurado.
 */
export function usePermissions() {
  const { auth } = useStore();
  const [permissions, setPermissions] = useState<ModulePermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      if (!auth?.id) {
        setPermissions(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Tenta buscar as permissões via RPC do Supabase
        const { data, error } = await supabase.rpc('get_user_permissions', { p_user_id: auth.id });
        
        if (error) {
          throw error;
        }

        if (data) {
          setPermissions(data as ModulePermissions);
        } else {
          // Fallback para mock baseado no cargo caso a tabela ainda não exista
          setPermissions(getMockPermissionsByRole(auth.role));
        }
      } catch (err) {
        console.warn('Erro ao carregar permissões do Supabase, usando mock local.', err);
        setPermissions(getMockPermissionsByRole(auth.role));
      } finally {
        setIsLoading(false);
      }
    }

    loadPermissions();
  }, [auth]);

  return { permissions, isLoading };
}

// Fallback local até que o BD esteja 100% populado
function getMockPermissionsByRole(role: string): ModulePermissions {
  const roleLower = (role || '').toLowerCase();
  
  if (roleLower.includes('admin') || roleLower.includes('desenvolvedor')) {
    return {
      crm: 'liberado',
      suporte: 'liberado',
      financeiro: 'liberado',
      usuarios: 'liberado',
      configuracoes: 'liberado',
    };
  }
  
  if (roleLower.includes('comercial') || roleLower.includes('vendedor')) {
    return {
      crm: 'liberado',
      suporte: 'somente_leitura',
      financeiro: 'oculto',
      usuarios: 'oculto',
      configuracoes: 'oculto',
    };
  }
  
  if (roleLower.includes('suporte')) {
    return {
      crm: 'oculto',
      suporte: 'liberado',
      financeiro: 'oculto',
      usuarios: 'oculto',
      configuracoes: 'oculto',
    };
  }

  // Default Padrão
  return {
    crm: 'somente_leitura',
    suporte: 'somente_leitura',
    financeiro: 'oculto',
    usuarios: 'oculto',
    configuracoes: 'oculto',
  };
}
