import { supabase } from "./supabase";

export type AuditSeverity = 'info' | 'warning' | 'critical' | 'error';

export interface AuditLogPayload {
  action: string;
  module: string;
  target_id?: string;
  details?: Record<string, any>;
  severity?: AuditSeverity;
}

/**
 * Função utilitária para gravar eventos críticos de segurança na trilha de auditoria.
 * Projetado para prevenir que a gravação do log interrompa o fluxo principal caso falhe.
 */
export async function logSecurityEvent(payload: AuditLogPayload) {
  try {
    // Tenta pegar o ID do usuário atual, se houver sessão
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Coleta dados básicos do cliente (User-Agent)
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Server';

    // Grava o log assincronamente (não bloqueante)
    const { error } = await supabase.from('security_audit_logs').insert({
      action: payload.action,
      module: payload.module,
      target_id: payload.target_id || null,
      details: payload.details || {},
      severity: payload.severity || 'info',
      user_id: userId || null,
      user_agent: userAgent,
    });

    if (error) {
      console.error('[Security Audit] Falha ao gravar log de auditoria:', error);
    }
  } catch (err) {
    console.error('[Security Audit] Erro fatal ao tentar gravar log:', err);
  }
}
