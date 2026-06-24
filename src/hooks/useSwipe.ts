import { useRef } from 'react';

import type { TouchEvent } from 'react';

const THRESHOLD = 45; // px mínimos no eixo X para contar como swipe

/**
 * Detecta swipe horizontal por toque. Mede só no início/fim (touchstart/end),
 * sem `preventDefault`, então não atrapalha a rolagem vertical: só dispara
 * quando o movimento é claramente horizontal (|dx| > limiar e > |dy|).
 *
 * Quando age, chama `stopPropagation`: assim, com áreas de swipe aninhadas, a
 * de dentro consome o gesto e a de fora não dispara junto (ex.: trocar de
 * rodada num card vence a troca de aba do contêiner externo).
 *
 * Retorna handlers para espalhar no contêiner alvo.
 */
export function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0];
      start.current = t ? { x: t.clientX, y: t.clientY } : null;
    },
    onTouchEnd: (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      const t = e.changedTouches[0];
      if (!s || !t) return;
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (Math.abs(dx) < THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
      e.stopPropagation();
      (dx < 0 ? onLeft : onRight)();
    },
  };
}
