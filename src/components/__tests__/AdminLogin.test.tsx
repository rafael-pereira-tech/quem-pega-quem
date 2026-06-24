// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AdminLogin } from '../AdminLogin';

describe('<AdminLogin>', () => {
  it('envia o magic link para o e-mail digitado e confirma', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    render(<AdminLogin signInWithOtp={signInWithOtp} />);

    await userEvent.type(screen.getByLabelText(/e-mail do admin/i), 'admin@x.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    expect(signInWithOtp).toHaveBeenCalledWith('admin@x.com');
    expect(await screen.findByText(/link enviado/i)).toBeInTheDocument();
  });

  it('mostra o erro quando o envio falha', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: 'rate limit' });
    render(<AdminLogin signInWithOtp={signInWithOtp} />);

    await userEvent.type(screen.getByLabelText(/e-mail do admin/i), 'a@b.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    expect(await screen.findByText(/rate limit/i)).toBeInTheDocument();
  });
});
