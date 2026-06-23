import { Flag } from './Flag';
import { Stepper } from './Stepper';

import type { GroupMatch } from '../engine/types';

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
      <div className="mb-1.5 flex items-center justify-end">
        {locked ? (
          <span className="ring-border text-text-low rounded-md px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase ring-1">
            Encerrado
          </span>
        ) : (
          <span className="ring-lime/50 text-lime rounded-md px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase ring-1">
            {played ? 'Palpite' : 'A jogar'}
          </span>
        )}
      </div>

      {/* linha de placar */}
      <div className="flex items-center justify-center gap-1.5">
        <span className="font-display text-text-mid w-9 text-right text-[15px] font-bold uppercase">
          {match.home}
        </span>
        <Flag code={match.home} className="text-lg" />
        {locked ? (
          <span
            className={`font-display w-7 text-center text-2xl font-extrabold tabular-nums ${homeWin ? 'text-lime' : awayWin ? 'text-text-low' : 'text-text-hi'}`}
          >
            {hg ?? '–'}
          </span>
        ) : (
          <Stepper value={hg} onChange={(v) => onScore(v, ag)} />
        )}

        <span className="font-display text-text-faint px-0.5">×</span>

        {locked ? (
          <span
            className={`font-display w-7 text-center text-2xl font-extrabold tabular-nums ${awayWin ? 'text-lime' : homeWin ? 'text-text-low' : 'text-text-hi'}`}
          >
            {ag ?? '–'}
          </span>
        ) : (
          <Stepper value={ag} onChange={(v) => onScore(hg, v)} />
        )}
        <Flag code={match.away} className="text-lg" />
        <span className="font-display text-text-mid w-9 text-[15px] font-bold uppercase">
          {match.away}
        </span>
      </div>
    </div>
  );
}
