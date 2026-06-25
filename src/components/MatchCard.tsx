import { scheduleLine } from '../lib/matchSchedule';
import { shownCards } from '../lib/officialCards';

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

/** Marcador de cartões EXIBIDOS de uma seleção, ao lado do nome. */
function CardMark({ team, y, r }: { team: string; y: number; r: number }) {
  if (y + r === 0) return null;
  return (
    <span
      className="text-text-low shrink-0 font-mono text-[10px] tabular-nums"
      aria-label={`${team}: ${y} amarelos, ${r} vermelhos`}
    >
      {y > 0 && <span aria-hidden="true">🟨{y}</span>}
      {r > 0 && (
        <span aria-hidden="true" className={y > 0 ? 'ml-0.5' : ''}>
          🟥{r}
        </span>
      )}
    </span>
  );
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

  // Cartões EXIBIDOS, derivados dos 4 tipos do fair-play (2º amarelo = 2🟨+1🟥).
  const hcard = shownCards(live?.cards?.[match.home]);
  const acard = shownCards(live?.cards?.[match.away]);

  return (
    <div className="py-2.5">
      {/* cabeçalho: agenda à esquerda, status à direita */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-text-low min-w-0 flex-1 truncate font-mono text-[10px]">
          {scheduleLine(match.kickoff, match.venue)}
        </span>
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

      {/* linha de placar — cartões ao vivo ao lado de cada nome */}
      <div className="flex items-center justify-center gap-1.5">
        {live && <CardMark team={match.home} y={hcard.yellow} r={hcard.red} />}
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
        {live && <CardMark team={match.away} y={acard.yellow} r={acard.red} />}
      </div>

      {/* Overlay AO VIVO: placar real do jogo, sem mexer no palpite. */}
      {live && (
        <div className="border-hairline text-live mt-2 flex items-center justify-center gap-2 border-t pt-1.5 font-mono text-[10px]">
          <span className="text-text-low tracking-wide uppercase">placar</span>
          <span className="text-text-hi font-bold tabular-nums">
            {live.home ?? 0} × {live.away ?? 0}
          </span>
        </div>
      )}
    </div>
  );
}
