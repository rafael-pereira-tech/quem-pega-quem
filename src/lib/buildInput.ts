import { staticData } from '../data/static';

import type { GroupMatch, KnockoutScore, MatchCards, SimulationInput } from '../engine/types';

// ---------------------------------------------------------------------------
// Camadas de dados:
//   - OFICIAL (admin/Supabase): trava o jogo quando `locked`.
//   - CENÁRIO (usuário): palpites pros jogos ainda abertos.
// O motor recebe a fusão: oficial-travado tem prioridade sobre o palpite.
// ---------------------------------------------------------------------------

export interface OfficialResult {
  matchId: string;
  phase: 'group' | 'knockout';
  homeGoals: number | null;
  awayGoals: number | null;
  homePens?: number | null;
  awayPens?: number | null;
  cards?: Partial<Record<string, MatchCards>> | null;
  locked: boolean;
}

export interface ScenarioData {
  /** matchId (jogo de grupo) → placar palpitado */
  groupScores: Record<string, { homeGoals: number | null; awayGoals: number | null }>;
  /** id do jogo de mata-mata → placar palpitado */
  koScores: Record<string, KnockoutScore>;
}

export const emptyScenario = (): ScenarioData => ({ groupScores: {}, koScores: {} });

export function isLocked(official: Record<string, OfficialResult>, matchId: string): boolean {
  return official[matchId]?.locked === true;
}

/**
 * Estado efetivo de cada jogo de grupo, fundindo as 3 camadas:
 *   oficial travado (admin) > resultado já jogado (seed) > palpite do usuário.
 * Jogos já jogados e oficiais ficam `locked` (read-only); o resto é editável.
 */
export function effectiveGroupMatches(
  scenario: ScenarioData,
  official: Record<string, OfficialResult>,
): GroupMatch[] {
  return staticData.seedMatches.map((m) => {
    const off = official[m.id];
    if (off?.locked) {
      return {
        ...m,
        homeGoals: off.homeGoals,
        awayGoals: off.awayGoals,
        ...(off.cards ? { cards: off.cards } : {}),
        locked: true,
      };
    }
    const seedPlayed = m.homeGoals !== null && m.awayGoals !== null;
    if (seedPlayed) return { ...m, locked: true }; // resultado real já aconteceu
    const guess = scenario.groupScores[m.id];
    return {
      ...m,
      homeGoals: guess?.homeGoals ?? null,
      awayGoals: guess?.awayGoals ?? null,
      locked: false,
    };
  });
}

export function buildSimulationInput(
  scenario: ScenarioData,
  official: Record<string, OfficialResult>,
): SimulationInput {
  const matches = effectiveGroupMatches(scenario, official);

  const knockoutResults: Record<string, KnockoutScore> = {};
  for (const game of staticData.structure) {
    const off = official[game.id];
    if (off?.locked) {
      knockoutResults[game.id] = {
        homeGoals: off.homeGoals,
        awayGoals: off.awayGoals,
        ...(off.homePens != null && off.awayPens != null
          ? { penalties: { home: off.homePens, away: off.awayPens } }
          : {}),
        locked: true,
      };
    } else if (scenario.koScores[game.id]) {
      knockoutResults[game.id] = scenario.koScores[game.id]!;
    }
  }

  return {
    teams: staticData.teams,
    matches,
    annexC: staticData.annexC,
    structure: staticData.structure,
    knockoutResults,
  };
}
