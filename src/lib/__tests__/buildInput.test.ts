import { describe, expect, it } from 'vitest';

import { staticData } from '../../data/static';
import {
  buildSimulationInput,
  effectiveGroupMatches,
  emptyScenario,
  isLocked,
  type OfficialResult,
  type ScenarioData,
} from '../buildInput';

const playedSeed = staticData.seedMatches.find(
  (m) => m.homeGoals !== null && m.awayGoals !== null,
)!;

describe('effectiveGroupMatches — fusão oficial > seed > palpite', () => {
  it('retorna todos os jogos-semente', () => {
    expect(effectiveGroupMatches(emptyScenario(), {})).toHaveLength(staticData.seedMatches.length);
  });

  it('jogo já jogado (seed) fica travado e mantém o placar real', () => {
    const m = effectiveGroupMatches(emptyScenario(), {}).find((x) => x.id === playedSeed.id)!;
    expect(m.locked).toBe(true);
    expect(m.homeGoals).toBe(playedSeed.homeGoals);
    expect(m.awayGoals).toBe(playedSeed.awayGoals);
  });

  it('torneio completo: nenhum jogo aberto, todos os 72 travados', () => {
    const matches = effectiveGroupMatches(emptyScenario(), {});
    expect(matches.every((m) => m.locked)).toBe(true);
    expect(matches.some((m) => m.homeGoals === null || m.awayGoals === null)).toBe(false);
  });

  it('palpite não sobrescreve seed jogado', () => {
    const scenario: ScenarioData = {
      ...emptyScenario(),
      groupScores: { [playedSeed.id]: { homeGoals: 9, awayGoals: 9 } },
    };
    const m = effectiveGroupMatches(scenario, {}).find((x) => x.id === playedSeed.id)!;
    expect(m.homeGoals).toBe(playedSeed.homeGoals);
    expect(m.awayGoals).toBe(playedSeed.awayGoals);
    expect(m.locked).toBe(true);
  });

  it('oficial travado vence o seed jogado e traz cartões', () => {
    const official: Record<string, OfficialResult> = {
      [playedSeed.id]: {
        matchId: playedSeed.id,
        phase: 'group',
        homeGoals: 3,
        awayGoals: 0,
        cards: { [playedSeed.home]: { yellow: 2 } },
        locked: true,
      },
    };
    const scenario: ScenarioData = {
      ...emptyScenario(),
      groupScores: { [playedSeed.id]: { homeGoals: 1, awayGoals: 1 } },
    };
    const m = effectiveGroupMatches(scenario, official).find((x) => x.id === playedSeed.id)!;
    expect(m.locked).toBe(true);
    expect(m.homeGoals).toBe(3);
    expect(m.awayGoals).toBe(0);
    expect(m.cards?.[playedSeed.home]?.yellow).toBe(2);
  });
});

describe('isLocked', () => {
  it('só é true quando há oficial com locked', () => {
    expect(isLocked({}, 'x')).toBe(false);
    expect(
      isLocked(
        { x: { matchId: 'x', phase: 'group', homeGoals: null, awayGoals: null, locked: false } },
        'x',
      ),
    ).toBe(false);
    expect(
      isLocked(
        { x: { matchId: 'x', phase: 'group', homeGoals: 1, awayGoals: 0, locked: true } },
        'x',
      ),
    ).toBe(true);
  });
});

describe('buildSimulationInput', () => {
  it('repassa teams/annexC/structure estáticos e as partidas efetivas', () => {
    const input = buildSimulationInput(emptyScenario(), {});
    expect(input.teams).toBe(staticData.teams);
    expect(input.annexC).toBe(staticData.annexC);
    expect(input.structure).toBe(staticData.structure);
    expect(input.matches).toHaveLength(staticData.seedMatches.length);
  });

  it('oficial travado vence o seed do mata-mata', () => {
    const koId = staticData.structure[0]!.id;
    const official: Record<string, OfficialResult> = {
      [koId]: {
        matchId: koId,
        phase: 'knockout',
        homeGoals: 1,
        awayGoals: 0,
        homePens: null,
        awayPens: null,
        locked: true,
      },
    };
    const input = buildSimulationInput(emptyScenario(), official);
    expect(input.knockoutResults?.[koId]).toMatchObject({
      homeGoals: 1,
      awayGoals: 0,
      locked: true,
    });
  });

  it('seed do mata-mata entra travado e sombreia o palpite', () => {
    // jogo 74: Alemanha 1–1 Paraguai, pênaltis 3–4
    const scenario: ScenarioData = {
      ...emptyScenario(),
      koScores: { 74: { homeGoals: 2, awayGoals: 2, penalties: { home: 4, away: 3 } } },
    };
    const input = buildSimulationInput(scenario, {});
    expect(input.knockoutResults?.['74']).toMatchObject({
      homeGoals: 1,
      awayGoals: 1,
      penalties: { home: 3, away: 4 },
      locked: true,
    });
  });

  it('inclui pênaltis oficiais quando ambos definidos', () => {
    const koId = staticData.structure[0]!.id;
    const official: Record<string, OfficialResult> = {
      [koId]: {
        matchId: koId,
        phase: 'knockout',
        homeGoals: 1,
        awayGoals: 1,
        homePens: 5,
        awayPens: 4,
        locked: true,
      },
    };
    const input = buildSimulationInput(emptyScenario(), official);
    expect(input.knockoutResults?.[koId]?.penalties).toEqual({ home: 5, away: 4 });
  });
});
