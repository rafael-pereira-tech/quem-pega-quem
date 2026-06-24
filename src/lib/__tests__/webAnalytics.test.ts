// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { mountCloudflareBeacon } from '../webAnalytics';

afterEach(() => {
  document.querySelectorAll('script[data-cf-beacon]').forEach((s) => s.remove());
});

describe('mountCloudflareBeacon', () => {
  it('não injeta nada sem token', () => {
    mountCloudflareBeacon(undefined);
    expect(document.querySelector('script[data-cf-beacon]')).toBeNull();
  });

  it('injeta o beacon do Cloudflare com o token quando presente', () => {
    mountCloudflareBeacon('abc123');
    const s = document.querySelector('script[data-cf-beacon]') as HTMLScriptElement | null;
    expect(s).not.toBeNull();
    expect(s!.src).toContain('static.cloudflareinsights.com/beacon.min.js');
    expect(s!.getAttribute('data-cf-beacon')).toBe('{"token":"abc123"}');
  });

  it('é idempotente: não duplica o beacon', () => {
    mountCloudflareBeacon('abc123');
    mountCloudflareBeacon('abc123');
    expect(document.querySelectorAll('script[data-cf-beacon]')).toHaveLength(1);
  });
});
