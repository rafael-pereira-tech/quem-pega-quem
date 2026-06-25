import { useEffect, useRef } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { AdminLogin } from './components/AdminLogin';
import { AdminPanel } from './components/AdminPanel';
import { Bracket } from './components/Bracket';
import { DesktopScreen } from './components/DesktopScreen';
import { GroupsView } from './components/GroupsView';
import { BrandMark } from './components/Logo';
import { ThirdsView } from './components/ThirdsView';
import { useIsDesktop } from './hooks/useIsDesktop';
import { useSimulation } from './hooks/useSimulation';
import { useStore } from './state/store';
import { hasSupabase } from './supabase/client';
import { setAnalyticsUser, trackEvent } from './supabase/events';
import { useSession } from './supabase/session';
import { useOfficialSync } from './supabase/useOfficialSync';

type Tab = 'grupos' | 'chave' | 'terceiros';

const TAB_LINKS: { to: string; label: string }[] = [
  { to: '/', label: 'grupos' },
  { to: '/chave', label: 'chave' },
  { to: '/terceiros', label: 'Melhores 3º' },
];

const TAB_TITLE: Record<Tab, string> = {
  grupos: 'Grupos',
  chave: 'Chave do mata-mata',
  terceiros: 'Melhores terceiros',
};

export function App() {
  const result = useSimulation();
  const reset = useStore((s) => s.reset);
  const session = useSession();
  const isDesktop = useIsDesktop();
  useOfficialSync();

  const location = useLocation();
  const onAdmin = location.pathname.replace(/\/+$/, '') === '/admin';

  // Telemetria: liga a sessão à analytics e registra a abertura uma vez.
  const openedRef = useRef(false);
  useEffect(() => {
    if (!session.ready || !session.userId) return;
    setAnalyticsUser(session.userId);
    if (!openedRef.current) {
      openedRef.current = true;
      trackEvent('app_open');
    }
  }, [session.ready, session.userId]);

  const complete = result.standings.filter((s) => s.complete).length;
  const thirds = result.thirds.qualifiedGroups.length;

  // No desktop, qualquer rota de conteúdo mostra a tela completa (DesktopScreen).
  const content = (tab: Tab) =>
    isDesktop ? (
      <DesktopScreen />
    ) : (
      <div className="mx-auto h-full max-w-md overflow-auto px-4 py-4">
        <h2 className="sr-only">{TAB_TITLE[tab]}</h2>
        {tab === 'grupos' ? (
          <GroupsView />
        ) : tab === 'terceiros' ? (
          <ThirdsView />
        ) : (
          <Bracket games={result.bracket} />
        )}
      </div>
    );

  return (
    <div className="bg-canvas text-text-hi flex h-screen flex-col overflow-hidden">
      <a
        href="#conteudo"
        className="focus:bg-surface focus:ring-border sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:ring-1"
      >
        Pular para o conteúdo
      </a>
      <header className="bg-canvas/95 border-hairline shrink-0 border-b backdrop-blur">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <BrandMark size={28} decorative />
            <h1 className="font-display text-xl leading-none font-extrabold tracking-tight uppercase">
              Quem<span className="text-live">-</span>Pega<span className="text-live">-</span>Quem
            </h1>
            <span className="text-live flex items-center gap-1 font-mono text-[9px] tracking-wider uppercase">
              <span className="live-dot bg-live inline-block h-1.5 w-1.5 rounded-full" />
              {hasSupabase ? 'ao vivo' : 'local'}
            </span>
            {isDesktop && (
              <span className="text-text-low ml-2 font-mono text-[10px]">
                {complete}/12 grupos · {thirds} terceiros
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {session.userId && (
              <input
                defaultValue={session.nickname ?? ''}
                placeholder="apelido"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== session.nickname) void session.setNickname(v);
                }}
                className="bg-surface ring-border w-20 rounded-md px-2 py-1 text-sm ring-1"
              />
            )}
            {session.isAdmin && (
              <Link
                to={onAdmin ? '/' : '/admin'}
                onClick={() => {
                  if (!onAdmin) trackEvent('admin_open');
                }}
                className={`ring-border rounded-md px-2 py-1.5 font-mono text-[10px] uppercase ring-1 ${
                  onAdmin ? 'bg-third text-black' : 'text-third'
                }`}
              >
                {onAdmin ? '← app' : 'admin'}
              </Link>
            )}
            {session.email && (
              <button
                onClick={() => void session.signOut()}
                title={session.email}
                className="ring-border text-text-mid rounded-md px-2 py-1.5 font-mono text-[10px] uppercase ring-1"
              >
                sair
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Limpar seus palpites?')) {
                  reset();
                  trackEvent('reset');
                }
              }}
              className="ring-border text-text-mid rounded-md px-2 py-1.5 font-mono text-[10px] uppercase ring-1"
            >
              reset
            </button>
          </div>
        </div>

        {/* Abas só no mobile e fora do admin */}
        {!onAdmin && !isDesktop && (
          <nav aria-label="Seções" className="flex gap-1 rounded-none px-4 pb-2.5">
            <div className="bg-surface flex w-full gap-1 rounded-[13px] p-[5px]">
              {TAB_LINKS.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.to === '/'}
                  className={({ isActive }) =>
                    `font-display flex-1 rounded-[9px] py-1.5 text-center text-sm font-bold tracking-wide uppercase ${
                      isActive ? 'bg-live text-white' : 'text-text-mid'
                    }`
                  }
                >
                  {t.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main id="conteudo" tabIndex={-1} className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={content('grupos')} />
          <Route path="/chave" element={content('chave')} />
          <Route path="/terceiros" element={content('terceiros')} />
          <Route
            path="/admin"
            element={
              !session.ready ? null : session.isAdmin && session.userId ? (
                <div className="h-full overflow-auto p-4">
                  <h2 className="sr-only">Administração — resultados oficiais</h2>
                  <AdminPanel userId={session.userId} />
                </div>
              ) : (
                <>
                  <h2 className="sr-only">Login do admin</h2>
                  <AdminLogin signInWithOtp={session.signInWithOtp} />
                </>
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
