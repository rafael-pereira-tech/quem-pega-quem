// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSwipe } from '../useSwipe';

function Swipeable({ onLeft, onRight }: { onLeft: () => void; onRight: () => void }) {
  const swipe = useSwipe(onLeft, onRight);
  return (
    <div data-testid="area" {...swipe}>
      conteúdo
    </div>
  );
}

function swipe(area: HTMLElement, fromX: number, toX: number, fromY = 100, toY = 100) {
  fireEvent.touchStart(area, { touches: [{ clientX: fromX, clientY: fromY }] });
  fireEvent.touchEnd(area, { changedTouches: [{ clientX: toX, clientY: toY }] });
}

describe('useSwipe', () => {
  it('swipe para a esquerda chama onLeft', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    render(<Swipeable onLeft={onLeft} onRight={onRight} />);
    swipe(screen.getByTestId('area'), 200, 120); // dx = -80
    expect(onLeft).toHaveBeenCalledOnce();
    expect(onRight).not.toHaveBeenCalled();
  });

  it('swipe para a direita chama onRight', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    render(<Swipeable onLeft={onLeft} onRight={onRight} />);
    swipe(screen.getByTestId('area'), 100, 200); // dx = +100
    expect(onRight).toHaveBeenCalledOnce();
    expect(onLeft).not.toHaveBeenCalled();
  });

  it('ignora movimento curto', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    render(<Swipeable onLeft={onLeft} onRight={onRight} />);
    swipe(screen.getByTestId('area'), 100, 115); // dx = +15 < limiar
    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
  });

  it('ignora swipe predominantemente vertical (não sequestra a rolagem)', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    render(<Swipeable onLeft={onLeft} onRight={onRight} />);
    swipe(screen.getByTestId('area'), 200, 140, 100, 220); // dx=-60, dy=+120
    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
  });

  it('um swipe aninhado consome o gesto: o de dentro age, o de fora não', () => {
    const inner = vi.fn();
    const outer = vi.fn();
    function Nested() {
      const out = useSwipe(outer, outer);
      const inn = useSwipe(inner, inner);
      return (
        <div data-testid="outer" {...out}>
          <div data-testid="inner" {...inn}>
            x
          </div>
        </div>
      );
    }
    render(<Nested />);
    swipe(screen.getByTestId('inner'), 200, 110); // dx = -90
    expect(inner).toHaveBeenCalledOnce();
    expect(outer).not.toHaveBeenCalled();
  });
});
