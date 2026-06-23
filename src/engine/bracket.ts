import type {
  GroupId,
  GroupStanding,
  KnockoutGameDef,
  KnockoutScore,
  ResolvedKnockoutGame,
  ResolvedSide,
  Side,
  TeamId,
  ThirdAssignment,
} from './types';

/** Vencedor/perdedor derivados do placar (90+30; pênaltis no empate). */
export function decideOutcome(
  home: TeamId | undefined,
  away: TeamId | undefined,
  score: KnockoutScore | undefined,
): { winner?: TeamId; loser?: TeamId } {
  if (!home || !away || !score) return {};
  const { homeGoals, awayGoals, penalties } = score;
  if (homeGoals === null || awayGoals === null) return {};
  if (homeGoals > awayGoals) return { winner: home, loser: away };
  if (homeGoals < awayGoals) return { winner: away, loser: home };
  // empate em 90+30 → pênaltis
  if (penalties && penalties.home !== penalties.away) {
    return penalties.home > penalties.away
      ? { winner: home, loser: away }
      : { winner: away, loser: home };
  }
  return {}; // empate sem pênaltis definidos
}

/**
 * Monta o mata-mata completo (R32 → final) resolvendo cada slot para uma
 * seleção quando possível. `thirdAssignment` vem do Anexo C.
 */
export function resolveBracket(
  structure: KnockoutGameDef[],
  standings: GroupStanding[],
  thirdAssignment: ThirdAssignment | null,
  knockoutResults: Record<string, KnockoutScore> | undefined,
): ResolvedKnockoutGame[] {
  const standingByGroup = new Map<GroupId, GroupStanding>();
  for (const s of standings) standingByGroup.set(s.group, s);

  const defById = new Map<string, KnockoutGameDef>();
  for (const def of structure) defById.set(def.id, def);

  const memo = new Map<string, ResolvedKnockoutGame>();
  const inProgress = new Set<string>();

  function teamAt(group: GroupId, position: 0 | 1 | 2): TeamId | undefined {
    return standingByGroup.get(group)?.table[position]?.team;
  }

  function resolveSide(side: Side): ResolvedSide {
    switch (side.from) {
      case 'winner':
        return { ref: side, team: teamAt(side.group, 0), label: `1${side.group}` };
      case 'runnerUp':
        return { ref: side, team: teamAt(side.group, 1), label: `2${side.group}` };
      case 'third': {
        const thirdGroup = thirdAssignment?.[side.slot];
        return {
          ref: side,
          team: thirdGroup ? teamAt(thirdGroup, 2) : undefined,
          label: thirdGroup ? `3${thirdGroup}` : `3·(${side.slot})`,
        };
      }
      case 'winnerOf': {
        const g = resolveGame(side.match);
        return { ref: side, team: g?.winner, label: `Venc. ${side.match}` };
      }
      case 'loserOf': {
        const g = resolveGame(side.match);
        return { ref: side, team: g?.loser, label: `Perd. ${side.match}` };
      }
    }
  }

  function resolveGame(id: string): ResolvedKnockoutGame | undefined {
    const cached = memo.get(id);
    if (cached) return cached;
    const def = defById.get(id);
    if (!def) return undefined;
    if (inProgress.has(id)) return undefined; // ciclo (dado inválido) — corta
    inProgress.add(id);

    const home = resolveSide(def.home);
    const away = resolveSide(def.away);
    const score = knockoutResults?.[id];
    const { winner, loser } = decideOutcome(home.team, away.team, score);

    const resolved: ResolvedKnockoutGame = {
      id: def.id,
      round: def.round,
      home,
      away,
      ...(score ? { score } : {}),
      ...(winner ? { winner } : {}),
      ...(loser ? { loser } : {}),
    };
    inProgress.delete(id);
    memo.set(id, resolved);
    return resolved;
  }

  return structure.map((def) => resolveGame(def.id)!);
}
