import { useState } from 'react';

import { teamsById } from '../data/static';
import { computeLayout } from '../lib/bracketLayout';
import { useStore } from '../state/store';

import { Flag } from './Flag';
import { ScoreBox } from './ScoreBox';

import type { ResolvedKnockoutGame, ResolvedSide } from '../engine/types';

const nameOf = (id: string) => teamsById.get(id)?.name || id;

function GameCard({ game }: { game: ResolvedKnockoutGame }) {
  const koScores = useStore((s) => s.scenario.koScores);
  const official = useStore((s) => s.official);
  const setKoScore = useStore((s) => s.setKoScore);

  const off = official[game.id];
  const locked = off?.locked === true;
  const bothKnown = Boolean(game.home.team && game.away.team);
  const cur = koScores[game.id];
  const hg = locked ? off!.homeGoals : (cur?.homeGoals ?? null);
  const ag = locked ? off!.awayGoals : (cur?.awayGoals ?? null);
  const pens = locked
    ? off!.homePens != null && off!.awayPens != null
      ? { home: off!.homePens, away: off!.awayPens }
      : null
    : (cur?.penalties ?? null);
  const tied = hg !== null && ag !== null && hg === ag;

  const Row = ({
    side,
    goals,
    onGoals,
  }: {
    side: ResolvedSide;
    goals: number | null;
    onGoals: (v: number | null) => void;
  }) => {
    const isWinner = game.winner !== undefined && game.winner === side.team;
    return (
      <div
        className={`flex items-center gap-1.5 ${isWinner ? 'text-lime font-bold' : 'text-text-hi'}`}
      >
        {side.team ? (
          <Flag code={side.team} className="shrink-0 text-sm" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="flex-1 truncate text-[13px]" title={side.label}>
          {side.team ? (
            nameOf(side.team)
          ) : (
            <span className="text-text-faint font-mono text-[11px]">{side.label}</span>
          )}
        </span>
        <ScoreBox
          value={goals}
          disabled={locked || !bothKnown}
          onChange={onGoals}
          label={side.label}
        />
      </div>
    );
  };

  return (
    <div
      className={`w-full space-y-1 rounded-[10px] p-2 ${
        locked ? 'bg-surface-dim ring-hairline ring-1' : 'bg-surface ring-border ring-1'
      }`}
    >
      <div className="text-text-low flex items-center justify-between font-mono text-[9px]">
        <span>J{game.id}</span>
        {locked && <span title="oficial">🔒</span>}
      </div>
      <Row side={game.home} goals={hg} onGoals={(v) => setKoScore(game.id, { homeGoals: v })} />
      <Row side={game.away} goals={ag} onGoals={(v) => setKoScore(game.id, { awayGoals: v })} />
      {tied && (
        <div className="border-hairline text-text-mid flex items-center gap-1.5 border-t pt-1 text-[10px]">
          <span className="flex-1 font-mono">pên</span>
          <ScoreBox
            value={pens?.home ?? null}
            disabled={locked}
            label="pên casa"
            onChange={(v) =>
              setKoScore(game.id, { penalties: { home: v ?? 0, away: pens?.away ?? 0 } })
            }
          />
          <ScoreBox
            value={pens?.away ?? null}
            disabled={locked}
            label="pên fora"
            onChange={(v) =>
              setKoScore(game.id, { penalties: { home: pens?.home ?? 0, away: v ?? 0 } })
            }
          />
        </div>
      )}
    </div>
  );
}

/**
 * Mata-mata no mobile: só os 16-avos de um lado (toggle), em pares cujas
 * linhas convergem à direita (conector desenhado no ::after de cada par).
 */
export function Bracket({ games }: { games: ResolvedKnockoutGame[] }) {
  const { col } = computeLayout(games);
  const [side, setSide] = useState<'L' | 'R'>('L');

  const r32 = col('R32', side);
  const pairs: ResolvedKnockoutGame[][] = [];
  for (let i = 0; i < r32.length; i += 2) pairs.push(r32.slice(i, i + 2));

  return (
    <div className="space-y-3">
      {/* Toggle de lado */}
      <div className="bg-surface flex gap-1 rounded-[10px] p-[5px]">
        {(['L', 'R'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`font-display flex-1 rounded-md py-1.5 text-sm font-bold tracking-wide uppercase ${
              side === s ? 'bg-lime text-canvas' : 'text-text-mid'
            }`}
          >
            {s === 'L' ? '◧ Lado esquerdo' : 'Lado direito ◨'}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-display text-text-mid text-xs font-bold tracking-wide uppercase">
          16-avos
        </h3>
        <span className="text-text-low font-mono text-[9px]">→ converge pra final</span>
      </div>

      {/* Pares de 16-avos; conector ⊐ no ::after converge à direita */}
      <div className="space-y-5">
        {pairs.map((pair, i) => (
          <div
            key={i}
            className="relative space-y-2 pr-7 after:absolute after:top-1/4 after:right-0 after:bottom-1/4 after:w-6 after:rounded-r-xl after:border-y-2 after:border-r-2 after:border-[#28303F] after:content-['']"
          >
            {pair.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
