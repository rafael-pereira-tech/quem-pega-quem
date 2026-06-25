import type { GroupId, GroupMatch } from '../engine/types';

/**
 * Primeiro grupo (na ordem dada) com um jogo da rodada 3 ainda NÃO encerrado
 * (ao vivo ou a jogar). Usado pelo auto-scroll, que pula os jogos já jogados.
 */
export function firstActiveRound3Group(
  order: GroupId[],
  byGroup: Map<GroupId, GroupMatch[]>,
): GroupId | null {
  for (const g of order) {
    const matches = byGroup.get(g) ?? [];
    if (matches.some((m) => m.round === 3 && !m.locked)) return g;
  }
  return null;
}
