import { describe, expect, it } from 'vitest';

import { rankThirds } from '../thirds';

import type { GroupId, GroupStanding, RankedTeam, Team, TeamId } from '../types';

interface ThirdSpec {
  points: number;
  gd: number;
  gf: number;
  fp?: number;
  fifa: number;
}

function third(group: GroupId, s: ThirdSpec): { standing: GroupStanding; team: Team } {
  const id = `3${group}`;
  const row: RankedTeam = {
    team: id,
    group,
    played: 3,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: s.gf,
    goalsAgainst: s.gf - s.gd,
    goalDiff: s.gd,
    points: s.points,
    fairPlay: s.fp ?? 0,
    yellow: 0,
    red: 0,
    position: 3,
    decidedBy: 'points',
  };
  const dummy = (n: number): RankedTeam => ({ ...row, team: `${group}${n}`, position: n });
  return {
    standing: { group, table: [dummy(1), dummy(2), row], complete: true },
    team: { id, name: id, group, fifaRanking: s.fifa },
  };
}

describe('ranking dos 12 terceiros + corte dos 4 piores', () => {
  const specs: Record<GroupId, ThirdSpec> = {
    A: { points: 4, gd: 3, gf: 4, fifa: 1 },
    B: { points: 4, gd: 2, gf: 6, fifa: 2 },
    C: { points: 4, gd: 2, gf: 5, fifa: 3 }, // C > D por gols (mesmo gd)
    D: { points: 4, gd: 2, gf: 4, fifa: 4 },
    E: { points: 3, gd: 1, gf: 3, fifa: 5 },
    F: { points: 3, gd: 0, gf: 3, fp: 0, fifa: 6 },
    G: { points: 3, gd: 0, gf: 3, fp: -2, fifa: 7 }, // G < F por fair play
    H: { points: 3, gd: -1, gf: 2, fifa: 8 },
    // os 4 piores (1 pt), idênticos exceto FIFA → ordenam por ranking FIFA
    I: { points: 1, gd: 0, gf: 1, fifa: 9 },
    J: { points: 1, gd: 0, gf: 1, fifa: 10 },
    K: { points: 1, gd: 0, gf: 1, fifa: 11 },
    L: { points: 1, gd: 0, gf: 1, fifa: 12 },
  };

  const built = (Object.keys(specs) as GroupId[]).map((g) => third(g, specs[g]));
  const standings = built.map((b) => b.standing);
  const teamsById = new Map<TeamId, Team>(built.map((b) => [b.team.id, b.team]));

  const result = rankThirds(standings, teamsById);

  it('rankeia na ordem correta (pontos→saldo→gols→fairplay→FIFA)', () => {
    expect(result.rows.map((r) => r.group)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
    ]);
  });

  it('classifica os 8 melhores e corta os 4 piores', () => {
    const qualified = result.rows.filter((r) => r.qualified).map((r) => r.group);
    expect(qualified).toHaveLength(8);
    expect(result.qualifiedGroups).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    expect(result.rows.filter((r) => !r.qualified).map((r) => r.group)).toEqual([
      'I',
      'J',
      'K',
      'L',
    ]);
  });

  it('registra o critério de cada desempate', () => {
    const by = (g: GroupId) => result.rows.find((r) => r.group === g)!.decidedBy;
    expect(by('B')).toBe('goalDiff'); // B abaixo de A por saldo
    expect(by('C')).toBe('goalsFor'); // C abaixo de B por gols
    expect(by('G')).toBe('fairPlay'); // G abaixo de F por fair play
    expect(by('J')).toBe('fifaRanking'); // J abaixo de I por ranking FIFA
  });

  it('qualifiedGroups vem ORDENADO (é a chave do Anexo C)', () => {
    expect(result.qualifiedGroups).toEqual([...result.qualifiedGroups].sort());
  });
});
