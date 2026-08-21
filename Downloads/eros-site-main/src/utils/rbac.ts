export type AccessLevel = 'liberado' | 'somente_leitura' | 'oculto' | 'herdar';

export interface ModulePermissions {
  [moduleName: string]: AccessLevel;
}

/**
 * Utilitário para verificar se o usuário tem permissão de visualizar um módulo
 */
export const canView = (permissions: ModulePermissions | null, moduleName: string): boolean => {
  if (!permissions) return false;
  const access = permissions[moduleName];
  return access === 'liberado' || access === 'somente_leitura';
};

/**
 * Utilitário para verificar se o usuário tem permissão de editar/criar num módulo
 */
export const canEdit = (permissions: ModulePermissions | null, moduleName: string): boolean => {
  if (!permissions) return false;
  return permissions[moduleName] === 'liberado';
};

/**
 * Utilitário para verificar se o módulo está totalmente oculto
 */
export const isHidden = (permissions: ModulePermissions | null, moduleName: string): boolean => {
  if (!permissions) return true;
  return permissions[moduleName] === 'oculto';
};
