import { Flag } from './Flag';
import { Stepper } from './Stepper';

import type { GroupMatch, MatchCards } from '../engine/types';

/** Resultado AO VIVO (overlay): placar/cartões reais do jogo em andamento. Não
 *  mexe no palpite do usuário — é só informação (ver ADR 0006). */
export interface LiveOverlay {
  home: number | null;
  away: number | null;
  cards?: Partial<Record<string, MatchCards>> | null;
}

/** Card de jogo compacto estilo GE: cabeçalho com status + linha de placar com steppers horizontais. */
export function MatchCard({
  match,
  onScore,
  live,
}: {
  match: GroupMatch;
  onScore: (home: number | null, away: number | null) => void;
  live?: LiveOverlay;
}) {
  const locked = match.locked === true;
  const hg = match.homeGoals;
  const ag = match.awayGoals;
  const played = hg !== null && ag !== null;
  const homeWin = played && hg > ag;
  const awayWin = played && ag > hg;

  const hc = live?.cards?.[match.home];
  const ac = live?.cards?.[match.away];
  const hy = hc?.yellow ?? 0;
  const ay = ac?.yellow ?? 0;
  const hr = hc?.directRed ?? 0;
  const ar = ac?.directRed ?? 0;
  const anyCards = hy + ay + hr + ar > 0;

  return (
    <div className="py-2.5">
      {/* cabeçalho: status à direita */}
      <div className="mb-1.5 flex items-center justify-end">
        {locked ? (
          <span className="ring-border text-text-low rounded-md px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase ring-1">
            Encerrado
          </span>
        ) : live ? (
          <span className="ring-live/50 text-live flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase ring-1">
            <span className="live-dot bg-live inline-block h-1.5 w-1.5 rounded-full" />
            Ao vivo
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
          <Stepper
            value={hg}
            onChange={(v) => onScore(v, ag)}
            label={`Gols de ${match.home} — mandante`}
          />
        )}

        <span className="font-display text-text-faint px-0.5">×</span>

        {locked ? (
          <span
            className={`font-display w-7 text-center text-2xl font-extrabold tabular-nums ${awayWin ? 'text-lime' : homeWin ? 'text-text-low' : 'text-text-hi'}`}
          >
            {ag ?? '–'}
          </span>
        ) : (
          <Stepper
            value={ag}
            onChange={(v) => onScore(hg, v)}
            label={`Gols de ${match.away} — visitante`}
          />
        )}
        <Flag code={match.away} className="text-lg" />
        <span className="font-display text-text-mid w-9 text-[15px] font-bold uppercase">
          {match.away}
        </span>
      </div>

      {/* Overlay AO VIVO: placar/cartões reais do jogo, sem mexer no palpite. */}
      {live && (
        <div className="border-hairline text-live mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 border-t pt-1.5 font-mono text-[10px]">
          <span className="text-text-low tracking-wide uppercase">placar</span>
          <span className="text-text-hi font-bold tabular-nums">
            {live.home ?? 0} × {live.away ?? 0}
          </span>
          {anyCards && (
            <span
              className="text-text-low"
              aria-label={`Cartões: amarelos ${hy} a ${ay}, vermelhos ${hr} a ${ar}`}
            >
              CA {hy}-{ay} · CV {hr}-{ar}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
