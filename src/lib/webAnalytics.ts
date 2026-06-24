import { env } from './env';

/**
 * Monta o beacon do Cloudflare Web Analytics em runtime — só quando há token
 * (`VITE_CF_BEACON_TOKEN`, setado nas env vars do Cloudflare Pages). Sem token
 * (dev local, preview sem a env) é no-op: nada de placeholder no HTML nem
 * chamada de rede. Idempotente. Ver ADR 0005.
 *
 * O token é passável como argumento só para teste; em produção vem do `env`.
 */
export function mountCloudflareBeacon(token: string | undefined = env.VITE_CF_BEACON_TOKEN): void {
  if (!token || typeof document === 'undefined') return;
  if (document.querySelector('script[data-cf-beacon]')) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  document.head.appendChild(script);
}
