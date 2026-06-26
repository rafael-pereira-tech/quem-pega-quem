// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThirdsView } from '../ThirdsView';

describe('<ThirdsView>', () => {
  it('tabela tem header de colunas e legenda no rodapé (estilo grupos)', () => {
    render(<ThirdsView />);

    // header de colunas dentro do <thead>
    const table = screen.getByRole('table');
    const header = within(table).getAllByRole('row')[0]!;
    for (const col of ['Pts', 'SG', 'GP', 'CA', 'CV', 'pega']) {
      expect(within(header).getByText(col)).toBeInTheDocument();
    }

    // legenda no rodapé define as abreviações
    expect(
      screen.getByText(/Pts pontos · SG saldo de gols · GP gols pró · CA amarelos · CV vermelhos/),
    ).toBeInTheDocument();
    expect(screen.getByText(/enfrenta o 1º do grupo Y no jogo nn/)).toBeInTheDocument();
  });

  it('lista os 12 terceiros com a linha de corte após o 8º', () => {
    render(<ThirdsView />);
    expect(screen.getByText('Melhores 3º')).toBeInTheDocument();
    expect(screen.getByText(/Linha de corte/)).toBeInTheDocument();

    const table = screen.getByRole('table');
    // 1 linha de header + 12 times + 1 linha do divisor de corte = 14 linhas
    expect(within(table).getAllByRole('row')).toHaveLength(14);
  });
});
