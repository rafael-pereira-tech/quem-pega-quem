import { FAIR_PLAY_POINTS, type MatchCards, type TeamId } from '../engine/types';

/**
 * Contadores de cartões de uma seleção, no vocabulário do fair-play (critério 7).
 * `y` amarelo isolado · `yy` 2º amarelo · `r` vermelho direto · `yr` amarelo +
 * vermelho direto. O modo simples do admin usa só `y`/`r`; o detalhado, os 4.
 */
export interface CardCounts {
  y: number | null;
  yy: number | null;
  r: number | null;
  yr: number | null;
}

export const EMPTY_CARDS: CardCounts = { y: null, yy: null, r: null, yr: null };

function toMatchCards(c: CardCounts): MatchCards | null {
  const m: MatchCards = {};
  if (c.y) m.yellow = c.y;
  if (c.yy) m.secondYellow = c.yy;
  if (c.r) m.directRed = c.r;
  if (c.yr) m.yellowAndDirectRed = c.yr;
  return Object.keys(m).length ? m : null;
}

/** Lê os contadores de volta de um `MatchCards` (para reidratar o draft). */
export function countsOf(c: MatchCards | undefined): CardCounts {
  return {
    y: c?.yellow ?? null,
    yy: c?.secondYellow ?? null,
    r: c?.directRed ?? null,
    yr: c?.yellowAndDirectRed ?? null,
  };
}

/** Monta o `cards` (por seleção) de um resultado oficial; só inclui quem teve
 *  cartão. Cobre os 4 tipos do fair-play (ver ADR 0006). */
export function buildCards(
  home: TeamId,
  away: TeamId,
  h: CardCounts,
  a: CardCounts,
): Record<string, MatchCards> | null {
  const cards: Record<string, MatchCards> = {};
  const hm = toMatchCards(h);
  const am = toMatchCards(a);
  if (hm) cards[home] = hm;
  if (am) cards[away] = am;
  return Object.keys(cards).length ? cards : null;
}

/** Pontuação fair play (≤ 0) dos contadores — para o preview no admin. */
export function fairPlayOf(c: CardCounts): number {
  const total =
    (c.y ?? 0) * FAIR_PLAY_POINTS.yellow +
    (c.yy ?? 0) * FAIR_PLAY_POINTS.secondYellow +
    (c.r ?? 0) * FAIR_PLAY_POINTS.directRed +
    (c.yr ?? 0) * FAIR_PLAY_POINTS.yellowAndDirectRed;
  return total === 0 ? 0 : total; // evita -0
}

/** Cartões EXIBIDOS (para mostrar ao usuário), derivados dos eventos do
 *  fair-play: um 2º amarelo = 2 amarelos + 1 vermelho; amarelo+vermelho = 1 de
 *  cada. */
export function shownCards(c: MatchCards | undefined): { yellow: number; red: number } {
  const yy = c?.secondYellow ?? 0;
  return {
    yellow: (c?.yellow ?? 0) + (c?.yellowAndDirectRed ?? 0) + 2 * yy,
    red: yy + (c?.directRed ?? 0) + (c?.yellowAndDirectRed ?? 0),
  };
}
