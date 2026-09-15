import { useState } from 'react';

import { staticData, teamsById } from '../data/static';
import { useFlashOnChange } from '../hooks/useFlashOnChange';
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
  // Seed do mata-mata: resultado real já jogado — mostra travado, como nos grupos.
  const seed = staticData.seedKnockout[game.id];
  const seedPlayed = seed != null && seed.homeGoals !== null && seed.awayGoals !== null;
  const readOnly = locked || seedPlayed;
  const bothKnown = Boolean(game.home.team && game.away.team);
  const cur = koScores[game.id];
  const hg = locked ? off!.homeGoals : seedPlayed ? seed.homeGoals : (cur?.homeGoals ?? null);
  const ag = locked ? off!.awayGoals : seedPlayed ? seed.awayGoals : (cur?.awayGoals ?? null);
  const pens = locked
    ? off!.homePens != null && off!.awayPens != null
      ? { home: off!.homePens, away: off!.awayPens }
      : null
    : seedPlayed
      ? (seed.penalties ?? null)
      : (cur?.penalties ?? null);
  const tied = hg !== null && ag !== null && hg === ag;

  // Pisca a borda quando os times resolvidos ou o vencedor deste jogo mudam.
  const flashRef = useFlashOnChange<HTMLDivElement>(
    `${game.home.team ?? ''}|${game.away.team ?? ''}|${game.winner ?? ''}`,
  );

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
          disabled={readOnly || !bothKnown}
          onChange={onGoals}
          label={side.label}
        />
      </div>
    );
  };

  return (
    <div
      ref={flashRef}
      className={`w-full space-y-1 rounded-[10px] p-2 ${
        readOnly ? 'bg-surface-dim ring-hairline ring-1' : 'bg-surface ring-border ring-1'
      }`}
    >
      <div className="text-text-low flex items-center justify-between font-mono text-[9px]">
        <span>J{game.id}</span>
        {readOnly && <span title={locked ? 'oficial' : 'resultado final'}>🔒</span>}
      </div>
      <Row side={game.home} goals={hg} onGoals={(v) => setKoScore(game.id, { homeGoals: v })} />
      <Row side={game.away} goals={ag} onGoals={(v) => setKoScore(game.id, { awayGoals: v })} />
      {tied && (
        <div className="border-hairline text-text-mid flex items-center gap-1.5 border-t pt-1 text-[10px]">
          <span className="flex-1 font-mono">pên</span>
          <ScoreBox
            value={pens?.home ?? null}
            disabled={readOnly}
            label="pên casa"
            onChange={(v) =>
              setKoScore(game.id, { penalties: { home: v ?? 0, away: pens?.away ?? 0 } })
            }
          />
          <ScoreBox
            value={pens?.away ?? null}
            disabled={readOnly}
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

type RoundStep = 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL';

const STEPS: { id: RoundStep; label: string; hint: string }[] = [
  { id: 'R32', label: '16-avos', hint: '→ converge pra final' },
  { id: 'R16', label: 'Oitavas', hint: '→ quartas' },
  { id: 'QF', label: 'Quartas', hint: '→ semis' },
  { id: 'SF', label: 'Semis', hint: '→ final' },
  { id: 'FINAL', label: 'Final', hint: 'campeão + 3º lugar' },
];

/**
 * Mata-mata no mobile: seletor de fase no topo; 16-avos e oitavas mantêm o
 * toggle de lado (L/R) com pares que convergem à direita; daqui em diante a
 * lista é curta e aparece inteira; Final mostra a decisão + disputa do 3º.
 */
export function Bracket({ games }: { games: ResolvedKnockoutGame[] }) {
  const { col, ordered, final, third } = computeLayout(games);
  const [step, setStep] = useState<RoundStep>('R32');
  const [side, setSide] = useState<'L' | 'R'>('L');

  const splitSides = step === 'R32' || step === 'R16';
  const list = step === 'FINAL' ? [] : splitSides ? col(step, side) : ordered(step);
  const pairs: ResolvedKnockoutGame[][] = [];
  for (let i = 0; i < list.length; i += 2) pairs.push(list.slice(i, i + 2));

  return (
    <div className="space-y-3">
      {/* Seletor de fase */}
      <div
        className="bg-surface flex gap-1 overflow-x-auto rounded-[10px] p-[5px]"
        role="group"
        aria-label="Fase do mata-mata"
      >
        {STEPS.map((s) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            aria-pressed={step === s.id}
            className={`font-display flex-1 rounded-md px-2 py-1.5 text-sm font-bold tracking-wide whitespace-nowrap uppercase ${
              step === s.id ? 'bg-lime text-canvas' : 'text-text-mid'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Toggle de lado (só nas fases com 8+ jogos) */}
      {splitSides && (
        <div className="bg-surface flex gap-1 rounded-[10px] p-[5px]">
          {(['L', 'R'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              aria-pressed={side === s}
              aria-label={s === 'L' ? 'Lado esquerdo' : 'Lado direito'}
              className={`font-display flex-1 rounded-md py-1.5 text-sm font-bold tracking-wide uppercase ${
                side === s ? 'bg-lime text-canvas' : 'text-text-mid'
              }`}
            >
              {s === 'L' ? '◧ Lado esquerdo' : 'Lado direito ◨'}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-display text-text-mid text-xs font-bold tracking-wide uppercase">
          {STEPS.find((s) => s.id === step)!.label}
        </h3>
        <span className="text-text-low font-mono text-[9px]">
          {STEPS.find((s) => s.id === step)!.hint}
        </span>
      </div>

      {step === 'FINAL' ? (
        <div className="space-y-5">
          {final && <GameCard key={final.id} game={final} />}
          {third && (
            <div className="space-y-1.5">
              <h4 className="font-display text-text-mid text-xs font-bold tracking-wide uppercase">
                Disputa do 3º lugar
              </h4>
              <GameCard key={third.id} game={third} />
            </div>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}
