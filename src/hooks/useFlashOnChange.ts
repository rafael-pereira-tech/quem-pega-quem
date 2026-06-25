import { useEffect, useRef } from 'react';

import { prefersReducedMotion } from '../lib/motion';

/** Quanto tempo a borda destacada leva pra desbotar de volta ao normal (ms). */
const FLASH_MS = 3000;
/** Lime (#c6f24e = rgb 198 242 78) da marca — mesma cor que destaca vencedores.
 *  Literal aqui (e não `var(--color-lime)`) porque o WAAPI precisa de cores
 *  concretas pra interpolar o alpha do box-shadow de forma confiável. */
const LIME = (alpha: number) => `rgba(198, 242, 78, ${alpha})`;

/**
 * Quando `signature` MUDA de um valor para outro, destaca a borda do elemento
 * em lime e a desbota de volta ao normal em ~3s, via Web Animations API — o
 * feedback de "isto mudou por causa do placar que você acabou de mexer".
 *
 * Detalhes que importam:
 * - ignora o primeiro render (sem assinatura anterior ⇒ nada pisca no load);
 * - o box-shadow é animado (não a `border`), então some sozinho ao fim sem
 *   deixar layout shift e funciona tanto no card com `ring` (mobile) quanto no
 *   com `border` inline (desktop);
 * - no-op com `prefers-reduced-motion` ou sem WAAPI (jsdom/SSR) — a regra CSS
 *   global de reduced-motion não alcança o WAAPI, daí a checagem explícita;
 * - a animação anterior é cancelada quando a assinatura muda de novo, pra
 *   atualizações em sequência não empilharem.
 *
 * `signature` deve resumir o que conta como mudança visível do card (ex.: os
 * times resolvidos de cada lado + o vencedor do jogo).
 *
 * Retorna o ref pra pôr no elemento cuja borda deve piscar.
 */
export function useFlashOnChange<T extends HTMLElement>(signature: string) {
  const ref = useRef<T>(null);
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const changed = prev.current !== null && prev.current !== signature;
    prev.current = signature;

    const el = ref.current;
    if (!changed || !el || prefersReducedMotion() || typeof el.animate !== 'function') return;

    const anim = el.animate(
      [
        { boxShadow: `0 0 0 2px ${LIME(0.95)}, 0 0 12px 1px ${LIME(0.45)}` },
        { boxShadow: `0 0 0 2px ${LIME(0)}, 0 0 12px 1px ${LIME(0)}` },
      ],
      { duration: FLASH_MS, easing: 'ease-out' },
    );
    return () => anim.cancel();
  }, [signature]);

  return ref;
}
