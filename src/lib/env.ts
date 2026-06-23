import { z } from 'zod';

/**
 * Validação centralizada das variáveis de ambiente (Vite, prefixo `VITE_`).
 * Este é o ÚNICO arquivo autorizado a ler `import.meta.env` — o ESLint proíbe
 * leituras diretas em qualquer outro lugar, então o schema é a fonte única.
 *
 * As chaves do Supabase são OPCIONAIS: sem elas, o app roda 100% client-side
 * (sem login/realtime). A `service_role` NUNCA entra aqui — ela é server-only.
 */
const schema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  // Não derruba o app: loga e segue sem backend.
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
}

export const env: z.infer<typeof schema> = parsed.success ? parsed.data : {};

/** true quando há credenciais do Supabase configuradas. */
export const hasSupabaseEnv = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
