import { useMemo } from "react";
import { useStore } from "../state/store";
import { useSimulation } from "../hooks/useSimulation";
import { effectiveGroupMatches } from "../lib/buildInput";
import { GroupBar } from "./GroupBar";
import type { GroupId, GroupMatch } from "../engine/types";

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

  return (
    <div className="space-y-3">
      {/* Progresso */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-surface overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(complete / 12) * 100}%`,
              background: "linear-gradient(90deg,#FFB400,#FF2D55)",
            }}
          />
        </div>
        <span className="font-mono text-[11px] text-text-low tabular-nums">{complete}/12</span>
      </div>

      <div className="space-y-2.5">
        {result.standings.map((s) => (
          <GroupBar
            key={s.group}
            standing={s}
            matches={byGroup.get(s.group) ?? []}
            onScore={setGroupScore}
            thirdQualified={qualified.has(s.group)}
            thirdRank={thirdRankByGroup.get(s.group) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
