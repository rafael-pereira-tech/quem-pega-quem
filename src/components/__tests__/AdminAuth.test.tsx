// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AdminAuth } from '../AdminAuth';

describe('<AdminAuth>', () => {
  it('logado: mostra "sair" e chama signOut', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    render(<AdminAuth email="admin@x.com" signInWithOtp={vi.fn()} signOut={signOut} />);
    await userEvent.click(screen.getByRole('button', { name: /sair/i }));
    expect(signOut).toHaveBeenCalled();
  });

  it('anônimo: abre o campo e envia o magic link para o e-mail digitado', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    render(<AdminAuth email={null} signInWithOtp={signInWithOtp} signOut={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));
    await userEvent.type(screen.getByLabelText(/e-mail do admin/i), 'admin@x.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    expect(signInWithOtp).toHaveBeenCalledWith('admin@x.com');
    expect(await screen.findByText(/link enviado/i)).toBeInTheDocument();
  });

  it('mostra o erro quando o envio falha', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: 'rate limit' });
    render(<AdminAuth email={null} signInWithOtp={signInWithOtp} signOut={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));
    await userEvent.type(screen.getByLabelText(/e-mail do admin/i), 'a@b.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    expect(await screen.findByText(/rate limit/i)).toBeInTheDocument();
  });
});
