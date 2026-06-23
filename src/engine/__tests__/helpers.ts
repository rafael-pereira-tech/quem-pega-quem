import type { GroupId, GroupMatch, MatchCards, Round, Team, TeamId } from "../types";

let fifaCounter = 100;

/** Cria uma seleção. fifaRanking auto-incrementa (distinto) se omitido. */
export function team(id: TeamId, group: GroupId, fifaRanking?: number): Team {
  return {
    id,
    name: id,
    group,
    fifaRanking: fifaRanking ?? fifaCounter++,
  };
}

interface MatchOpts {
  cards?: Partial<Record<TeamId, MatchCards>>;
}

/** Cria um jogo da fase de grupos. */
export function match(
  group: GroupId,
  round: Round,
  home: TeamId,
  away: TeamId,
  homeGoals: number | null,
  awayGoals: number | null,
  opts: MatchOpts = {},
): GroupMatch {
  return {
    id: `${group}-${home}-${away}`,
    group,
    round,
    home,
    away,
    homeGoals,
    awayGoals,
    ...(opts.cards ? { cards: opts.cards } : {}),
  };
}

/**
 * Gera o turno único (todos contra todos) de um grupo a partir de uma lista de
 * resultados [home, away, hg, ag]. Round é só decorativo aqui.
 */
export function roundRobin(
  group: GroupId,
  results: Array<[TeamId, TeamId, number, number]>,
): GroupMatch[] {
  return results.map(([h, a, hg, ag], i) =>
    match(group, ((i % 3) + 1) as Round, h, a, hg, ag),
  );
}
