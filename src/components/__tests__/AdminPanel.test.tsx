// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useStore } from '../../state/store';
import { AdminPanel } from '../AdminPanel';

const upsertOfficial = vi.fn().mockResolvedValue({ error: null });
const deleteOfficial = vi.fn().mockResolvedValue({ error: null });
vi.mock('../../supabase/official', () => ({
  upsertOfficial: (...args: unknown[]) => upsertOfficial(...args),
  deleteOfficial: (...args: unknown[]) => deleteOfficial(...args),
}));

describe('<AdminPanel> — controle ao vivo', () => {
  beforeEach(() => {
    upsertOfficial.mockClear();
    deleteOfficial.mockClear();
    useStore.setState({ official: {} }); // isola de outros testes que mexem no store
  });

  it('"ao vivo" grava placar + cartões com locked=false', async () => {
    const user = userEvent.setup();
    render(<AdminPanel userId="u1" />);

    await user.type(screen.getAllByLabelText(/^Gols de .* \(casa\)$/)[0]!, '2');
    await user.type(screen.getAllByLabelText(/^Gols de .* \(fora\)$/)[0]!, '1');
    await user.type(screen.getAllByLabelText(/^Amarelos /)[0]!, '1');

    await user.click(screen.getAllByRole('button', { name: /^ao vivo$/i })[0]!);

    expect(upsertOfficial).toHaveBeenCalledTimes(1);
    const arg = upsertOfficial.mock.calls[0]![0] as {
      locked: boolean;
      homeGoals: number;
      awayGoals: number;
      cards: Record<string, { yellow: number }>;
      userId: string;
    };
    expect(arg).toMatchObject({ locked: false, homeGoals: 2, awayGoals: 1, userId: 'u1' });
    expect(Object.values(arg.cards)[0]).toMatchObject({ yellow: 1 });
  });

  it('"encerrar" grava com locked=true', async () => {
    const user = userEvent.setup();
    render(<AdminPanel userId="u1" />);

    await user.type(screen.getAllByLabelText(/^Gols de .* \(casa\)$/)[0]!, '3');
    await user.type(screen.getAllByLabelText(/^Gols de .* \(fora\)$/)[0]!, '0');
    await user.click(screen.getAllByRole('button', { name: /^encerrar$/i })[0]!);

    expect(upsertOfficial).toHaveBeenCalledTimes(1);
    expect(upsertOfficial.mock.calls[0]![0]).toMatchObject({
      locked: true,
      homeGoals: 3,
      awayGoals: 0,
    });
  });

  it('o toggle "detalhado" expõe 2º amarelo e amarelo+vermelho', async () => {
    const user = userEvent.setup();
    render(<AdminPanel userId="u1" />);

    expect(screen.queryByLabelText(/^2º amarelo /)).toBeNull(); // simples por padrão
    await user.click(screen.getByRole('button', { name: /cartões:/i }));
    expect(screen.getAllByLabelText(/^2º amarelo /).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/^Amarelo e vermelho /).length).toBeGreaterThan(0);
  });
});
