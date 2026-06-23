import { describe, expect, it } from 'vitest';

import { fairPlayForMatch } from '../fairplay';
import { orderGroup } from '../tiebreakers';

import { match, team } from './helpers';

import type { GroupMatch, Team } from '../types';

const order = (teams: Team[], matches: GroupMatch[]) =>
  orderGroup(teams, matches).map((r) => r.team);

describe('classificação básica', () => {
  it('ordena por pontos', () => {
    const teams = [team('W', 'A'), team('X', 'A'), team('Y', 'A'), team('Z', 'A')];
    const m = [
      match('A', 1, 'W', 'X', 1, 0),
      match('A', 1, 'W', 'Y', 1, 0),
      match('A', 1, 'W', 'Z', 1, 0), // W vence tudo = 9
      match('A', 2, 'X', 'Y', 1, 0),
      match('A', 2, 'X', 'Z', 1, 0), // X = 6
      match('A', 3, 'Y', 'Z', 1, 0), // Y = 3, Z = 0
    ];
    expect(order(teams, m)).toEqual(['W', 'X', 'Y', 'Z']);
  });
});

describe('confronto direto ANTES do saldo geral (mudança de 2026)', () => {
  it('quem venceu o confronto direto fica na frente mesmo com saldo geral pior', () => {
    // X e Y empatam em 6 pts. X venceu Y, mas Y tem saldo geral MUITO melhor.
    const teams = [team('X', 'B'), team('Y', 'B'), team('Z', 'B'), team('W', 'B')];
    const m = [
      match('B', 1, 'X', 'Y', 1, 0), // X vence o confronto direto
      match('B', 1, 'X', 'Z', 1, 0),
      match('B', 1, 'W', 'X', 3, 0), // X perde feio (saldo geral cai)
      match('B', 2, 'Y', 'Z', 1, 0),
      match('B', 2, 'Y', 'W', 5, 0), // Y goleia (saldo geral sobe)
      match('B', 3, 'Z', 'W', 1, 0),
    ];
    const ranked = orderGroup(teams, m);
    const ids = ranked.map((r) => r.team);
    expect(ids).toEqual(['X', 'Y', 'Z', 'W']);

    // confirma que Y de fato tem saldo geral melhor que X
    const X = ranked.find((r) => r.team === 'X')!;
    const Y = ranked.find((r) => r.team === 'Y')!;
    expect(Y.goalDiff).toBeGreaterThan(X.goalDiff);
    // ...e ainda assim X ficou à frente, pelo confronto direto
    expect(X.position).toBeLessThan(Y.position);
    expect(Y.decidedBy).toBe('h2hPoints');
  });
});

describe('empate triplo — confronto direto idêntico cai pro saldo geral', () => {
  it('trio empata tudo no H2H (3 empates 0x0) → decide saldo geral vs o 4º', () => {
    const teams = [team('P', 'C'), team('Q', 'C'), team('R', 'C'), team('S', 'C')];
    const m = [
      match('C', 1, 'P', 'Q', 0, 0),
      match('C', 1, 'P', 'R', 0, 0),
      match('C', 2, 'Q', 'R', 0, 0), // H2H do trio: tudo 0x0 → idêntico
      match('C', 2, 'P', 'S', 3, 0), // saldo geral: P > Q > R
      match('C', 3, 'Q', 'S', 2, 0),
      match('C', 3, 'R', 'S', 1, 0),
    ];
    const ranked = orderGroup(teams, m);
    expect(ranked.map((r) => r.team)).toEqual(['P', 'Q', 'R', 'S']);
    expect(ranked[1]!.decidedBy).toBe('goalDiff');
    expect(ranked[2]!.decidedBy).toBe('goalDiff');
  });
});

describe('RECURSÃO: confronto direto separa ALGUNS, recalcula entre os que sobram', () => {
  it('trio: H2H separa o líder; os 2 restantes decididos pelo confronto direto ENTRE ELES (não pelo saldo geral)', () => {
    // A, B, C empatam em 6 pts (todos batem S).
    // No H2H do trio (ciclo): A separa por saldo do confronto direto;
    // B e C ficam empatados no trio (pts/saldo/gols), MAS B venceu C direto.
    // O saldo GERAL diria C > A > B (C goleia S). A regra correta diz A, B, C.
    const teams = [team('A', 'D'), team('B', 'D'), team('C', 'D'), team('S', 'D')];
    const m = [
      // ciclo do confronto direto
      match('D', 1, 'A', 'B', 3, 0), // A bate B
      match('D', 1, 'B', 'C', 2, 0), // B bate C  (confronto direto do par)
      match('D', 1, 'C', 'A', 2, 1), // C bate A
      // todos batem o S, com placares que INVERTERIAM pelo saldo geral
      match('D', 2, 'A', 'S', 1, 0),
      match('D', 2, 'B', 'S', 1, 0),
      match('D', 2, 'C', 'S', 5, 0), // C tem o melhor saldo GERAL
    ];
    const ranked = orderGroup(teams, m);
    expect(ranked.map((r) => r.team)).toEqual(['A', 'B', 'C', 'S']);

    // prova de que NÃO foi pelo saldo geral: C tem o melhor saldo geral e é o 3º
    const A = ranked.find((r) => r.team === 'A')!;
    const C = ranked.find((r) => r.team === 'C')!;
    expect(C.goalDiff).toBeGreaterThan(A.goalDiff);
    expect(C.position).toBe(3);

    // como cada um foi decidido
    expect(ranked[1]!.team).toBe('B');
    expect(ranked[1]!.decidedBy).toBe('h2hGoalDiff'); // A separa do par por saldo do confronto
    expect(ranked[2]!.team).toBe('C');
    expect(ranked[2]!.decidedBy).toBe('h2hPoints'); // B > C pelo confronto direto do par
  });
});

describe('fair play e ranking FIFA', () => {
  it('fairPlayForMatch aplica a tabela de pontos do regulamento', () => {
    expect(fairPlayForMatch(undefined)).toBe(0);
    expect(fairPlayForMatch({ yellow: 2 })).toBe(-2);
    expect(fairPlayForMatch({ secondYellow: 1 })).toBe(-3);
    expect(fairPlayForMatch({ directRed: 1 })).toBe(-4);
    expect(fairPlayForMatch({ yellowAndDirectRed: 1 })).toBe(-5);
    expect(fairPlayForMatch({ yellow: 1, directRed: 1 })).toBe(-5);
  });

  it('fair play desempata quando pontos/H2H/saldo/gols são iguais', () => {
    // X e Y idênticos (7 pts, empate direto 1x1, mesmo saldo/gols). Y tem +1 amarelo.
    const teams = [team('X', 'E', 1), team('Y', 'E', 2), team('Z', 'E', 3), team('W', 'E', 4)];
    const m = [
      match('E', 1, 'X', 'Y', 1, 1, { cards: { Y: { yellow: 1 } } }),
      match('E', 1, 'X', 'Z', 2, 0),
      match('E', 2, 'X', 'W', 2, 0),
      match('E', 2, 'Y', 'Z', 2, 0),
      match('E', 3, 'Y', 'W', 2, 0),
      match('E', 3, 'Z', 'W', 0, 0),
    ];
    const ranked = orderGroup(teams, m);
    expect(ranked.slice(0, 2).map((r) => r.team)).toEqual(['X', 'Y']);
    expect(ranked[1]!.decidedBy).toBe('fairPlay');
  });

  it('ranking FIFA é o desempate final', () => {
    // X e Y totalmente idênticos, inclusive fair play. FIFA: X(1) melhor que Y(2).
    const teams = [team('X', 'F', 1), team('Y', 'F', 2), team('Z', 'F', 3), team('W', 'F', 4)];
    const m = [
      match('F', 1, 'X', 'Y', 0, 0),
      match('F', 1, 'X', 'Z', 2, 0),
      match('F', 2, 'X', 'W', 2, 0),
      match('F', 2, 'Y', 'Z', 2, 0),
      match('F', 3, 'Y', 'W', 2, 0),
      match('F', 3, 'Z', 'W', 0, 0),
    ];
    const ranked = orderGroup(teams, m);
    expect(ranked.slice(0, 2).map((r) => r.team)).toEqual(['X', 'Y']);
    expect(ranked[1]!.decidedBy).toBe('fifaRanking');
  });
});

describe('grupo incompleto (ao vivo)', () => {
  it('classifica provisoriamente com jogos sem placar', () => {
    const teams = [team('A', 'G'), team('B', 'G'), team('C', 'G'), team('D', 'G')];
    const m = [
      match('G', 1, 'A', 'B', 2, 0),
      match('G', 1, 'C', 'D', null, null), // ainda não jogado
    ];
    const ranked = orderGroup(teams, m);
    expect(ranked[0]!.team).toBe('A');
    expect(ranked[0]!.points).toBe(3);
  });
});
