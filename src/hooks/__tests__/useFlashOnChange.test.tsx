// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFlashOnChange } from '../useFlashOnChange';

function Card({ sig }: { sig: string }) {
  const ref = useFlashOnChange<HTMLDivElement>(sig);
  return <div ref={ref} data-testid="card" />;
}

const animateSpy = vi.fn(() => ({ cancel: vi.fn() }));

beforeEach(() => {
  // jsdom não implementa a Web Animations API; instala um stub espião.
  (HTMLElement.prototype as unknown as { animate: unknown }).animate = animateSpy;
  animateSpy.mockClear();
});

afterEach(() => {
  delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate;
  delete (window as unknown as { matchMedia?: unknown }).matchMedia;
});

describe('useFlashOnChange', () => {
  it('não anima na primeira renderização', () => {
    render(<Card sig="A" />);
    expect(animateSpy).not.toHaveBeenCalled();
  });

  it('anima a borda quando a assinatura muda', () => {
    const { rerender } = render(<Card sig="A" />);
    rerender(<Card sig="B" />);
    expect(animateSpy).toHaveBeenCalledOnce();
  });

  it('não anima quando a assinatura permanece igual (re-render sem mudança visível)', () => {
    const { rerender } = render(<Card sig="A" />);
    rerender(<Card sig="A" />);
    expect(animateSpy).not.toHaveBeenCalled();
  });

  it('respeita prefers-reduced-motion (não anima)', () => {
    (window as unknown as { matchMedia: unknown }).matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true });
    const { rerender } = render(<Card sig="A" />);
    rerender(<Card sig="B" />);
    expect(animateSpy).not.toHaveBeenCalled();
  });

  it('é no-op (sem lançar) quando não há WAAPI', () => {
    delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate;
    const { rerender } = render(<Card sig="A" />);
    expect(() => rerender(<Card sig="B" />)).not.toThrow();
  });
});
