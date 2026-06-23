// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ScoreBox } from '../ScoreBox';

describe('<ScoreBox>', () => {
  it('renderiza valor com label acessível', () => {
    render(<ScoreBox value={2} label="casa" onChange={() => {}} />);
    expect(screen.getByLabelText('casa')).toHaveValue(2);
  });

  it('change aplica piso não-negativo', () => {
    const onChange = vi.fn();
    render(<ScoreBox value={null} label="g" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('g'), { target: { value: '3' } });
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it('apagar o campo vira null', () => {
    // input controlado: começa preenchido pra que o "" seja uma mudança real.
    const onChange = vi.fn();
    render(<ScoreBox value={2} label="g" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('g'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('disabled', () => {
    render(<ScoreBox value={1} label="g" onChange={() => {}} disabled />);
    expect(screen.getByLabelText('g')).toBeDisabled();
  });
});
