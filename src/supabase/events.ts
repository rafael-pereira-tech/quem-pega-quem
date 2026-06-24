import { supabase } from './client';

/** Conjunto mínimo e fechado de eventos de uso (ver ADR 0005). */
export type EventName = 'app_open' | 'score_edit' | 'reset' | 'admin_open';

let currentUserId: string | null = null;
let scoreEditTracked = false;

/** Define a sessão (anônima) à qual os eventos serão atribuídos. */
export function setAnalyticsUser(userId: string | null): void {
  currentUserId = userId;
}

/**
 * Registra um evento de uso (append-only, fire-and-forget). Telemetria é
 * best-effort: nunca bloqueia nem quebra a UI, engole erros, e é no-op sem
 * Supabase configurado ou sem sessão. A RLS garante `user_id = auth.uid()`.
 */
export function trackEvent(name: EventName, props: Record<string, unknown> = {}): void {
  if (!supabase || !currentUserId) return;
  void supabase
    .from('events')
    .insert({ user_id: currentUserId, name, props })
    .then(
      ({ error }) => {
        if (error) console.debug('trackEvent falhou', name, error.message);
      },
      () => {
        /* rede caiu: telemetria é descartável */
      },
    );
}

/**
 * Primeira edição de placar da sessão = sinal de engajamento; registra uma vez
 * só. Não marca como registrado enquanto não houver sessão, para não perder o
 * evento se a edição acontecer antes do login anônimo resolver.
 */
export function trackScoreEditOnce(): void {
  if (scoreEditTracked || !currentUserId) return;
  scoreEditTracked = true;
  trackEvent('score_edit');
}
