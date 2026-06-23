import { useSimulation } from '../hooks/useSimulation';
import { computeLayout } from '../lib/bracketLayout';

import { Flag } from './Flag';

import type { ResolvedKnockoutGame, ResolvedSide } from '../engine/types';

function sideInfo(side: ResolvedSide): { seed: string; color: string; third: boolean } {
  const ref = side.ref;
  if (ref.from === 'winner') return { seed: `1${ref.group}`, color: '#36C275', third: false };
  if (ref.from === 'runnerUp') return { seed: `2${ref.group}`, color: '#36C275', third: false };
  if (ref.from === 'third')
    return { seed: side.team ? side.label : '3?', color: '#FFB400', third: true };
  return { seed: side.label, color: '#687087', third: false };
}

function SideRow({ side }: { side: ResolvedSide }) {
  const info = sideInfo(side);
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-4 shrink-0 text-center font-mono text-[8px]" style={{ color: info.color }}>
        {info.third && !side.team ? '3?' : info.seed}
      </span>
      {side.team ? (
        <Flag code={side.team} className="shrink-0 text-xs" />
      ) : (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
          style={{ background: '#1B2230', border: '1px dashed #FFB40088' }}
        />
      )}
      <span
        className={`truncate text-[11px] font-semibold ${side.team ? 'text-text-hi' : 'italic'}`}
        style={!side.team ? { color: '#FFB400' } : undefined}
      >
        {side.team ?? '3?'}
      </span>
    </div>
  );
}

function R32Card({ game, allComplete }: { game: ResolvedKnockoutGame; allComplete: boolean }) {
  const hasThird = game.home.ref.from === 'third' || game.away.ref.from === 'third';
  const provisional = hasThird && !allComplete;
  return (
    <div
      className="rounded-lg px-2 py-1.5"
      style={{
        background: '#141A24',
        border: `1px solid ${provisional ? '#FFB40055' : '#36c27540'}`,
      }}
    >
      <SideRow side={game.home} />
      <div className="mt-1">
        <SideRow side={game.away} />
      </div>
    </div>
  );
}

// Segmentos da escadinha (coords 0–100). Centros dos 8 cards em (i+0.5)/8.
function segments(side: 'L' | 'R') {
  const y = (i: number) => ((i + 0.5) / 8) * 100;
  const r16 = [0, 1, 2, 3].map((k) => (y(2 * k) + y(2 * k + 1)) / 2);
  const qf = [0, 1].map((j) => (r16[2 * j]! + r16[2 * j + 1]!) / 2);
  const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const H = (x1: number, yy: number, x2: number) => out.push({ x1, y1: yy, x2, y2: yy });
  const V = (x: number, ya: number, yb: number) => out.push({ x1: x, y1: ya, x2: x, y2: yb });

  for (let k = 0; k < 4; k++) {
    H(0, y(2 * k), 25);
    H(0, y(2 * k + 1), 25);
    V(25, y(2 * k), y(2 * k + 1));
    H(25, r16[k]!, 50);
  }
  for (let j = 0; j < 2; j++) {
    V(50, r16[2 * j]!, r16[2 * j + 1]!);
    H(50, qf[j]!, 75);
  }
  V(75, qf[0]!, qf[1]!);
  H(75, 50, 100);

  return side === 'L' ? out : out.map((s) => ({ ...s, x1: 100 - s.x1, x2: 100 - s.x2 }));
}

function Connectors({ side }: { side: 'L' | 'R' }) {
  return (
    <div className="relative min-w-[80px] flex-1">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {segments(side).map((s, i) => (
          <line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke="#28303F"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <span
        className="text-text-low bg-bg absolute left-1/2 -translate-x-1/2 px-1 font-mono text-[8px]"
        style={{ top: 'calc(50% - 7px)', letterSpacing: '.12em' }}
      >
        {side === 'L' ? 'OITAVAS · QF' : 'QF · OITAVAS'}
      </span>
    </div>
  );
}

function Side({ games, allComplete }: { games: ResolvedKnockoutGame[]; allComplete: boolean }) {
  return (
    <div className="flex h-full w-[150px] shrink-0 flex-col justify-around">
      {games.map((g) => (
        <R32Card key={g.id} game={g} allComplete={allComplete} />
      ))}
    </div>
  );
}

export function BracketDesktop() {
  const result = useSimulation();
  const { col } = computeLayout(result.bracket);
  const allComplete = result.standings.length === 12 && result.standings.every((s) => s.complete);

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-between px-1">
        <span
          className="text-text-low w-[150px] text-center font-mono text-[9px]"
          style={{ letterSpacing: '.1em' }}
        >
          16-AVOS
        </span>
        <span
          className="text-text-low w-[150px] text-center font-mono text-[9px]"
          style={{ letterSpacing: '.1em' }}
        >
          16-AVOS
        </span>
      </div>
      <div className="flex min-h-0 flex-1 items-stretch">
        <Side games={col('R32', 'L')} allComplete={allComplete} />
        <Connectors side="L" />
        {/* Final */}
        <div className="flex w-[160px] shrink-0 flex-col items-center justify-center gap-2.5">
          <span className="text-3xl">🏆</span>
          <span
            className="font-display text-lime text-lg font-extrabold uppercase"
            style={{ letterSpacing: '.08em' }}
          >
            Final
          </span>
          <div
            className="w-[112px] rounded-[10px] px-2 py-3.5 text-center"
            style={{
              background: 'linear-gradient(180deg,#1B2230,#141A24)',
              border: '1px solid #C6F24E44',
              boxShadow: '0 0 24px rgba(198,242,78,.12)',
            }}
          >
            <div className="text-text-low font-mono text-[9px]">campeão</div>
            <div className="font-display text-text-faint text-2xl font-extrabold">?</div>
          </div>
        </div>
        <Connectors side="R" />
        <Side games={col('R32', 'R')} allComplete={allComplete} />
      </div>
    </div>
  );
}
