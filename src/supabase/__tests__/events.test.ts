import { describe, expect, it } from 'vitest';

import { setAnalyticsUser, trackEvent, trackScoreEditOnce } from '../events';

// Sem env de Supabase no ambiente de teste, `supabase` é null. A telemetria
// é best-effort: precisa ser no-op silencioso, nunca lançar (ADR 0005).
describe('events (telemetria best-effort)', () => {
  it('não lança e é no-op sem Supabase configurado', () => {
    setAnalyticsUser('user-1');
    expect(() => trackEvent('app_open')).not.toThrow();
    expect(() => trackEvent('reset', { foo: 'bar' })).not.toThrow();
    expect(() => trackScoreEditOnce()).not.toThrow();
  });

  it('é no-op também sem sessão', () => {
    setAnalyticsUser(null);
    expect(() => trackEvent('admin_open')).not.toThrow();
  });
});
