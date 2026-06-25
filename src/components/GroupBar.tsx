import { useLayoutEffect, useRef, useState } from 'react';

import { teamsById } from '../data/static';
import { useFlip } from '../hooks/useFlip';
import { useSwipe } from '../hooks/useSwipe';
import { groupColor, groupColorAlpha, groupTextColor } from '../lib/groupColors';
import { slideIn } from '../lib/motion';

import { Flag } from './Flag';
import { MatchCard } from './MatchCard';

import type { GroupMatch, GroupStanding, Round } from '../engine/types';
import type { OfficialResult } from '../lib/buildInput';

const nameOf = (id: string) => teamsById.get(id)?.name || id;
const ROUND_LABEL: Record<Round, string> = { 1: '1ª Rodada', 2: '2ª Rodada', 3: '3ª Rodada' };

function tintFor(position: number, thirdQualified: boolean) {
  if (position <= 2) return { fg: '#36C275', bg: '#36c2751a', bd: '#36c27540' };
  if (position === 3)
    return thirdQualified
      ? { fg: '#36C275', bg: '#36c2751a', bd: '#36c27540' }
      : { fg: '#FFB400', bg: '#FFB4001a', bd: '#FFB40040' };
  return { fg: '#687087', bg: '#141A24', bd: '#28303F' };
}

/** Pílula compacta: posição do 3º colocado no ranking dos 12 melhores terceiros. */
function ThirdRankPill({ rank, qualified }: { rank: number; qualified: boolean }) {
  if (!rank) return null;
  const c = qualified
    ? { fg: '#36C275', bg: '#36c2751a', bd: '#36c27540' }
    : { fg: '#FFB400', bg: '#FFB4001a', bd: '#FFB40040' };
  return (
    <span
      title={`${rank}º melhor terceiro${qualified ? ' — dentro do corte (top 8)' : ' — fora do corte'}`}
      className="shrink-0 rounded px-1 py-px font-mono text-[9px] whitespace-nowrap"
      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.bd}` }}
    >
      {rank}º melhor 3º
    </span>
  );
}

export function GroupBar({
  standing,
  matches,
  onScore,
  thirdQualified,
  thirdRank,
  official = {},
}: {
  standing: GroupStanding;
  matches: GroupMatch[];
  onScore: (matchId: string, home: number | null, away: number | null) => void;
  thirdQualified: boolean;
  thirdRank: number;
  /** Resultados oficiais; os `locked=false` viram overlay "AO VIVO" no card. */
  official?: Record<string, OfficialResult>;
}) {
  const g = standing.group;
  const color = groupColor(g);
  const [expanded, setExpanded] = useState(false);
  const [round, setRound] = useState<Round>(3);
  const roundMatches = matches.filter((m) => m.round === round);

  // Anima a reordenação dos times após um update: a fila das pills e as linhas
  // da tabela deslizam para a nova posição. A chave muda quando a ordem muda.
  const order = standing.table.map((r) => r.team).join(',');
  const pillsRef = useFlip<HTMLSpanElement>(order);
  const tableRef = useFlip<HTMLTableSectionElement>(expanded ? `open:${order}` : 'closed');

  // Navegação entre rodadas com slide direcional (botões ‹ › e swipe no card).
  const [dir, setDir] = useState<1 | -1>(1);
  const matchesRef = useRef<HTMLDivElement>(null);
  const firstRound = useRef(true);

  const changeRound = (next: number) => {
    if (next < 1 || next > 3 || next === round) return;
    setDir(next > round ? 1 : -1);
    setRound(next as Round);
  };

  useLayoutEffect(() => {
    if (firstRound.current) {
      firstRound.current = false;
      return;
    }
    if (matchesRef.current) slideIn(matchesRef.current, dir === 1 ? 28 : -28);
  }, [round, dir]);

  const swipe = useSwipe(
    () => changeRound(round + 1),
    () => changeRound(round - 1),
  );

  return (
    <div className="space-y-2.5">
      {/* Barra do grupo (colapsada) */}
      <div
        className="bg-surface rounded-[13px]"
        style={{ boxShadow: `inset 0 0 0 1px ${groupColorAlpha(g, '33')}` }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
        >
          <span
            className="font-display grid shrink-0 place-items-center rounded-md text-[15px] font-extrabold"
            style={{ width: 26, height: 26, background: color, color: groupTextColor(g) }}
          >
            {g}
          </span>
          <span className="font-display text-[15px] font-bold tracking-wide uppercase">
            Grupo {g}
          </span>
          <span ref={pillsRef} className="ml-auto flex items-center gap-1">
            {standing.table.slice(0, 3).map((r) => {
              const t = tintFor(r.position, thirdQualified);
              return (
                <span
                  key={r.team}
                  data-flip-key={r.team}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px]"
                  style={{ background: t.bg, border: `1px solid ${t.bd}` }}
                >
                  <span style={{ color: t.fg }}>{r.position}</span>
                  <span className="text-text-hi">{r.team}</span>
                  {r.position === 3 && thirdRank > 0 && (
                    <span
                      className="font-bold"
                      style={{ color: t.fg }}
                      title={`${thirdRank}º melhor terceiro`}
                    >
                      ·{thirdRank}º
                    </span>
                  )}
                </span>
              );
            })}
          </span>
          <span
            aria-hidden="true"
            className={`text-text-low transition ${expanded ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
        </button>

        {expanded && (
          <div className="border-hairline border-t">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-low font-mono text-[9px] uppercase">
                  <th className="w-7" />
                  <th className="w-6" />
                  <th />
                  <th className="w-7 text-center font-medium">Pts</th>
                  <th className="w-8 text-center font-medium">SG</th>
                  <th className="w-7 text-center font-medium">GP</th>
                  <th className="w-7 text-center font-medium">CA</th>
                  <th className="w-8 pr-3 text-center font-medium">CV</th>
                </tr>
              </thead>
              <tbody ref={tableRef}>
                {standing.table.map((r) => {
                  const t = tintFor(r.position, thirdQualified);
                  return (
                    <tr key={r.team} data-flip-key={r.team} className="border-hairline border-t">
                      <td className="py-1.5 pl-3">
                        <span
                          className="font-display grid h-5 w-5 place-items-center rounded text-[12px] font-extrabold"
                          style={{ background: t.bg, color: t.fg }}
                        >
                          {r.position}
                        </span>
                      </td>
                      <td className="py-1.5">
                        <Flag code={r.team} className="text-base" />
                      </td>
                      <td className="py-1.5">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate font-semibold">{nameOf(r.team)}</span>
                          {r.position === 3 && (
                            <ThirdRankPill rank={thirdRank} qualified={thirdQualified} />
                          )}
                        </div>
                      </td>
                      <td className="font-display py-1.5 text-center text-[15px] font-extrabold tabular-nums">
                        {r.points}
                      </td>
                      <td className="text-text-mid py-1.5 text-center font-mono text-[11px] tabular-nums">
                        {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
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
                        className={`py-1.5 pr-3 text-center font-mono text-[11px] tabular-nums ${r.red ? 'text-card-red' : 'text-text-faint'}`}
                      >
                        {r.red}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-hairline text-text-low border-t px-3 py-1.5 font-mono text-[9px]">
              Pts pontos · SG saldo de gols · GP gols pró · CA amarelos · CV vermelhos
              <br />
              <span className="text-text-faint">
                “Xº melhor 3º” = posição do 3º colocado entre os 12 terceiros (8 entram)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card de jogos (aberto) — swipe horizontal troca de rodada */}
      <div className="bg-surface ring-hairline overflow-hidden rounded-[14px] ring-1" {...swipe}>
        <div className="border-hairline flex items-center justify-between border-b px-3 py-2">
          <button
            onClick={() => changeRound(round - 1)}
            disabled={round === 1}
            aria-label="Rodada anterior"
            className="bg-bg ring-border disabled:text-text-faint enabled:text-lime grid h-7 w-7 shrink-0 place-items-center rounded-full ring-1"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <span className="font-display text-[15px] font-extrabold tracking-wide uppercase">
            {ROUND_LABEL[round]} · Jogos
          </span>
          <button
            onClick={() => changeRound(round + 1)}
            disabled={round === 3}
            aria-label="Próxima rodada"
            className="bg-bg ring-border disabled:text-text-faint enabled:text-lime grid h-7 w-7 shrink-0 place-items-center rounded-full ring-1"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <div ref={matchesRef} className="divide-hairline divide-y px-3">
          {roundMatches.map((m) => {
            const off = official[m.id];
            const live =
              off && off.locked === false
                ? { home: off.homeGoals, away: off.awayGoals, cards: off.cards }
                : undefined;
            return (
              <MatchCard key={m.id} match={m} live={live} onScore={(h, a) => onScore(m.id, h, a)} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
