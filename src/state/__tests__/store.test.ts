// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { emptyScenario, type OfficialResult } from '../../lib/buildInput';
import { useStore } from '../store';

const s = () => useStore.getState();

beforeEach(() => {
  useStore.setState({ scenario: emptyScenario(), official: {} });
});

describe('store', () => {
  it('estado inicial: cenário e oficial vazios', () => {
    expect(s().scenario).toEqual({ groupScores: {}, koScores: {} });
    expect(s().official).toEqual({});
  });

  it('setGroupScore grava o palpite do jogo', () => {
    s().setGroupScore('A-R3-X-Y', 2, 1);
    expect(s().scenario.groupScores['A-R3-X-Y']).toEqual({ homeGoals: 2, awayGoals: 1 });
  });

  it('setKoScore cria com defaults e faz merge parcial', () => {
    s().setKoScore('73', { homeGoals: 1 });
    expect(s().scenario.koScores['73']).toEqual({ homeGoals: 1, awayGoals: null });

    s().setKoScore('73', { awayGoals: 2, penalties: { home: 5, away: 4 } });
    expect(s().scenario.koScores['73']).toEqual({
      homeGoals: 1,
      awayGoals: 2,
      penalties: { home: 5, away: 4 },
    });
  });

  it('setOfficial substitui o mapa oficial', () => {
    const off: Record<string, OfficialResult> = {
      '73': { matchId: '73', phase: 'knockout', homeGoals: 1, awayGoals: 0, locked: true },
    };
    s().setOfficial(off);
    expect(s().official).toEqual(off);
  });

  it('reset limpa o cenário, mas preserva o oficial', () => {
    s().setGroupScore('x', 1, 1);
    s().setOfficial({
      '73': { matchId: '73', phase: 'knockout', homeGoals: 1, awayGoals: 0, locked: true },
    });
    s().reset();
    expect(s().scenario).toEqual({ groupScores: {}, koScores: {} });
    expect(Object.keys(s().official)).toHaveLength(1);
  });
});
