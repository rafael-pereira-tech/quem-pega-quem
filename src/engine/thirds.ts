import type {
  GroupId,
  GroupStanding,
  RankedThird,
  Team,
  TeamId,
  ThirdPlaceRanking,
  TiebreakCriterion,
} from "./types";

// Ranking dos 12 terceiros — SEM confronto direto (são de grupos diferentes):
//   1. Pontos  2. Saldo geral  3. Gols geral  4. Fair play  5. Ranking FIFA
const THIRD_CRITS = [
  "points",
  "goalDiff",
  "goalsFor",
  "fairPlay",
  "fifaRanking",
] as const;
type ThirdCrit = (typeof THIRD_CRITS)[number];

function valueOf(t: RankedThird, fifa: number, c: ThirdCrit): number {
  switch (c) {
    case "points":
      return t.points;
    case "goalDiff":
      return t.goalDiff;
    case "goalsFor":
      return t.goalsFor;
    case "fairPlay":
      return t.fairPlay;
    case "fifaRanking":
      return -fifa; // menor ranking = melhor
  }
}

export const THIRD_QUALIFIERS = 8;

/**
 * Cruza os 12 terceiros, rankeia e marca os 8 melhores como classificados.
 * `qualifiedGroups` é o conjunto ORDENADO dos 8 grupos — chave do Anexo C.
 */
export function rankThirds(
  standings: GroupStanding[],
  teamsById: Map<TeamId, Team>,
): ThirdPlaceRanking {
  const thirds: RankedThird[] = [];
  for (const s of standings) {
    const third = s.table[2];
    if (!third) continue;
    thirds.push({ ...third, rank: 0, qualified: false, decidedBy: "points" });
  }

  const fifaOf = (t: RankedThird): number => teamsById.get(t.team)?.fifaRanking ?? Infinity;

  thirds.sort((a, b) => {
    for (const c of THIRD_CRITS) {
      const d = valueOf(b, fifaOf(b), c) - valueOf(a, fifaOf(a), c);
      if (d !== 0) return d;
    }
    return a.team < b.team ? -1 : a.team > b.team ? 1 : 0;
  });

  thirds.forEach((t, i) => {
    t.rank = i + 1;
    t.qualified = i < THIRD_QUALIFIERS;
    if (i > 0) {
      const prev = thirds[i - 1]!;
      let by: TiebreakCriterion = "fifaRanking";
      for (const c of THIRD_CRITS) {
        if (valueOf(prev, fifaOf(prev), c) !== valueOf(t, fifaOf(t), c)) {
          by = c;
          break;
        }
      }
      t.decidedBy = by;
    }
  });

  const qualifiedGroups = thirds
    .filter((t) => t.qualified)
    .map((t) => t.group)
    .sort() as GroupId[];

  return { rows: thirds, qualifiedGroups };
}
