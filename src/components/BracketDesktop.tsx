import { useFlashOnChange } from '../hooks/useFlashOnChange';
import { useSimulation } from '../hooks/useSimulation';
import { computeLayout } from '../lib/bracketLayout';

import { Flag } from './Flag';

import type { KnockoutRound, ResolvedKnockoutGame, ResolvedSide } from '../engine/types';

function sideInfo(side: ResolvedSide): { seed: string; color: string; third: boolean } {
  const ref = side.ref;
  if (ref.from === 'winner') return { seed: `1${ref.group}`, color: '#36C275', third: false };
  if (ref.from === 'runnerUp') return { seed: `2${ref.group}`, color: '#36C275', third: false };
  if (ref.from === 'third')
    return { seed: side.team ? side.label : '3?', color: '#FFB400', third: true };
  return { seed: side.label, color: '#687087', third: false };
}

function SideRow({
  side,
  goals,
  isWinner,
  isLoser,
}: {
  side: ResolvedSide;
  goals: number | null;
  isWinner: boolean;
  isLoser: boolean;
}) {
  const info = sideInfo(side);
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-4 shrink-0 text-center font-mono text-[8px]" style={{ color: info.color }}>
        {info.third && !side.team ? '3?' : info.seed}
      </span>
      {side.team ? (
        <Flag code={side.team} className={`shrink-0 text-xs ${isLoser ? 'opacity-40' : ''}`} />
      ) : (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
          style={{ background: '#1B2230', border: '1px dashed #FFB40088' }}
        />
      )}
      <span
        className={`flex-1 truncate text-[11px] font-semibold ${isWinner ? 'text-text-hi' : isLoser ? 'text-text-low opacity-70' : side.team ? 'text-text-hi' : 'italic'}`}
        style={!side.team ? { color: '#FFB400' } : undefined}
      >
        {side.team ?? '3?'}
      </span>
      {goals !== null && (
        <span
          className={`shrink-0 font-mono text-[11px] tabular-nums ${
            isWinner ? 'text-lime font-bold' : 'text-text-mid'
          }`}
        >
          {goals}
        </span>
      )}
    </div>
  );
}

function KoCard({ game, allComplete }: { game: ResolvedKnockoutGame; allComplete: boolean }) {
  const hasThird = game.home.ref.from === 'third' || game.away.ref.from === 'third';
  const provisional = hasThird && !allComplete;
  const score = game.score;
  const pens = score?.penalties;
  // Pisca a borda quando os times resolvidos ou o vencedor deste jogo mudam.
  const flashRef = useFlashOnChange<HTMLDivElement>(
    `${game.home.team ?? ''}|${game.away.team ?? ''}|${game.winner ?? ''}`,
  );
  return (
    <div
      ref={flashRef}
      className="w-full rounded-lg px-2 py-1.5"
      style={{
        background: '#141A24',
        border: `1px solid ${provisional ? '#FFB40055' : '#36c27540'}`,
      }}
    >
      <SideRow
        side={game.home}
        goals={score?.homeGoals ?? null}
        isWinner={game.winner !== undefined && game.winner === game.home.team}
        isLoser={
          game.winner !== undefined &&
          game.home.team !== undefined &&
          game.winner !== game.home.team
        }
      />
      <div className="mt-1">
        <SideRow
          side={game.away}
          goals={score?.awayGoals ?? null}
          isWinner={game.winner !== undefined && game.winner === game.away.team}
          isLoser={
            game.winner !== undefined &&
            game.away.team !== undefined &&
            game.winner !== game.away.team
          }
        />
      </div>
      {pens && (
        <div className="text-text-low mt-0.5 text-right font-mono text-[8px] tabular-nums">
          pen {pens.home}–{pens.away}
        </div>
      )}
    </div>
  );
}

/** Uma coluna de jogos: cada slot flex-1 centraliza o card, então o centro do
 *  slot i fica exatamente em (i+0.5)/n — onde os conectores miram. O rótulo
 *  (h-4) existe em TODAS as colunas pra não quebrar o alinhamento. */
function Col({
  label,
  games,
  allComplete,
}: {
  label: string;
  games: ResolvedKnockoutGame[];
  allComplete: boolean;
}) {
  return (
    <div className="flex h-full w-[124px] shrink-0 flex-col">
      <div className="text-text-low h-4 shrink-0 text-center font-mono text-[8px] tracking-[.12em]">
        {label}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {games.map((g) => (
          <div key={g.id} className="flex min-h-0 flex-1 items-center py-0.5">
            <KoCard game={g} allComplete={allComplete} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Conector entre duas colunas (n jogos → n/2): stubs horizontais, espinha
 *  vertical e chegada no jogo seguinte. Espelhável pro lado direito. */
function Gap({ left, right, mirror }: { left: number; right: number; mirror?: boolean }) {
  const segs: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let j = 0; j < right; j++) {
    const yA = ((2 * j + 0.5) / left) * 100;
    const yB = ((2 * j + 1.5) / left) * 100;
    const yC = ((j + 0.5) / right) * 100;
    segs.push(
      { x1: 0, y1: yA, x2: 42, y2: yA },
      { x1: 0, y1: yB, x2: 42, y2: yB },
      { x1: 42, y1: Math.min(yA, yB), x2: 42, y2: Math.max(yA, yB) },
      { x1: 42, y1: yC, x2: 100, y2: yC },
    );
  }
  const lines = mirror ? segs.map((s) => ({ ...s, x1: 100 - s.x1, x2: 100 - s.x2 })) : segs;
  return (
    <div className="flex h-full shrink-0 flex-col">
      <div className="h-4 shrink-0" />
      <div className="relative min-h-0 min-w-[26px] flex-1">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {lines.map((s, i) => (
            <line
              key={i}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke="#28303F"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

const LABELS: Record<KnockoutRound, string> = {
  R32: '16-AVOS',
  R16: 'OITAVAS',
  QF: 'QUARTAS',
  SF: 'SEMI',
  THIRD: '3º LUGAR',
  FINAL: 'FINAL',
};

function Half({
  games,
  side,
  allComplete,
}: {
  games: ResolvedKnockoutGame[];
  side: 'L' | 'R';
  allComplete: boolean;
}) {
  const { col } = computeLayout(games);
  const rounds: KnockoutRound[] = ['R32', 'R16', 'QF', 'SF'];
  const cols = rounds.map((r) => col(r, side));
  const mirror = side === 'R';
  const ordered = mirror ? [...cols].reverse() : cols;
  const gaps: { left: number; right: number }[] = mirror
    ? [
        { left: 2, right: 1 },
        { left: 4, right: 2 },
        { left: 8, right: 4 },
      ]
    : [
        { left: 8, right: 4 },
        { left: 4, right: 2 },
        { left: 2, right: 1 },
      ];
  return (
    <div className="flex h-full min-h-0 flex-1">
      {ordered.flatMap((gamesCol, i) => {
        const round = (mirror ? [...rounds].reverse() : rounds)[i]!;
        const els = [
          <Col key={round} label={LABELS[round]} games={gamesCol} allComplete={allComplete} />,
        ];
        if (i < gaps.length) {
          const gap = gaps[i]!;
          els.push(<Gap key={`gap-${round}`} left={gap.left} right={gap.right} mirror={mirror} />);
        }
        return els;
      })}
    </div>
  );
}

export function BracketDesktop() {
  const result = useSimulation();
  const { final, third } = computeLayout(result.bracket);
  const allComplete = result.standings.length === 12 && result.standings.every((s) => s.complete);

  return (
    <div className="h-full min-h-0 overflow-auto">
      <div className="flex h-full min-h-[560px] min-w-[1180px]">
        <Half games={result.bracket} side="L" allComplete={allComplete} />
        {/* Final + disputa do 3º no centro */}
        <div className="flex h-full w-[150px] shrink-0 flex-col">
          <div className="h-4 shrink-0" />
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
            <span className="text-3xl">🏆</span>
            <span
              className="font-display text-lime text-lg font-extrabold uppercase"
              style={{ letterSpacing: '.08em' }}
            >
              Final
            </span>
            <div
              className="w-[132px] rounded-[10px] px-2 py-3 text-center"
              style={{
                background: 'linear-gradient(180deg,#1B2230,#141A24)',
                border: '1px solid #C6F24E44',
                boxShadow: '0 0 24px rgba(198,242,78,.12)',
              }}
            >
              <div className="text-text-low font-mono text-[9px]">campeão</div>
              <div className="font-display text-2xl font-extrabold">
                {final?.winner ? (
                  <span className="text-lime">{final.winner}</span>
                ) : (
                  <span className="text-text-faint">?</span>
                )}
              </div>
              {final?.score?.homeGoals != null && final?.score?.awayGoals != null && (
                <div className="text-text-mid font-mono text-[11px]">
                  {final.score.homeGoals}–{final.score.awayGoals}
                </div>
              )}
            </div>
            {third && (
              <div className="w-[132px]">
                <div className="text-text-low mb-1 text-center font-mono text-[8px] tracking-[.12em]">
                  3º LUGAR
                </div>
                <KoCard game={third} allComplete={allComplete} />
              </div>
            )}
          </div>
        </div>
        <Half games={result.bracket} side="R" allComplete={allComplete} />
      </div>
    </div>
  );
}
