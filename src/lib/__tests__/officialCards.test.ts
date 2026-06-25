import { describe, expect, it } from 'vitest';

import { buildCards } from '../officialCards';

describe('buildCards', () => {
  it('inclui só quem teve cartão e mapeia amarelo/vermelho', () => {
    const cards = buildCards('BRA', 'ARG', { hy: 2, hr: 0, ay: null, ar: 1 });
    expect(cards).toEqual({ BRA: { yellow: 2, directRed: 0 }, ARG: { yellow: 0, directRed: 1 } });
  });

  it('retorna null quando ninguém teve cartão', () => {
    expect(buildCards('A', 'B', { hy: null, hr: 0, ay: 0, ar: null })).toBeNull();
  });
});
