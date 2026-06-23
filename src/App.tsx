import { useState } from "react";
import { useSimulation } from "./hooks/useSimulation";
import { useIsDesktop } from "./hooks/useIsDesktop";
import { useStore } from "./state/store";
import { useSession } from "./supabase/session";
import { useOfficialSync } from "./supabase/useOfficialSync";
import { hasSupabase } from "./supabase/client";
import { GroupsView } from "./components/GroupsView";
import { ThirdsView } from "./components/ThirdsView";
import { Bracket } from "./components/Bracket";
import { DesktopScreen } from "./components/DesktopScreen";
import { AdminPanel } from "./components/AdminPanel";

type Tab = "grupos" | "chave" | "terceiros";
const TABS: Tab[] = ["grupos", "chave", "terceiros"];

export function App() {
  const result = useSimulation();
  const reset = useStore((s) => s.reset);
  const session = useSession();
  const isDesktop = useIsDesktop();
  useOfficialSync();

  const [tab, setTab] = useState<Tab>("grupos");
  const [adminView, setAdminView] = useState(false);
  const showAdmin = adminView && session.isAdmin && session.userId;

  const complete = result.standings.filter((s) => s.complete).length;
  const thirds = result.thirds.qualifiedGroups.length;

  return (
    <div className="h-screen flex flex-col bg-canvas text-text-hi overflow-hidden">
      <header className="shrink-0 bg-canvas/95 backdrop-blur border-b border-hairline">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-xl uppercase tracking-tight leading-none">
              Quem<span className="text-live">-</span>Pega<span className="text-live">-</span>Quem
            </h1>
            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-live">
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-live inline-block" />
              {hasSupabase ? "ao vivo" : "local"}
            </span>
            {isDesktop && (
              <span className="ml-2 font-mono text-[10px] text-text-low">
                {complete}/12 grupos · {thirds} terceiros
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {session.userId && (
              <input
                defaultValue={session.nickname ?? ""}
                placeholder="apelido"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== session.nickname) void session.setNickname(v);
                }}
                className="w-20 text-sm bg-surface ring-1 ring-border rounded-md px-2 py-1 outline-none focus:ring-live"
              />
            )}
            {session.isAdmin && (
              <button
                onClick={() => setAdminView((v) => !v)}
                className={`font-mono text-[10px] uppercase px-2 py-1.5 rounded-md ring-1 ring-border ${
                  adminView ? "bg-third text-black" : "text-third"
                }`}
              >
                {adminView ? "← app" : "admin"}
              </button>
            )}
            <button
              onClick={() => confirm("Limpar seus palpites?") && reset()}
              className="font-mono text-[10px] uppercase px-2 py-1.5 rounded-md ring-1 ring-border text-text-mid"
            >
              reset
            </button>
          </div>
        </div>

        {/* Abas só no mobile */}
        {!showAdmin && !isDesktop && (
          <nav className="px-4 pb-2.5 flex rounded-none gap-1">
            <div className="flex w-full rounded-[13px] bg-surface p-[5px] gap-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-[9px] font-display font-bold uppercase text-sm tracking-wide ${
                    tab === t ? "bg-live text-white" : "text-text-mid"
                  }`}
                >
                  {t === "terceiros" ? "Melhores 3º" : t}
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
          <div className="h-full overflow-auto px-4 py-4 max-w-md mx-auto">
            {tab === "grupos" ? (
              <GroupsView />
            ) : tab === "terceiros" ? (
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
