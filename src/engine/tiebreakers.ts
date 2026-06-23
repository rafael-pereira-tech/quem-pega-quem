import { computeRecords } from './records';

import type { GroupMatch, RankedTeam, Team, TeamId, TeamRecord, TiebreakCriterion } from './types';

// ============================================================================
// Desempate da fase de grupos — ordem oficial 2026:
//   1. Pontos
//   --- entre as empatadas em pontos (mini-tabela do confronto direto): ---
//   2. Pontos no confronto direto
//   3. Saldo de gols no confronto direto
//   4. Gols marcados no confronto direto
//   --- persistindo, geral: ---
//   5. Saldo de gols geral
//   6. Gols marcados geral
//   7. Fair play
//   8. Ranking FIFA  (sempre separa)
//
// REGRA-CHAVE (recursiva): se o confronto direto separar ALGUMAS mas não TODAS,
// re-aplica-se a escada DO TOPO apenas no subconjunto que continua empatado —
// e o confronto direto é RECALCULADO somente entre as seleções desse
// subconjunto menor.
// ============================================================================

type H2HCrit = 'h2hPoints' | 'h2hGoalDiff' | 'h2hGoalsFor';
type OverallCrit = 'goalDiff' | 'goalsFor' | 'fairPlay' | 'fifaRanking';

const H2H_CRITS: readonly H2HCrit[] = ['h2hPoints', 'h2hGoalDiff', 'h2hGoalsFor'];
const OVERALL_CRITS: readonly OverallCrit[] = ['goalDiff', 'goalsFor', 'fairPlay', 'fifaRanking'];

interface Entry {
  team: TeamId;
  decidedBy: TiebreakCriterion; // por que está ABAIXO da seleção imediatamente acima
}

function h2hValue(rec: TeamRecord, c: H2HCrit): number {
  switch (c) {
    case 'h2hPoints':
      return rec.points;
    case 'h2hGoalDiff':
      return rec.goalDiff;
    case 'h2hGoalsFor':
      return rec.goalsFor;
  }
}

function overallValue(rec: TeamRecord, team: Team, c: OverallCrit): number {
  switch (c) {
    case 'goalDiff':
      return rec.goalDiff;
    case 'goalsFor':
      return rec.goalsFor;
    case 'fairPlay':
      return rec.fairPlay;
    case 'fifaRanking':
      return -team.fifaRanking; // menor ranking = melhor
  }
}

/** Ordena (melhor→pior) e agrupa em "baldes" de seleções iguais em TODOS os critérios. */
function partitionByCrits<C extends string>(
  ids: TeamId[],
  crits: readonly C[],
  valueOf: (id: TeamId, c: C) => number,
): TeamId[][] {
  const sorted = [...ids].sort((a, b) => {
    for (const c of crits) {
      const d = valueOf(b, c) - valueOf(a, c);
      if (d !== 0) return d;
    }
    return a < b ? -1 : a > b ? 1 : 0; // fallback determinístico
  });

  const buckets: TeamId[][] = [];
  for (const id of sorted) {
    const last = buckets[buckets.length - 1];
    if (last && crits.every((c) => valueOf(last[0]!, c) === valueOf(id, c))) {
      last.push(id);
    } else {
      buckets.push([id]);
    }
  }
  return buckets;
}

function firstDiffCrit<C extends string>(
  crits: readonly C[],
  valueOf: (id: TeamId, c: C) => number,
  a: TeamId,
  b: TeamId,
): C | null {
  for (const c of crits) {
    if (valueOf(a, c) !== valueOf(b, c)) return c;
  }
  return null;
}

/**
 * Ordena um grupo (4 seleções) aplicando toda a escada de desempate.
 * Retorna a tabela 1º..4º com `position`, registro completo e `decidedBy`.
 */
export function orderGroup(teams: Team[], groupMatches: GroupMatch[]): RankedTeam[] {
  const overall = computeRecords(teams, groupMatches);
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  const overallValueOf = (id: TeamId, c: OverallCrit): number =>
    overallValue(overall.get(id)!, teamsById.get(id)!, c);

  // --- subconjunto empatado em pontos resolvido pela escada (recursivo) ---
  function resolve(subset: TeamId[]): Entry[] {
    if (subset.length === 1) {
      return [{ team: subset[0]!, decidedBy: 'points' }];
    }

    // Fase A — confronto direto RECALCULADO só entre as do subconjunto.
    const subsetTeams = subset.map((id) => teamsById.get(id)!);
    const inSubset = new Set(subset);
    const h2hMatches = groupMatches.filter((m) => inSubset.has(m.home) && inSubset.has(m.away));
    const h2hRec = computeRecords(subsetTeams, h2hMatches);
    const h2hValueOf = (id: TeamId, c: H2HCrit): number => h2hValue(h2hRec.get(id)!, c);

    const buckets = partitionByCrits(subset, H2H_CRITS, h2hValueOf);

    if (buckets.length === 1) {
      // confronto direto não separou ninguém → vai pros critérios gerais
      return resolveOverall(subset);
    }

    // separação (total ou parcial): re-aplica a escada DO TOPO em cada balde
    const out: Entry[] = [];
    const innerLengths: number[] = [];
    for (const bucket of buckets) {
      const inner = resolve(bucket); // recursão recomputa o H2H no subconjunto menor
      innerLengths.push(inner.length);
      out.push(...inner);
    }

    // decidedBy nas FRONTEIRAS entre baldes (separação por confronto direto)
    let idx = 0;
    for (let k = 0; k < buckets.length; k++) {
      idx += innerLengths[k]!;
      if (k < buckets.length - 1) {
        const upper = out[idx - 1]!;
        const lower = out[idx]!;
        lower.decidedBy =
          firstDiffCrit(H2H_CRITS, h2hValueOf, upper.team, lower.team) ?? 'h2hPoints';
      }
    }
    return out;
  }

  // --- critérios gerais (5..8); ranking FIFA garante ordem total ---
  function resolveOverall(subset: TeamId[]): Entry[] {
    const buckets = partitionByCrits(subset, OVERALL_CRITS, overallValueOf);
    const out: Entry[] = [];
    for (const bucket of buckets) {
      for (const id of bucket) out.push({ team: id, decidedBy: 'fifaRanking' });
    }
    for (let i = 1; i < out.length; i++) {
      out[i]!.decidedBy =
        firstDiffCrit(OVERALL_CRITS, overallValueOf, out[i - 1]!.team, out[i]!.team) ?? 'teamId';
    }
    return out;
  }

  // --- nível 1: agrupa por PONTOS, resolve cada bloco empatado ---
  const allIds = teams.map((t) => t.id);
  const pointsBlocks = partitionByCrits(
    allIds,
    ['points'] as const,
    (id) => overall.get(id)!.points,
  );

  const entries: Entry[] = [];
  const blockStarts: number[] = [];
  for (const block of pointsBlocks) {
    blockStarts.push(entries.length);
    entries.push(...resolve(block));
  }
  // o primeiro de cada bloco de pontos é separado do bloco acima por PONTOS
  for (const start of blockStarts) entries[start]!.decidedBy = 'points';

  return entries.map((e, i) => ({
    ...overall.get(e.team)!,
    position: i + 1,
    decidedBy: e.decidedBy,
  }));
}
