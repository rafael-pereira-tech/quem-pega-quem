import { useState } from 'react';

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

  const complete = result.standings.filter((s) => s.complete).length;
  const thirds = result.thirds.qualifiedGroups.length;

  return (
    <div className="bg-canvas text-text-hi flex h-screen flex-col overflow-hidden">
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
                onClick={() => setAdminView((v) => !v)}
                className={`ring-border rounded-md px-2 py-1.5 font-mono text-[10px] uppercase ring-1 ${
                  adminView ? 'bg-third text-black' : 'text-third'
                }`}
              >
                {adminView ? '← app' : 'admin'}
              </button>
            )}
            <button
              onClick={() => confirm('Limpar seus palpites?') && reset()}
              className="ring-border text-text-mid rounded-md px-2 py-1.5 font-mono text-[10px] uppercase ring-1"
            >
              reset
            </button>
          </div>
        </div>

        {/* Abas só no mobile */}
        {!showAdmin && !isDesktop && (
          <nav className="flex gap-1 rounded-none px-4 pb-2.5">
            <div className="bg-surface flex w-full gap-1 rounded-[13px] p-[5px]">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
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

      <main className="flex-1 overflow-hidden">
        {showAdmin ? (
          <div className="h-full overflow-auto p-4">
            <AdminPanel userId={session.userId!} />
          </div>
        ) : isDesktop ? (
          <DesktopScreen />
        ) : (
          <div className="mx-auto h-full max-w-md overflow-auto px-4 py-4">
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
