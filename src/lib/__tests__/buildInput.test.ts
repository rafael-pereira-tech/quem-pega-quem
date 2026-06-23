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
const openSeed = staticData.seedMatches.find((m) => m.homeGoals === null && m.awayGoals === null)!;

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

  it('jogo aberto sem palpite: null e editável', () => {
    const m = effectiveGroupMatches(emptyScenario(), {}).find((x) => x.id === openSeed.id)!;
    expect(m.locked).toBe(false);
    expect(m.homeGoals).toBeNull();
    expect(m.awayGoals).toBeNull();
  });

  it('palpite preenche um jogo aberto sem travar', () => {
    const scenario: ScenarioData = {
      ...emptyScenario(),
      groupScores: { [openSeed.id]: { homeGoals: 2, awayGoals: 1 } },
    };
    const m = effectiveGroupMatches(scenario, {}).find((x) => x.id === openSeed.id)!;
    expect(m.homeGoals).toBe(2);
    expect(m.awayGoals).toBe(1);
    expect(m.locked).toBe(false);
  });

  it('oficial travado vence seed e palpite, e traz cartões', () => {
    const official: Record<string, OfficialResult> = {
      [openSeed.id]: {
        matchId: openSeed.id,
        phase: 'group',
        homeGoals: 3,
        awayGoals: 0,
        cards: { [openSeed.home]: { yellow: 2 } },
        locked: true,
      },
    };
    const scenario: ScenarioData = {
      ...emptyScenario(),
      groupScores: { [openSeed.id]: { homeGoals: 1, awayGoals: 1 } },
    };
    const m = effectiveGroupMatches(scenario, official).find((x) => x.id === openSeed.id)!;
    expect(m.locked).toBe(true);
    expect(m.homeGoals).toBe(3);
    expect(m.awayGoals).toBe(0);
    expect(m.cards?.[openSeed.home]?.yellow).toBe(2);
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

  it('inclui mata-mata oficial (travado) e palpite de KO', () => {
    const koId = staticData.structure[0]!.id;
    const koId2 = staticData.structure[1]!.id;
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
    const scenario: ScenarioData = {
      ...emptyScenario(),
      koScores: { [koId2]: { homeGoals: 2, awayGoals: 2, penalties: { home: 4, away: 3 } } },
    };
    const input = buildSimulationInput(scenario, official);
    expect(input.knockoutResults?.[koId]).toMatchObject({
      homeGoals: 1,
      awayGoals: 0,
      locked: true,
    });
    expect(input.knockoutResults?.[koId2]).toMatchObject({ homeGoals: 2, awayGoals: 2 });
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
