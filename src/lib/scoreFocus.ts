import { prefersReducedMotion } from './motion';

import type { FocusEvent, KeyboardEvent } from 'react';

/**
 * Navegação por teclado e auto-scroll entre os campos de placar.
 *
 * Todo input de placar (Stepper na fase de grupos, ScoreBox no mata-mata) é
 * marcado com `data-score-field`. Isso deixa tratar todos os placares VISÍVEIS
 * como uma sequência única, na ordem do DOM — que é a ordem visual e a ordem de
 * Tab — sem precisar costurar refs entre componentes distantes.
 *
 * Os botões +/− do Stepper saem da ordem de Tab (`tabIndex={-1}`), então Tab
 * vai de placar em placar (casa → fora → próximo jogo). O ajuste fino pelo
 * teclado continua possível: ↑/↓ no input (spinbutton nativo) ou os botões.
 */

const SELECTOR = 'input[data-score-field]';

/**
 * Rola o campo para dentro do contêiner rolável mais próximo, e só se ele
 * estiver fora de vista (`block: 'nearest'` não mexe quando já está visível).
 * Suave, a menos que o usuário peça menos movimento.
 */
export function scrollScoreFieldIntoView(el: HTMLElement): void {
  if (typeof el.scrollIntoView !== 'function') return; // jsdom/SSR
  el.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

/**
 * Move o foco para o próximo (`dir = 1`) ou anterior (`dir = -1`) campo de
 * placar habilitado, na ordem do DOM. No-op nos extremos. Retorna se moveu.
 */
export function focusAdjacentScoreField(current: HTMLElement, dir: 1 | -1): boolean {
  if (typeof document === 'undefined') return false;
  const fields = Array.from(document.querySelectorAll<HTMLInputElement>(SELECTOR)).filter(
    (el) => !el.disabled,
  );
  const i = fields.indexOf(current as HTMLInputElement);
  if (i === -1) return false;
  const next = fields[i + dir];
  if (!next) return false;
  next.focus();
  next.select();
  return true;
}

function onScoreFieldFocus(e: FocusEvent<HTMLInputElement>): void {
  scrollScoreFieldIntoView(e.currentTarget);
}

function onScoreFieldKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
  // Enter avança para o próximo placar; Shift+Enter volta ao anterior.
  if (e.key === 'Enter') {
    e.preventDefault();
    focusAdjacentScoreField(e.currentTarget, e.shiftKey ? -1 : 1);
  }
}

/**
 * Props para espalhar no `<input>` de cada placar: marca o campo, rola até ele
 * ao focar e habilita o avanço com Enter. Compartilhado por Stepper e ScoreBox.
 */
export const scoreFieldProps = {
  'data-score-field': '',
  onFocus: onScoreFieldFocus,
  onKeyDown: onScoreFieldKeyDown,
} as const;
