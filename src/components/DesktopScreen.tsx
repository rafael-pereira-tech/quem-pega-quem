import { useState } from "react";
import { GroupsView } from "./GroupsView";
import { BracketDesktop } from "./BracketDesktop";
import { ThirdsView } from "./ThirdsView";

type Pane = "chave" | "terceiros";

/** Tela desktop: 1/3 input (grupos) · 2/3 mata-mata. */
export function DesktopScreen() {
  const [pane, setPane] = useState<Pane>("chave");

  return (
    <div className="h-full flex">
      {/* Esquerda — input dos grupos */}
      <aside className="w-[392px] shrink-0 border-r border-hairline flex flex-col">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h2 className="font-display font-extrabold text-[22px] uppercase tracking-wide whitespace-nowrap">
            Última rodada
          </h2>
          <span className="font-mono text-[10px] text-text-mid bg-surface ring-1 ring-border rounded-full px-2 py-1">
            12 grupos
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-3.5 pb-10">
          <GroupsView />
        </div>
      </aside>

      {/* Direita — mata-mata */}
      <section className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-3 pb-2">
          <h2 className="font-display font-extrabold text-[22px] uppercase tracking-wide">
            Mata-mata
          </h2>
          <span className="flex items-center gap-1 font-mono text-[10px] text-go">
            <span className="w-2 h-2 rounded-[2px] bg-go inline-block" /> definido
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-third">
            <span className="w-2 h-2 rounded-[2px] bg-third inline-block" /> provisório
          </span>
          <div className="ml-auto flex rounded-lg bg-surface p-0.5 text-xs">
            {(["chave", "terceiros"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPane(p)}
                className={`px-3 py-1 rounded-md font-display font-bold uppercase tracking-wide ${
                  pane === p ? "bg-live text-white" : "text-text-mid"
                }`}
              >
                {p === "terceiros" ? "Melhores 3º" : "Chave"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0 px-5 pb-4">
          {pane === "chave" ? (
            <BracketDesktop />
          ) : (
            <div className="h-full overflow-auto max-w-xl">
              <ThirdsView />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
