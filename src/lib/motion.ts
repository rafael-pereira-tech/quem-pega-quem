/** true quando o usuário pediu menos movimento (preferência do SO/navegador).
 *  A regra CSS global de reduced-motion não alcança a Web Animations API, então
 *  quem anima via `element.animate()` precisa checar isto explicitamente. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Faz um elemento "entrar deslizando" no sentido de `fromX` (px): translada de
 *  fromX→0 com um leve fade. No-op com reduced-motion ou sem WAAPI (jsdom/SSR). */
export function slideIn(el: HTMLElement, fromX: number, duration = 260): void {
  if (prefersReducedMotion() || typeof el.animate !== 'function') return;
  el.animate(
    [
      { transform: `translateX(${fromX}px)`, opacity: 0.25 },
      { transform: 'translateX(0)', opacity: 1 },
    ],
    { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  );
}
