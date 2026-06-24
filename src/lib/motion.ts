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
