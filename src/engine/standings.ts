import { isPlayed } from './records';
import { orderGroup } from './tiebreakers';
import { GROUP_IDS, type GroupId, type GroupMatch, type GroupStanding, type Team } from './types';

function expectedMatchCount(n: number): number {
  return (n * (n - 1)) / 2; // turno único; 4 seleções → 6 jogos
}

/** Classificação de todos os grupos presentes nos dados, na ordem A..L. */
export function computeGroupStandings(teams: Team[], matches: GroupMatch[]): GroupStanding[] {
  const byGroupTeams = new Map<GroupId, Team[]>();
  for (const t of teams) {
    const arr = byGroupTeams.get(t.group) ?? [];
    arr.push(t);
    byGroupTeams.set(t.group, arr);
  }

  const byGroupMatches = new Map<GroupId, GroupMatch[]>();
  for (const m of matches) {
    const arr = byGroupMatches.get(m.group) ?? [];
    arr.push(m);
    byGroupMatches.set(m.group, arr);
  }

  const standings: GroupStanding[] = [];
  for (const g of GROUP_IDS) {
    const gTeams = byGroupTeams.get(g);
    if (!gTeams || gTeams.length === 0) continue;
    const gMatches = byGroupMatches.get(g) ?? [];
    const table = orderGroup(gTeams, gMatches);
    const complete =
      gMatches.length === expectedMatchCount(gTeams.length) && gMatches.every(isPlayed);
    standings.push({ group: g, table, complete });
  }
  return standings;
}
