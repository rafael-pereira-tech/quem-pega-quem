// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Stepper } from '../Stepper';

describe('<Stepper>', () => {
  it('mostra o valor', () => {
    render(<Stepper value={3} onChange={() => {}} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(3);
  });

  it('+ incrementa; partindo de null vira 0', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Stepper value={2} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('+1'));
    expect(onChange).toHaveBeenLastCalledWith(3);

    rerender(<Stepper value={null} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('+1'));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('− decrementa e fica desabilitado em 0', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Stepper value={2} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('-1'));
    expect(onChange).toHaveBeenLastCalledWith(1);

    rerender(<Stepper value={0} onChange={onChange} />);
    expect(screen.getByLabelText('-1')).toBeDisabled();
  });

  it('digitar aplica piso não-negativo; vazio = null', () => {
    const onChange = vi.fn();
    render(<Stepper value={1} onChange={onChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '5' } });
    expect(onChange).toHaveBeenLastCalledWith(5);
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('disabled trava input e os dois botões', () => {
    render(<Stepper value={1} onChange={() => {}} disabled />);
    expect(screen.getByRole('spinbutton')).toBeDisabled();
    expect(screen.getByLabelText('+1')).toBeDisabled();
    expect(screen.getByLabelText('-1')).toBeDisabled();
  });
});
