import type { MatchCards, TeamId } from '../engine/types';

interface CardCounts {
  hy: number | null; // amarelos casa
  hr: number | null; // vermelhos casa
  ay: number | null; // amarelos fora
  ar: number | null; // vermelhos fora
}

/**
 * Monta o `cards` (por seleção) de um resultado oficial a partir dos contadores
 * simples do admin; só inclui a seleção que teve cartão. Modo simples: amarelo
 * → `yellow`, vermelho → `directRed` (ver ADR 0006).
 */
export function buildCards(
  home: TeamId,
  away: TeamId,
  v: CardCounts,
): Record<string, MatchCards> | null {
  const cards: Record<string, MatchCards> = {};
  if (v.hy || v.hr) cards[home] = { yellow: v.hy ?? 0, directRed: v.hr ?? 0 };
  if (v.ay || v.ar) cards[away] = { yellow: v.ay ?? 0, directRed: v.ar ?? 0 };
  return Object.keys(cards).length ? cards : null;
}
