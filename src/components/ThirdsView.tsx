import { Fragment } from 'react';

import { staticData, teamsById } from '../data/static';
import { useSimulation } from '../hooks/useSimulation';
import { groupColor, groupTextColor } from '../lib/groupColors';

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

      {/* Tabela no mesmo estilo da classificação dos grupos: header de colunas
          em cima, linhas tabuladas, legenda no rodapé. */}
      <div className="bg-surface ring-border overflow-hidden rounded-[13px] ring-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-low font-mono text-[9px] uppercase [&>th]:py-2">
              <th className="w-7" />
              <th className="w-7" />
              <th className="w-6" />
              <th />
              <th className="w-7 text-center font-medium">Pts</th>
              <th className="w-8 text-center font-medium">SG</th>
              <th className="w-7 text-center font-medium">GP</th>
              <th className="w-7 text-center font-medium">CA</th>
              <th className="w-8 text-center font-medium">CV</th>
              <th className="w-14 pr-3 text-right font-medium">pega</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const slot = groupToSlot[r.group];
              const gameId = slot ? SLOT_TO_GAME[slot] : undefined;
              const out = !r.qualified;
              const fg = out ? '#FF2D55' : '#36C275';
              const bg = out ? '#FF2D551a' : '#36c2751a';
              return (
                <Fragment key={r.team}>
                  {i === 8 && (
                    <tr>
                      <td colSpan={10} className="px-3 pt-2 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-live font-mono text-[9px] whitespace-nowrap uppercase">
                            ✂ Linha de corte
                          </span>
                          <span className="border-live/40 flex-1 border-t border-dashed" />
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr
                    className="border-hairline border-t"
                    style={out ? { background: '#FF2D5508' } : undefined}
                  >
                    <td className="py-1.5 pl-3">
                      <span
                        className="font-display grid h-5 min-w-[20px] place-items-center rounded px-1 text-[12px] font-extrabold tabular-nums"
                        style={{ background: bg, color: fg }}
                      >
                        {r.rank}
                      </span>
                    </td>
                    <td className="py-1.5">
                      <span
                        className="rounded px-1 py-0.5 font-mono text-[10px]"
                        style={{ background: groupColor(r.group), color: groupTextColor(r.group) }}
                      >
                        3{r.group}
                      </span>
                    </td>
                    <td className="py-1.5">
                      <Flag code={r.team} className="text-base" />
                    </td>
                    <td className="py-1.5">
                      <span
                        className={`block truncate font-semibold ${out ? 'text-text-mid' : ''}`}
                      >
                        {nameOf(r.team)}
                      </span>
                    </td>
                    <td className="font-display py-1.5 text-center text-[15px] font-extrabold tabular-nums">
                      {r.points}
                    </td>
                    <td className="text-text-mid py-1.5 text-center font-mono text-[11px] tabular-nums">
                      {signed(r.goalDiff)}
                    </td>
                    <td className="text-text-low py-1.5 text-center font-mono text-[11px] tabular-nums">
                      {r.goalsFor}
                    </td>
                    <td
                      className={`py-1.5 text-center font-mono text-[11px] tabular-nums ${r.yellow ? 'text-card-yellow' : 'text-text-faint'}`}
                    >
                      {r.yellow}
                    </td>
                    <td
                      className={`py-1.5 text-center font-mono text-[11px] tabular-nums ${r.red ? 'text-card-red' : 'text-text-faint'}`}
                    >
                      {r.red}
                    </td>
                    <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                      {r.qualified && slot ? (
                        <span className="font-mono text-[10px]">
                          <span className="text-go font-bold">1{slot}</span>
                          {gameId ? <span className="text-text-faint"> ·J{gameId}</span> : null}
                        </span>
                      ) : (
                        <span className="text-live font-mono text-[10px] uppercase">fora</span>
                      )}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <div className="border-hairline text-text-low border-t px-3 py-1.5 font-mono text-[9px]">
          Pts pontos · SG saldo de gols · GP gols pró · CA amarelos · CV vermelhos
          <br />
          <span className="text-text-faint">
            3X = 3º colocado do grupo X · “pega 1Y ·Jnn” = enfrenta o 1º do grupo Y no jogo nn
          </span>
        </div>
      </div>
    </div>
  );
}
