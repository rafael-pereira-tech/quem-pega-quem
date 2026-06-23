import { useState } from 'react';

import { BracketDesktop } from './BracketDesktop';
import { GroupsView } from './GroupsView';
import { ThirdsView } from './ThirdsView';

type Pane = 'chave' | 'terceiros';

/** Tela desktop: 1/3 input (grupos) · 2/3 mata-mata. */
export function DesktopScreen() {
  const [pane, setPane] = useState<Pane>('chave');

  return (
    <div className="flex h-full">
      {/* Esquerda — input dos grupos */}
      <aside className="border-hairline flex w-[392px] shrink-0 flex-col border-r">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h2 className="font-display text-[22px] font-extrabold tracking-wide whitespace-nowrap uppercase">
            Última rodada
          </h2>
          <span className="text-text-mid bg-surface ring-border rounded-full px-2 py-1 font-mono text-[10px] ring-1">
            12 grupos
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-3.5 pb-10">
          <GroupsView />
        </div>
      </aside>

      {/* Direita — mata-mata */}
      <section className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-3 pb-2">
          <h2 className="font-display text-[22px] font-extrabold tracking-wide uppercase">
            Mata-mata
          </h2>
          <span className="text-go flex items-center gap-1 font-mono text-[10px]">
            <span className="bg-go inline-block h-2 w-2 rounded-[2px]" /> definido
          </span>
          <span className="text-third flex items-center gap-1 font-mono text-[10px]">
            <span className="bg-third inline-block h-2 w-2 rounded-[2px]" /> provisório
          </span>
          <div className="bg-surface ml-auto flex rounded-lg p-0.5 text-xs">
            {(['chave', 'terceiros'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPane(p)}
                className={`font-display rounded-md px-3 py-1 font-bold tracking-wide uppercase ${
                  pane === p ? 'bg-live text-white' : 'text-text-mid'
                }`}
              >
                {p === 'terceiros' ? 'Melhores 3º' : 'Chave'}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 px-5 pb-4">
          {pane === 'chave' ? (
            <BracketDesktop />
          ) : (
            <div className="h-full max-w-xl overflow-auto">
              <ThirdsView />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
