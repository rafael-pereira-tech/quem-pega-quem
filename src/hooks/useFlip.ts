import { useLayoutEffect, useRef } from 'react';

import { prefersReducedMotion } from '../lib/motion';

const DURATION = 340;
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Anima a reordenação de uma lista pela técnica FLIP: mede a posição de cada
 * filho marcado com `[data-flip-key]` antes e depois do re-render e desliza a
 * diferença até zero — dando a sensação de o item "viajar" para o novo posto.
 *
 * Detalhes que importam:
 * - mede com `offsetTop/offsetLeft` (relativos ao offsetParent), que IGNORAM
 *   transforms — então medir durante uma animação em curso não corrompe a
 *   próxima (`getBoundingClientRect` incluiria o transform e quebraria isso);
 * - cancela a animação anterior do mesmo elemento antes de iniciar outra, para
 *   atualizações em sequência (ex.: placares ao vivo) não empilharem;
 * - no-op com `prefers-reduced-motion` ou sem Web Animations API (jsdom/SSR).
 *
 * `key` deve mudar quando a ORDEM muda (passe a sequência das chaves), para o
 * efeito recalcular só quando há reordenação.
 *
 * Retorna o ref para pôr no contêiner (a linha de pills, o `<tbody>`, ...).
 */
export function useFlip<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null);
  const prev = useRef(new Map<string, { top: number; left: number }>());
  const running = useRef(new WeakMap<HTMLElement, Animation>());

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;

    const items = Array.from(container.querySelectorAll<HTMLElement>('[data-flip-key]'));
    const animate = !prefersReducedMotion() && typeof container.animate === 'function';
    const next = new Map<string, { top: number; left: number }>();

    for (const el of items) {
      const k = el.dataset.flipKey;
      if (!k) continue;
      const pos = { top: el.offsetTop, left: el.offsetLeft };
      next.set(k, pos);

      const old = prev.current.get(k);
      if (!animate || !old) continue;
      const dx = old.left - pos.left;
      const dy = old.top - pos.top;
      if (!dx && !dy) continue;

      running.current.get(el)?.cancel();
      const anim = el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
        { duration: DURATION, easing: EASING },
      );
      running.current.set(el, anim);
    }

    prev.current = next;
  }, [key]);

  return ref;
}
