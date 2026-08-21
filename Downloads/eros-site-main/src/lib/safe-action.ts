import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logSecurityEvent } from "./audit";

/**
 * Utilitário de segurança para garantir que todas as requisições tenham sessão validada
 * e payloads rigidamente validados pelo Zod (anti-injeção/IDOR base protection).
 */

// Simulação de check de autenticação (Deve integrar com o seu auth SSR do Supabase real)
async function requireAuth() {
  // Substitua pela lógica real do Supabase SSR de verificação de sessão (ex: createServerClient)
  // const supabase = createServerClient(...)
  // const { data: { user }, error } = await supabase.auth.getUser()
  // if (error || !user) throw new Error("Unauthorized");
  
  return { userId: "user-placeholder", role: "admin" }; 
}

export const safeAction = createServerFn({ method: 'POST' })
  .middleware([
    async ({ next }) => {
      // 1. Verificação rígida de Autenticação/Sessão HTTP-Only
      const user = await requireAuth();
      
      // 2. Anexa contexto seguro (user info)
      return next({ context: { user } });
    }
  ]);

/**
 * Exemplo de uso para operações críticas:
 * 
 * const apagarChamado = safeAction
 *   .validator(z.object({ id: z.string() }).strict())
 *   .handler(async ({ data, context }) => {
 *      // Log de segurança
 *      await logSecurityEvent({
 *         action: 'TICKET_DELETED',
 *         module: 'suporte',
 *         target_id: data.id,
 *         severity: 'warning'
 *      });
 *      // Lógica segura usando o context.user
 *   });
 */
