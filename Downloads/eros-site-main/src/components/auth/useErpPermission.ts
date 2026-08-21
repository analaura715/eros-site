import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/store';
import { PermissionsService, UsuarioPermissao, UsuarioParametrosOperacionais } from '@/lib/services/permissionsService';

export function useErpPermission() {
  const { user } = useAuth();
  
  // Exemplo: O interceptor para verificar permissões antes de disparar uma ação.
  // Como estamos sem um provider global que cacheia as permissões no momento para simplificar,
  // poderíamos buscar do banco ou de um store global (Zustand).
  
  const [modalOpen, setModalOpen] = useState(false);
  const [actionDesc, setActionDesc] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Função para checar permissões antes de executar. 
  // Na vida real, verificaria se o usuário tem a permissão com 'codigo_menu' específico.
  // Aqui, mockamos que certas ações exigem SUPER se for passado requireSuper = true.
  const executeGuardedAction = useCallback(async (
    codigoMenu: string, 
    descricao: string, 
    action: () => void,
    requireSuper: boolean = false
  ) => {
    if (!user) return;
    
    try {
      const params = await PermissionsService.getUserParams(user.id);
      
      // Se for Super Usuário Master, pula todas as verificações
      if (params.is_super_usuario) {
        action();
        return;
      }

      // Verifica se a rota exige SUPER
      if (requireSuper) {
        setActionDesc(descricao);
        setPendingAction(() => action);
        setModalOpen(true);
      } else {
        // Ação normal liberada
        action();
      }
      
    } catch (err) {
      console.error("Erro na validação de permissão:", err);
    }
  }, [user]);

  return {
    executeGuardedAction,
    modalProps: {
      open: modalOpen,
      onOpenChange: (open: boolean) => {
        setModalOpen(open);
        if (!open) setPendingAction(null);
      },
      userId: user?.id || '',
      actionDescription: actionDesc,
      onSuccess: () => {
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
      }
    }
  };
}
