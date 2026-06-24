import { useEffect, useRef, useState } from 'react';

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
const TABS: Tab[] = ['grupos', 'chave', 'terceiros'];

export function App() {
  const result = useSimulation();
  const reset = useStore((s) => s.reset);
  const session = useSession();
  const isDesktop = useIsDesktop();
  useOfficialSync();

  const [tab, setTab] = useState<Tab>('grupos');
  const [adminView, setAdminView] = useState(false);
  const showAdmin = adminView && session.isAdmin && session.userId;

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
              <button
                onClick={() =>
                  setAdminView((v) => {
                    const next = !v;
                    if (next) trackEvent('admin_open');
                    return next;
                  })
                }
                className={`ring-border rounded-md px-2 py-1.5 font-mono text-[10px] uppercase ring-1 ${
                  adminView ? 'bg-third text-black' : 'text-third'
                }`}
              >
                {adminView ? '← app' : 'admin'}
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

        {/* Abas só no mobile */}
        {!showAdmin && !isDesktop && (
          <nav aria-label="Seções" className="flex gap-1 rounded-none px-4 pb-2.5">
            <div className="bg-surface flex w-full gap-1 rounded-[13px] p-[5px]">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  aria-current={tab === t ? 'page' : undefined}
                  className={`font-display flex-1 rounded-[9px] py-1.5 text-sm font-bold tracking-wide uppercase ${
                    tab === t ? 'bg-live text-white' : 'text-text-mid'
                  }`}
                >
                  {t === 'terceiros' ? 'Melhores 3º' : t}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main id="conteudo" tabIndex={-1} className="flex-1 overflow-hidden">
        {showAdmin ? (
          <div className="h-full overflow-auto p-4">
            <h2 className="sr-only">Administração — resultados oficiais</h2>
            <AdminPanel userId={session.userId!} />
          </div>
        ) : isDesktop ? (
          <DesktopScreen />
        ) : (
          <div className="mx-auto h-full max-w-md overflow-auto px-4 py-4">
            <h2 className="sr-only">
              {tab === 'grupos'
                ? 'Grupos'
                : tab === 'terceiros'
                  ? 'Melhores terceiros'
                  : 'Chave do mata-mata'}
            </h2>
            {tab === 'grupos' ? (
              <GroupsView />
            ) : tab === 'terceiros' ? (
              <ThirdsView />
            ) : (
              <Bracket games={result.bracket} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
