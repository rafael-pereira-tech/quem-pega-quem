// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { focusAdjacentScoreField, scoreFieldProps } from '../scoreFocus';

/** Três campos na ordem do DOM, com o do meio desabilitado. */
function Harness() {
  return (
    <div>
      <input {...scoreFieldProps} type="number" aria-label="a" defaultValue={0} />
      <input {...scoreFieldProps} type="number" aria-label="b" defaultValue={0} disabled />
      <input {...scoreFieldProps} type="number" aria-label="c" defaultValue={0} />
    </div>
  );
}

describe('scoreFocus', () => {
  beforeEach(() => {
    // jsdom não implementa scrollIntoView — stub para podermos espionar.
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Enter avança para o próximo campo, pulando os desabilitados', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const a = screen.getByLabelText('a');
    const c = screen.getByLabelText('c');

    await user.click(a);
    await user.keyboard('{Enter}');
    expect(c).toHaveFocus();
  });

  it('Shift+Enter volta para o campo anterior', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const a = screen.getByLabelText('a');
    const c = screen.getByLabelText('c');

    await user.click(c);
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(a).toHaveFocus();
  });

  it('nos extremos é no-op (não rouba o foco)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const c = screen.getByLabelText('c');

    await user.click(c);
    await user.keyboard('{Enter}');
    expect(c).toHaveFocus();
  });

  it('rola o campo para a vista ao receber foco', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const a = screen.getByLabelText('a');

    await user.click(a);
    expect(a.scrollIntoView).toHaveBeenCalled();
  });

  it('focusAdjacentScoreField retorna false fora dos limites', () => {
    render(<Harness />);
    const a = screen.getByLabelText('a');
    expect(focusAdjacentScoreField(a, -1)).toBe(false);
  });
});
