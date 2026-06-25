// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { App } from '../App';

// Isola o App do Supabase real (o env de teste pode ter credenciais).
vi.mock('../supabase/client', () => ({ hasSupabase: false, supabase: null }));
vi.mock('../supabase/useOfficialSync', () => ({ useOfficialSync: () => {} }));
vi.mock('../supabase/events', () => ({ setAnalyticsUser: () => {}, trackEvent: () => {} }));
vi.mock('../supabase/session', () => ({
  useSession: () => ({
    userId: null,
    isAdmin: false,
    nickname: null,
    email: null,
    ready: true,
    setNickname: vi.fn(),
    signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn(),
  }),
}));

beforeAll(() => {
  // jsdom não implementa matchMedia (usado pelo useIsDesktop) → mobile.
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }),
  );
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('App — rotas', () => {
  it('/ mostra o app com as abas', () => {
    renderAt('/');
    expect(screen.getByRole('navigation', { name: 'Seções' })).toBeInTheDocument();
  });

  it('/admin sem ser admin cai na tela de login', () => {
    renderAt('/admin');
    expect(screen.getByLabelText('E-mail do admin')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Seções' })).toBeNull();
  });

  it('rota desconhecida redireciona para /', () => {
    renderAt('/qualquer-coisa');
    expect(screen.getByRole('navigation', { name: 'Seções' })).toBeInTheDocument();
  });
});
