import { useState } from "react";
import type { GroupMatch, GroupStanding, Round } from "../engine/types";
import { groupColor, groupColorAlpha, groupTextColor } from "../lib/groupColors";
import { teamsById } from "../data/static";
import { Flag } from "./Flag";
import { MatchCard } from "./MatchCard";

const nameOf = (id: string) => teamsById.get(id)?.name || id;
const ROUND_LABEL: Record<Round, string> = { 1: "1ª Rodada", 2: "2ª Rodada", 3: "3ª Rodada" };

function tintFor(position: number, thirdQualified: boolean) {
  if (position <= 2) return { fg: "#36C275", bg: "#36c2751a", bd: "#36c27540" };
  if (position === 3)
    return thirdQualified
      ? { fg: "#36C275", bg: "#36c2751a", bd: "#36c27540" }
      : { fg: "#FFB400", bg: "#FFB4001a", bd: "#FFB40040" };
  return { fg: "#687087", bg: "#141A24", bd: "#28303F" };
}

/** Pílula compacta: posição do 3º colocado no ranking dos 12 melhores terceiros. */
function ThirdRankPill({ rank, qualified }: { rank: number; qualified: boolean }) {
  if (!rank) return null;
  const c = qualified
    ? { fg: "#36C275", bg: "#36c2751a", bd: "#36c27540" }
    : { fg: "#FFB400", bg: "#FFB4001a", bd: "#FFB40040" };
  return (
    <span
      title={`${rank}º melhor terceiro${qualified ? " — dentro do corte (top 8)" : " — fora do corte"}`}
      className="font-mono text-[9px] rounded px-1 py-px whitespace-nowrap shrink-0"
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
}: {
  standing: GroupStanding;
  matches: GroupMatch[];
  onScore: (matchId: string, home: number | null, away: number | null) => void;
  thirdQualified: boolean;
  thirdRank: number;
}) {
  const g = standing.group;
  const color = groupColor(g);
  const [expanded, setExpanded] = useState(false);
  const [round, setRound] = useState<Round>(3);
  const roundMatches = matches.filter((m) => m.round === round);

  return (
    <div className="space-y-2.5">
      {/* Barra do grupo (colapsada) */}
      <div
        className="rounded-[13px] bg-surface"
        style={{ boxShadow: `inset 0 0 0 1px ${groupColorAlpha(g, "33")}` }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
        >
          <span
            className="grid place-items-center font-display font-extrabold text-[15px] rounded-md shrink-0"
            style={{ width: 26, height: 26, background: color, color: groupTextColor(g) }}
          >
            {g}
          </span>
          <span className="font-display font-bold uppercase tracking-wide text-[15px]">Grupo {g}</span>
          <span className="ml-auto flex items-center gap-1">
            {standing.table.slice(0, 3).map((r) => {
              const t = tintFor(r.position, thirdQualified);
              return (
                <span
                  key={r.team}
                  className="font-mono text-[10px] rounded-md px-1.5 py-0.5 flex items-center gap-1"
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
          <span className={`text-text-low transition ${expanded ? "rotate-180" : ""}`}>▾</span>
        </button>

        {expanded && (
          <div className="border-t border-hairline">
            <table className="w-full text-sm">
              <thead>
                <tr className="font-mono text-[9px] uppercase text-text-low">
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
              <tbody>
                {standing.table.map((r) => {
                  const t = tintFor(r.position, thirdQualified);
                  return (
                    <tr key={r.team} className="border-t border-hairline">
                      <td className="py-1.5 pl-3">
                        <span
                          className="font-display font-extrabold text-[12px] grid place-items-center rounded w-5 h-5"
                          style={{ background: t.bg, color: t.fg }}
                        >
                          {r.position}
                        </span>
                      </td>
                      <td className="py-1.5">
                        <Flag code={r.team} className="text-base" />
                      </td>
                      <td className="py-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold truncate">{nameOf(r.team)}</span>
                          {r.position === 3 && (
                            <ThirdRankPill rank={thirdRank} qualified={thirdQualified} />
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 text-center font-display font-extrabold text-[15px] tabular-nums">
                        {r.points}
                      </td>
                      <td className="py-1.5 text-center font-mono text-[11px] text-text-mid tabular-nums">
                        {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                      </td>
                      <td className="py-1.5 text-center font-mono text-[11px] text-text-low tabular-nums">
                        {r.goalsFor}
                      </td>
                      <td
                        className={`py-1.5 text-center font-mono text-[11px] tabular-nums ${r.yellow ? "text-card-yellow" : "text-text-faint"}`}
                      >
                        {r.yellow}
                      </td>
                      <td
                        className={`py-1.5 pr-3 text-center font-mono text-[11px] tabular-nums ${r.red ? "text-card-red" : "text-text-faint"}`}
                      >
                        {r.red}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-3 py-1.5 border-t border-hairline font-mono text-[9px] text-text-low">
              Pts pontos · SG saldo de gols · GP gols pró · CA amarelos · CV vermelhos
              <br />
              <span className="text-text-faint">
                “Xº melhor 3º” = posição do 3º colocado entre os 12 terceiros (8 entram)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card de jogos (aberto) */}
      <div className="rounded-[14px] bg-surface ring-1 ring-hairline overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-hairline">
          <button
            onClick={() => setRound((r) => Math.max(1, r - 1) as Round)}
            disabled={round === 1}
            className="w-7 h-7 rounded-full bg-bg ring-1 ring-border grid place-items-center disabled:text-text-faint enabled:text-lime shrink-0"
          >
            ‹
          </button>
          <span className="font-display font-extrabold uppercase text-[15px] tracking-wide">
            {ROUND_LABEL[round]} · Jogos
          </span>
          <button
            onClick={() => setRound((r) => Math.min(3, r + 1) as Round)}
            disabled={round === 3}
            className="w-7 h-7 rounded-full bg-bg ring-1 ring-border grid place-items-center disabled:text-text-faint enabled:text-lime shrink-0"
          >
            ›
          </button>
        </div>
        <div className="px-3 divide-y divide-hairline">
          {roundMatches.map((m) => (
            <MatchCard key={m.id} match={m} onScore={(h, a) => onScore(m.id, h, a)} />
          ))}
        </div>
      </div>
    </div>
  );
}
