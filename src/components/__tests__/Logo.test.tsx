// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BrandMark, Logo } from '../Logo';

describe('<BrandMark>', () => {
  it('expõe o símbolo como imagem rotulada quando isolado', () => {
    render(<BrandMark />);
    expect(screen.getByRole('img', { name: 'Quem-Pega-Quem' })).toBeInTheDocument();
  });

  it('fica decorativo (escondido de leitores de tela) quando há wordmark ao lado', () => {
    render(<BrandMark decorative />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('<Logo>', () => {
  it('horizontal: mostra o wordmark e o sub-rótulo opcional', () => {
    render(<Logo sub />);
    expect(screen.getByText(/Quem.Pega.Quem/)).toBeInTheDocument();
    expect(screen.getByText(/Mata.mata ao vivo · Copa 2026/)).toBeInTheDocument();
  });

  it('empilhado: quebra o wordmark em três linhas', () => {
    render(<Logo orientation="stacked" />);
    expect(screen.getByText('Pega')).toBeInTheDocument();
    expect(screen.getAllByText('Quem')).toHaveLength(2);
  });

  it('não renderiza o sub-rótulo por padrão', () => {
    render(<Logo />);
    expect(screen.queryByText(/Mata.mata ao vivo/)).not.toBeInTheDocument();
  });
});
