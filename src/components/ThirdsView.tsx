import { staticData, teamsById } from '../data/static';
import { useSimulation } from '../hooks/useSimulation';
import { groupColor, groupTextColor } from '../lib/groupColors';

import { Cards } from './Cards';
import { Flag } from './Flag';

import type { GroupId } from '../engine/types';

const nameOf = (id: string) => teamsById.get(id)?.name || id;
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

// slot (grupo-vencedor) → id do jogo de R32 onde entra o terceiro daquele slot.
const SLOT_TO_GAME: Partial<Record<GroupId, string>> = (() => {
  const map: Partial<Record<GroupId, string>> = {};
  for (const game of staticData.structure) {
    for (const side of [game.home, game.away]) {
      if (side.from === 'third') map[side.slot] = game.id;
    }
  }
  return map;
})();

export function ThirdsView() {
  const result = useSimulation();
  const { rows } = result.thirds;
  const assignment = result.thirdAssignment;

  // grupo do terceiro → slot (grupo-vencedor que ele enfrenta)
  const groupToSlot: Partial<Record<GroupId, GroupId>> = {};
  if (assignment) {
    for (const [slot, grp] of Object.entries(assignment) as [GroupId, GroupId][]) {
      groupToSlot[grp] = slot;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-[30px] leading-none font-extrabold uppercase">
          Melhores 3º
        </h2>
        <span className="text-text-low ml-auto font-mono text-[10px]">Pts › SG › GP › cartões</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="bg-go/15 text-go rounded-full px-2 py-0.5 font-mono text-[10px] uppercase">
          8 entram
        </span>
        <span className="bg-surface text-text-mid ring-border rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ring-1">
          4 saem
        </span>
      </div>

      <div className="space-y-1.5">
        {rows.map((r, i) => {
          const slot = groupToSlot[r.group];
          const gameId = slot ? SLOT_TO_GAME[slot] : undefined;
          const lastIn = i === 7;
          const out = !r.qualified;
          return (
            <div key={r.team}>
              {i === 8 && (
                <div className="my-1.5 flex items-center gap-2">
                  <span className="text-live font-mono text-[10px] uppercase">
                    ✂ Linha de corte
                  </span>
                  <span className="border-live/50 flex-1 border-t-2 border-dashed" />
                </div>
              )}
              <div
                className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2"
                style={{
                  borderLeft: `3px solid ${out ? '#FF2D5566' : groupColor(r.group)}`,
                  background: out ? '#FF2D5508' : lastIn ? '#36c2750f' : '#141A24',
                  boxShadow: lastIn ? '0 0 0 1px #36c27555' : undefined,
                }}
              >
                <span
                  className="font-display w-5 text-center text-lg font-extrabold tabular-nums"
                  style={{ color: out ? '#FF2D55' : lastIn ? '#36C275' : undefined }}
                >
                  {r.rank}
                </span>
                <span
                  className="shrink-0 rounded px-1 py-0.5 font-mono text-[10px]"
                  style={{ background: groupColor(r.group), color: groupTextColor(r.group) }}
                >
                  3{r.group}
                </span>
                <Flag code={r.team} className="shrink-0 text-base" />
                <span className={`flex-1 truncate font-semibold ${out ? 'text-text-mid' : ''}`}>
                  {nameOf(r.team)}
                </span>
                <span className="text-text-mid font-mono text-[11px] tabular-nums">
                  {r.points}·{signed(r.goalDiff)}·{r.goalsFor}
                </span>
                <Cards yellow={r.yellow} red={r.red} />
                {r.qualified && slot ? (
                  <span className="bg-go/15 text-go rounded px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap">
                    → 1{slot}
                    {gameId ? ` ·J${gameId}` : ''}
                  </span>
                ) : (
                  <span className="text-live font-mono text-[10px] uppercase">Fora</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
