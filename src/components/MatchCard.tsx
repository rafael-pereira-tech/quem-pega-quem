import type { GroupMatch } from "../engine/types";
import { Flag } from "./Flag";
import { Stepper } from "./Stepper";

/** Card de jogo compacto estilo GE: cabeçalho com status + linha de placar com steppers horizontais. */
export function MatchCard({
  match,
  onScore,
}: {
  match: GroupMatch;
  onScore: (home: number | null, away: number | null) => void;
}) {
  const locked = match.locked === true;
  const hg = match.homeGoals;
  const ag = match.awayGoals;
  const played = hg !== null && ag !== null;
  const homeWin = played && hg > ag;
  const awayWin = played && ag > hg;

  return (
    <div className="py-2.5">
      {/* cabeçalho: status à direita */}
      <div className="flex items-center justify-end mb-1.5">
        {locked ? (
          <span className="font-mono text-[10px] uppercase tracking-wider rounded-md px-2 py-0.5 ring-1 ring-border text-text-low">
            Encerrado
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-wider rounded-md px-2 py-0.5 ring-1 ring-lime/50 text-lime">
            {played ? "Palpite" : "A jogar"}
          </span>
        )}
      </div>

      {/* linha de placar */}
      <div className="flex items-center justify-center gap-1.5">
        <span className="font-display font-bold text-[15px] uppercase text-text-mid w-9 text-right">
          {match.home}
        </span>
        <Flag code={match.home} className="text-lg" />
        {locked ? (
          <span
            className={`font-display font-extrabold text-2xl w-7 text-center tabular-nums ${homeWin ? "text-lime" : awayWin ? "text-text-low" : "text-text-hi"}`}
          >
            {hg ?? "–"}
          </span>
        ) : (
          <Stepper value={hg} onChange={(v) => onScore(v, ag)} />
        )}

        <span className="font-display text-text-faint px-0.5">×</span>

        {locked ? (
          <span
            className={`font-display font-extrabold text-2xl w-7 text-center tabular-nums ${awayWin ? "text-lime" : homeWin ? "text-text-low" : "text-text-hi"}`}
          >
            {ag ?? "–"}
          </span>
        ) : (
          <Stepper value={ag} onChange={(v) => onScore(hg, v)} />
        )}
        <Flag code={match.away} className="text-lg" />
        <span className="font-display font-bold text-[15px] uppercase text-text-mid w-9">
          {match.away}
        </span>
      </div>
    </div>
  );
}
