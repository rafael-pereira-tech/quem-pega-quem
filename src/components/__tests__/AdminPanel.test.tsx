// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useStore } from '../../state/store';
import { AdminPanel } from '../AdminPanel';

// Base controlada: um jogo a jogar (editável) e um já encerrado (da base).
vi.mock('../../data/static', () => ({
  staticData: {
    seedMatches: [
      {
        id: 'A-R3-OPN-RIV',
        group: 'A',
        round: 3,
        home: 'OPN',
        away: 'RIV',
        homeGoals: null,
        awayGoals: null,
      },
      {
        id: 'A-R1-FIN-DUN',
        group: 'A',
        round: 1,
        home: 'FIN',
        away: 'DUN',
        homeGoals: 2,
        awayGoals: 1,
        cards: { FIN: { yellow: 1 } },
      },
    ],
  },
  teamsById: new Map([
    ['OPN', { id: 'OPN', name: 'Aberto', group: 'A', fifaRanking: 1 }],
    ['RIV', { id: 'RIV', name: 'Rival', group: 'A', fifaRanking: 2 }],
    ['FIN', { id: 'FIN', name: 'Final', group: 'A', fifaRanking: 3 }],
    ['DUN', { id: 'DUN', name: 'Dun', group: 'A', fifaRanking: 4 }],
  ]),
}));

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
    useStore.setState({ official: {} });
  });

  it('"ao vivo" grava placar + cartões do jogo aberto com locked=false', async () => {
    const user = userEvent.setup();
    render(<AdminPanel userId="u1" />);

    await user.type(screen.getByLabelText('Gols de Aberto (casa)'), '2');
    await user.type(screen.getByLabelText('Gols de Rival (fora)'), '1');
    await user.type(screen.getByLabelText('Amarelos Aberto'), '1');
    await user.click(screen.getByRole('button', { name: /^ao vivo$/i }));

    expect(upsertOfficial).toHaveBeenCalledTimes(1);
    const arg = upsertOfficial.mock.calls[0]![0] as {
      locked: boolean;
      homeGoals: number;
      awayGoals: number;
      cards: Record<string, { yellow: number }>;
    };
    expect(arg).toMatchObject({ locked: false, homeGoals: 2, awayGoals: 1 });
    expect(Object.values(arg.cards)[0]).toMatchObject({ yellow: 1 });
  });

  it('"encerrar" grava com locked=true', async () => {
    const user = userEvent.setup();
    render(<AdminPanel userId="u1" />);

    await user.type(screen.getByLabelText('Gols de Aberto (casa)'), '3');
    await user.type(screen.getByLabelText('Gols de Rival (fora)'), '0');
    await user.click(screen.getByRole('button', { name: /^encerrar$/i }));

    expect(upsertOfficial).toHaveBeenCalledTimes(1);
    expect(upsertOfficial.mock.calls[0]![0]).toMatchObject({
      locked: true,
      homeGoals: 3,
      awayGoals: 0,
    });
  });

  it('jogo já encerrado na base vem travado: valor da base, input disabled, sem botões', () => {
    render(<AdminPanel userId="u1" />);

    const homeInput = screen.getByLabelText('Gols de Final (casa)');
    expect(homeInput).toHaveValue(2); // pré-preenchido pela base
    expect(homeInput).toBeDisabled();
    expect(screen.getByLabelText('Amarelos Final')).toBeDisabled();
    expect(screen.getAllByText('encerrado').length).toBeGreaterThan(0);
    // só o jogo aberto tem botões de ação
    expect(screen.getAllByRole('button', { name: /encerrar/i })).toHaveLength(1);
  });

  it('o toggle "detalhado" expõe 2º amarelo e amarelo+vermelho', async () => {
    const user = userEvent.setup();
    render(<AdminPanel userId="u1" />);

    expect(screen.queryByLabelText(/^2º amarelo /)).toBeNull();
    await user.click(screen.getByRole('button', { name: /cartões:/i }));
    expect(screen.getAllByLabelText(/^2º amarelo /).length).toBeGreaterThan(0);
  });
});
