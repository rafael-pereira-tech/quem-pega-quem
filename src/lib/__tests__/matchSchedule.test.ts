import { describe, expect, it } from 'vitest';

import { formatKickoff, scheduleLine } from '../matchSchedule';

describe('formatKickoff', () => {
  it('formata em horário de Brasília', () => {
    expect(formatKickoff('2026-06-25T16:00:00-03:00')).toBe('25/jun Qui 16:00');
  });

  it('converte o fuso para Brasília', () => {
    // 19:00 em Nova York (-04) = 20:00 em Brasília (-03), mesmo dia
    expect(formatKickoff('2026-06-13T19:00:00-04:00')).toBe('13/jun Sáb 20:00');
  });

  it('null para ISO inválido', () => {
    expect(formatKickoff('xx')).toBeNull();
  });
});

describe('scheduleLine', () => {
  it('junta data/hora e local', () => {
    expect(scheduleLine('2026-06-25T16:00:00-03:00', 'Nova York / MetLife')).toBe(
      '25/jun Qui 16:00 · Nova York / MetLife',
    );
  });

  it('mostra só o que existe', () => {
    expect(scheduleLine(undefined, 'Miami / Hard Rock')).toBe('Miami / Hard Rock');
    expect(scheduleLine('2026-06-25T16:00:00-03:00')).toBe('25/jun Qui 16:00');
    expect(scheduleLine()).toBe('');
  });
});
