import { FAIR_PLAY_POINTS, type MatchCards } from "./types";

/**
 * Pontuação fair play de uma seleção num único jogo (≤ 0; maior = melhor).
 * Cada contador representa o pior evento aplicável a um jogador distinto.
 */
export function fairPlayForMatch(cards: MatchCards | undefined): number {
  if (!cards) return 0;
  const yellow = cards.yellow ?? 0;
  const secondYellow = cards.secondYellow ?? 0;
  const directRed = cards.directRed ?? 0;
  const yellowAndDirectRed = cards.yellowAndDirectRed ?? 0;
  return (
    yellow * FAIR_PLAY_POINTS.yellow +
    secondYellow * FAIR_PLAY_POINTS.secondYellow +
    directRed * FAIR_PLAY_POINTS.directRed +
    yellowAndDirectRed * FAIR_PLAY_POINTS.yellowAndDirectRed
  );
}
