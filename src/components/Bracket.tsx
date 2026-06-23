import { useState } from "react";
import { useStore } from "../state/store";
import { teamsById } from "../data/static";
import { Flag } from "./Flag";
import { ScoreBox } from "./ScoreBox";
import { computeLayout } from "../lib/bracketLayout";
import type { ResolvedKnockoutGame, ResolvedSide } from "../engine/types";

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
      <div className={`flex items-center gap-1.5 ${isWinner ? "text-lime font-bold" : "text-text-hi"}`}>
        {side.team ? <Flag code={side.team} className="text-sm shrink-0" /> : <span className="w-3.5 shrink-0" />}
        <span className="flex-1 truncate text-[13px]" title={side.label}>
          {side.team ? nameOf(side.team) : <span className="text-text-faint font-mono text-[11px]">{side.label}</span>}
        </span>
        <ScoreBox value={goals} disabled={locked || !bothKnown} onChange={onGoals} label={side.label} />
      </div>
    );
  };

  return (
    <div
      className={`rounded-[10px] p-2 space-y-1 w-full ${
        locked ? "bg-surface-dim ring-1 ring-hairline" : "bg-surface ring-1 ring-border"
      }`}
    >
      <div className="flex justify-between items-center font-mono text-[9px] text-text-low">
        <span>J{game.id}</span>
        {locked && <span title="oficial">🔒</span>}
      </div>
      <Row side={game.home} goals={hg} onGoals={(v) => setKoScore(game.id, { homeGoals: v })} />
      <Row side={game.away} goals={ag} onGoals={(v) => setKoScore(game.id, { awayGoals: v })} />
      {tied && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-hairline text-[10px] text-text-mid">
          <span className="flex-1 font-mono">pên</span>
          <ScoreBox
            value={pens?.home ?? null}
            disabled={locked}
            label="pên casa"
            onChange={(v) => setKoScore(game.id, { penalties: { home: v ?? 0, away: pens?.away ?? 0 } })}
          />
          <ScoreBox
            value={pens?.away ?? null}
            disabled={locked}
            label="pên fora"
            onChange={(v) => setKoScore(game.id, { penalties: { home: pens?.home ?? 0, away: v ?? 0 } })}
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
  const [side, setSide] = useState<"L" | "R">("L");

  const r32 = col("R32", side);
  const pairs: ResolvedKnockoutGame[][] = [];
  for (let i = 0; i < r32.length; i += 2) pairs.push(r32.slice(i, i + 2));

  return (
    <div className="space-y-3">
      {/* Toggle de lado */}
      <div className="flex rounded-[10px] bg-surface p-[5px] gap-1">
        {(["L", "R"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 py-1.5 rounded-md font-display font-bold uppercase text-sm tracking-wide ${
              side === s ? "bg-lime text-canvas" : "text-text-mid"
            }`}
          >
            {s === "L" ? "◧ Lado esquerdo" : "Lado direito ◨"}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold uppercase text-xs tracking-wide text-text-mid">16-avos</h3>
        <span className="font-mono text-[9px] text-text-low">→ converge pra final</span>
      </div>

      {/* Pares de 16-avos; conector ⊐ no ::after converge à direita */}
      <div className="space-y-5">
        {pairs.map((pair, i) => (
          <div
            key={i}
            className="relative pr-7 space-y-2 after:content-[''] after:absolute after:right-0 after:top-1/4
                       after:bottom-1/4 after:w-6 after:border-r-2 after:border-y-2 after:border-[#28303F]
                       after:rounded-r-xl"
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
