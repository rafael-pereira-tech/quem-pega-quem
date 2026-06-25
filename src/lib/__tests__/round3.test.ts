import { describe, expect, it } from 'vitest';

import { firstActiveRound3Group } from '../round3';

import type { GroupId, GroupMatch, Round } from '../../engine/types';

const mk = (group: GroupId, round: Round, locked: boolean, n = 0): GroupMatch => ({
  id: `${group}-${round}-${n}`,
  group,
  round,
  home: 'X',
  away: 'Y',
  homeGoals: null,
  awayGoals: null,
  ...(locked ? { locked: true } : {}),
});

describe('firstActiveRound3Group', () => {
  it('pula grupos com a rodada 3 toda encerrada', () => {
    const by = new Map<GroupId, GroupMatch[]>([
      ['A', [mk('A', 3, true, 1), mk('A', 3, true, 2)]],
      ['B', [mk('B', 3, true, 1), mk('B', 3, false, 2)]],
      ['C', [mk('C', 3, false, 1)]],
    ]);
    expect(firstActiveRound3Group(['A', 'B', 'C'], by)).toBe('B');
  });

  it('ignora as rodadas 1 e 2', () => {
    const by = new Map<GroupId, GroupMatch[]>([
      ['A', [mk('A', 1, false), mk('A', 2, false), mk('A', 3, true)]],
      ['B', [mk('B', 3, false)]],
    ]);
    expect(firstActiveRound3Group(['A', 'B'], by)).toBe('B');
  });

  it('null quando tudo encerrado', () => {
    const by = new Map<GroupId, GroupMatch[]>([['A', [mk('A', 3, true)]]]);
    expect(firstActiveRound3Group(['A'], by)).toBeNull();
  });
});
