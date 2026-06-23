import { describe, expect, it } from 'vitest';

import { simulate } from '../../engine';
import { computeLayout } from '../bracketLayout';
import { buildSimulationInput, emptyScenario } from '../buildInput';

const result = simulate(buildSimulationInput(emptyScenario(), {}));
const layout = computeLayout(result.bracket);

describe('computeLayout', () => {
  it('acha a final (centro) e a disputa de 3º', () => {
    expect(layout.final?.round).toBe('FINAL');
    expect(layout.third?.round).toBe('THIRD');
  });

  it('divide os 16 jogos de R32 em duas meias-chaves disjuntas (8 + 8)', () => {
    const l = layout.col('R32', 'L');
    const r = layout.col('R32', 'R');
    expect(l).toHaveLength(8);
    expect(r).toHaveLength(8);
    expect(new Set([...l, ...r].map((g) => g.id)).size).toBe(16);
  });

  it('cada fase afunila com a contagem certa por lado', () => {
    expect(layout.col('R16', 'L')).toHaveLength(4);
    expect(layout.col('R16', 'R')).toHaveLength(4);
    expect(layout.col('QF', 'L')).toHaveLength(2);
    expect(layout.col('QF', 'R')).toHaveLength(2);
    expect(layout.col('SF', 'L')).toHaveLength(1);
    expect(layout.col('SF', 'R')).toHaveLength(1);
  });

  it('ordered(R32) traz os 16 em ordem estável por folha', () => {
    const ord = layout.ordered('R32');
    expect(ord).toHaveLength(16);
    expect(new Set(ord.map((g) => g.id)).size).toBe(16);
  });
});
