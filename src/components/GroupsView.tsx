import { useEffect, useMemo } from 'react';

import { useSimulation } from '../hooks/useSimulation';
import { effectiveGroupMatches } from '../lib/buildInput';
import { prefersReducedMotion } from '../lib/motion';
import { firstActiveRound3Group } from '../lib/round3';
import { useStore } from '../state/store';

import { GroupBar } from './GroupBar';

import type { GroupId, GroupMatch } from '../engine/types';

// Rola só uma vez por carregamento da página (não a cada troca de aba).
let didAutoScroll = false;

export function GroupsView() {
  const result = useSimulation();
  const scenario = useStore((s) => s.scenario);
  const official = useStore((s) => s.official);
  const setGroupScore = useStore((s) => s.setGroupScore);

  const byGroup = useMemo(() => {
    const map = new Map<GroupId, GroupMatch[]>();
    for (const m of effectiveGroupMatches(scenario, official)) {
      const arr = map.get(m.group) ?? [];
      arr.push(m);
      map.set(m.group, arr);
    }
    return map;
  }, [scenario, official]);

  const complete = result.standings.filter((s) => s.complete).length;
  const qualified = new Set(result.thirds.qualifiedGroups);

  // grupo → posição do seu 3º colocado no ranking dos 12 melhores terceiros
  const thirdRankByGroup = useMemo(() => {
    const map = new Map<GroupId, number>();
    for (const r of result.thirds.rows) map.set(r.group, r.rank);
    return map;
  }, [result.thirds.rows]);

  // Após carregar, desliza até o 1º grupo com jogo da rodada 3 ainda em
  // aberto (ao vivo ou a jogar), pulando os já encerrados.
  const targetGroup = useMemo(
    () =>
      firstActiveRound3Group(
        result.standings.map((s) => s.group),
        byGroup,
      ),
    [result.standings, byGroup],
  );

  useEffect(() => {
    if (didAutoScroll || !targetGroup) return;
    didAutoScroll = true;
    const el = document.querySelector(`[data-group-anchor="${targetGroup}"]`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }, [targetGroup]);

  return (
    <div className="space-y-3">
      {/* Progresso — fixo no topo da área rolável para manter a sensação de
          avanço enquanto se rola pelos grupos. Fundo opaco + margens negativas
          para sangrar até as bordas do contêiner (tanto px-4 mobile quanto
          px-3.5 desktop) e impedir que os cards vazem por baixo. */}
      <div className="bg-canvas border-hairline sticky top-0 z-10 -mx-4 flex items-center gap-2 border-b px-4 py-2">
        <div className="bg-surface h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(complete / 12) * 100}%`,
              background: 'linear-gradient(90deg,#FFB400,#FF2D55)',
            }}
          />
        </div>
        <span className="text-text-low font-mono text-[11px] tabular-nums">{complete}/12</span>
      </div>

      <div className="space-y-2.5">
        {result.standings.map((s) => (
          <div key={s.group} data-group-anchor={s.group} className="scroll-mt-14">
            <GroupBar
              standing={s}
              matches={byGroup.get(s.group) ?? []}
              onScore={setGroupScore}
              thirdQualified={qualified.has(s.group)}
              thirdRank={thirdRankByGroup.get(s.group) ?? 0}
              official={official}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
