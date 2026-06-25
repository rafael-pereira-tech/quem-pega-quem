// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MatchCard } from '../MatchCard';

import type { GroupMatch } from '../../engine/types';

const base: GroupMatch = {
  id: 'A-R3-BRA-ARG',
  group: 'A',
  round: 3,
  home: 'BRA',
  away: 'ARG',
  homeGoals: null,
  awayGoals: null,
};

describe('<MatchCard>', () => {
  it("jogo a jogar: badge 'A jogar', steppers e códigos", () => {
    render(<MatchCard match={base} onScore={() => {}} />);
    expect(screen.getByText('A jogar')).toBeInTheDocument();
    expect(screen.getByText('BRA')).toBeInTheDocument();
    expect(screen.getByText('ARG')).toBeInTheDocument();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  });

  it("jogo travado: badge 'Encerrado', mostra placar e sem inputs", () => {
    render(
      <MatchCard
        match={{ ...base, homeGoals: 2, awayGoals: 1, locked: true }}
        onScore={() => {}}
      />,
    );
    expect(screen.getByText('Encerrado')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
  });

  it("placar preenchido sem travar: badge 'Palpite'", () => {
    render(<MatchCard match={{ ...base, homeGoals: 1, awayGoals: 1 }} onScore={() => {}} />);
    expect(screen.getByText('Palpite')).toBeInTheDocument();
  });

  it('mexer no stepper da casa chama onScore(0, null)', async () => {
    const onScore = vi.fn();
    render(<MatchCard match={base} onScore={onScore} />);
    await userEvent.click(screen.getAllByLabelText('+1')[0]!);
    expect(onScore).toHaveBeenCalledWith(0, null);
  });

  it('cada placar tem nome acessível por time e mando', () => {
    render(<MatchCard match={base} onScore={() => {}} />);
    expect(screen.getByLabelText('Gols de BRA — mandante')).toBeInTheDocument();
    expect(screen.getByLabelText('Gols de ARG — visitante')).toBeInTheDocument();
  });

  it('Tab vai de placar em placar, pulando os botões +/−', async () => {
    const user = userEvent.setup();
    render(<MatchCard match={base} onScore={() => {}} />);
    const [home, away] = screen.getAllByRole('spinbutton');

    await user.tab();
    expect(home).toHaveFocus();
    await user.tab();
    expect(away).toHaveFocus();
  });

  it('os botões +/− ficam fora da ordem de Tab', () => {
    render(<MatchCard match={{ ...base, homeGoals: 1, awayGoals: 1 }} onScore={() => {}} />);
    for (const btn of [...screen.getAllByLabelText('+1'), ...screen.getAllByLabelText('-1')]) {
      expect(btn).toHaveAttribute('tabindex', '-1');
    }
  });

  it('ao vivo: mostra selo AO VIVO e o placar real, mantendo os steppers do palpite', () => {
    render(
      <MatchCard
        match={base}
        live={{ home: 2, away: 1, cards: { BRA: { yellow: 1, directRed: 0 } } }}
        onScore={() => {}}
      />,
    );
    expect(screen.getByText('Ao vivo')).toBeInTheDocument();
    expect(screen.getByText('placar')).toBeInTheDocument();
    expect(screen.getByText('2 × 1')).toBeInTheDocument(); // placar real
    // cartões ao lado do nome do mandante (BRA: 1 amarelo, 0 vermelho)
    expect(screen.getByLabelText('BRA: 1 amarelos, 0 vermelhos')).toBeInTheDocument();
    // o palpite segue editável
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  });
});
