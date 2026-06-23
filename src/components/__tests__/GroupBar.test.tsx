// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { simulate } from '../../engine';
import { buildSimulationInput, emptyScenario } from '../../lib/buildInput';
import { GroupBar } from '../GroupBar';

// Classificação real (grupo A) vinda do motor — sem placares, mas com 4 times.
const result = simulate(buildSimulationInput(emptyScenario(), {}));
const standing = result.standings[0]!;

describe("<GroupBar> — pílula 'melhor terceiro'", () => {
  it('chip colapsado do 3º mostra a posição entre os terceiros', () => {
    render(
      <GroupBar standing={standing} matches={[]} onScore={vi.fn()} thirdQualified thirdRank={1} />,
    );
    expect(screen.getByText('·1º')).toBeInTheDocument();
    expect(screen.getByTitle('1º melhor terceiro')).toBeInTheDocument();
  });

  it('ao expandir, mostra o cabeçalho e a pílula completa no 3º colocado', async () => {
    render(
      <GroupBar standing={standing} matches={[]} onScore={vi.fn()} thirdQualified thirdRank={1} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Grupo/ }));
    expect(screen.getByText('Pts')).toBeInTheDocument();
    expect(screen.getByText('1º melhor 3º')).toBeInTheDocument();
  });

  it("terceiro fora do corte: pílula sinaliza 'fora'", async () => {
    render(
      <GroupBar
        standing={standing}
        matches={[]}
        onScore={vi.fn()}
        thirdQualified={false}
        thirdRank={11}
      />,
    );
    expect(screen.getByText('·11º')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Grupo/ }));
    expect(screen.getByTitle(/fora do corte/)).toBeInTheDocument();
  });
});
