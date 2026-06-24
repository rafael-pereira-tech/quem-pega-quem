// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFlip } from '../useFlip';

/** Lista cuja posição vertical de cada item é o índice atual (via data-ot, lido
 *  pelo getter stubado de offsetTop) — assim reordenar gera deltas reais. */
function List({ order }: { order: string[] }) {
  const ref = useFlip<HTMLDivElement>(order.join(','));
  return (
    <div ref={ref}>
      {order.map((id, i) => (
        <div key={id} data-flip-key={id} data-ot={i * 20}>
          {id}
        </div>
      ))}
    </div>
  );
}

const animateSpy = vi.fn(() => ({ cancel: vi.fn() }));
let origOffsetTop: PropertyDescriptor | undefined;

beforeEach(() => {
  origOffsetTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      return Number(this.dataset.ot ?? 0);
    },
  });
  // jsdom não implementa a Web Animations API; instala um stub espião.
  (HTMLElement.prototype as unknown as { animate: unknown }).animate = animateSpy;
  animateSpy.mockClear();
});

afterEach(() => {
  if (origOffsetTop) Object.defineProperty(HTMLElement.prototype, 'offsetTop', origOffsetTop);
  delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate;
});

describe('useFlip', () => {
  it('não anima na primeira renderização (só registra posições)', () => {
    render(<List order={['a', 'b', 'c']} />);
    expect(animateSpy).not.toHaveBeenCalled();
  });

  it('anima os itens que trocam de posição ao reordenar', () => {
    const { rerender } = render(<List order={['a', 'b', 'c']} />);
    rerender(<List order={['c', 'a', 'b']} />);
    expect(animateSpy).toHaveBeenCalled();
  });

  it('respeita prefers-reduced-motion (não anima)', () => {
    (window as unknown as { matchMedia: unknown }).matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true });
    const { rerender } = render(<List order={['a', 'b']} />);
    rerender(<List order={['b', 'a']} />);
    expect(animateSpy).not.toHaveBeenCalled();
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });
});
