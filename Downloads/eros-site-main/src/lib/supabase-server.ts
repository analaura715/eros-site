import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getCookie, setCookie } from 'vinxi/http'; // Para TanStack Start/Nitro

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return getCookie(name);
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          // Garante que cookies de autenticação sejam HTTP-Only e Secure
          setCookie(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });
        } catch (error) {
          // O `setCookie` foi chamado em um contexto de componente de servidor
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          setCookie(name, '', { ...options, maxAge: 0 });
        } catch (error) {
          // Ignorado
        }
      },
    },
  });
}
