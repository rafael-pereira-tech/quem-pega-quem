// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { slideIn } from '../motion';

afterEach(() => {
  delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate;
  delete (window as unknown as { matchMedia?: unknown }).matchMedia;
});

describe('slideIn', () => {
  it('anima via Web Animations API quando disponível', () => {
    const spy = vi.fn(() => ({ cancel: vi.fn() }));
    (HTMLElement.prototype as unknown as { animate: unknown }).animate = spy;
    slideIn(document.createElement('div'), 28);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('é no-op (sem lançar) quando não há WAAPI', () => {
    expect(() => slideIn(document.createElement('div'), 28)).not.toThrow();
  });

  it('não anima com prefers-reduced-motion', () => {
    (window as unknown as { matchMedia: unknown }).matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true });
    const spy = vi.fn();
    (HTMLElement.prototype as unknown as { animate: unknown }).animate = spy;
    slideIn(document.createElement('div'), 28);
    expect(spy).not.toHaveBeenCalled();
  });
});
