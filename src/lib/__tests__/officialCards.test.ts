import { describe, expect, it } from 'vitest';

import { buildCards, countsOf, EMPTY_CARDS, fairPlayOf, shownCards } from '../officialCards';

describe('buildCards', () => {
  it('inclui só quem teve cartão e cobre os 4 tipos', () => {
    const cards = buildCards(
      'BRA',
      'ARG',
      { y: 2, yy: 1, r: 0, yr: 0 },
      { y: null, yy: null, r: 1, yr: 0 },
    );
    expect(cards).toEqual({ BRA: { yellow: 2, secondYellow: 1 }, ARG: { directRed: 1 } });
  });

  it('retorna null quando ninguém teve cartão', () => {
    expect(buildCards('A', 'B', EMPTY_CARDS, EMPTY_CARDS)).toBeNull();
  });
});

describe('fairPlayOf', () => {
  it('soma os pontos do regulamento (≤ 0)', () => {
    expect(fairPlayOf({ y: 1, yy: 1, r: 1, yr: 1 })).toBe(-13); // -1-3-4-5
    expect(fairPlayOf(EMPTY_CARDS)).toBe(0);
  });
});

describe('shownCards', () => {
  it('deriva cartões exibidos (2º amarelo = 2🟨+1🟥; amarelo+vermelho = 1+1)', () => {
    expect(shownCards({ yellow: 1, secondYellow: 1, directRed: 1, yellowAndDirectRed: 1 })).toEqual(
      { yellow: 4, red: 3 },
    );
    expect(shownCards(undefined)).toEqual({ yellow: 0, red: 0 });
  });
});

describe('countsOf', () => {
  it('reidrata os contadores de um MatchCards', () => {
    expect(countsOf({ yellow: 2, directRed: 1 })).toEqual({ y: 2, yy: null, r: 1, yr: null });
    expect(countsOf(undefined)).toEqual({ y: null, yy: null, r: null, yr: null });
  });
});
