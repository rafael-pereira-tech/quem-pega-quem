import { MATCH_POINTS, type GroupMatch, type Team, type TeamId, type TeamRecord } from "./types";
import { fairPlayForMatch } from "./fairplay";

export function isPlayed(m: GroupMatch): boolean {
  return m.homeGoals !== null && m.awayGoals !== null;
}

function emptyRecord(team: Team): TeamRecord {
  return {
    team: team.id,
    group: team.group,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    fairPlay: 0,
    yellow: 0,
    red: 0,
  };
}

/**
 * Constrói os registros (pontos, saldo, fair play...) das seleções dadas,
 * considerando apenas os jogos DISPUTADOS do conjunto `matches` em que ambos
 * os lados pertencem ao conjunto de seleções.
 *
 * Reutilizado tanto para a tabela geral do grupo (todos os jogos) quanto para
 * a mini-tabela do confronto direto (só os jogos entre as empatadas).
 */
export function computeRecords(teams: Team[], matches: GroupMatch[]): Map<TeamId, TeamRecord> {
  const recs = new Map<TeamId, TeamRecord>();
  const ids = new Set<TeamId>();
  for (const t of teams) {
    recs.set(t.id, emptyRecord(t));
    ids.add(t.id);
  }

  for (const m of matches) {
    if (!isPlayed(m)) continue;
    if (!ids.has(m.home) || !ids.has(m.away)) continue;

    const home = recs.get(m.home)!;
    const away = recs.get(m.away)!;
    const hg = m.homeGoals as number;
    const ag = m.awayGoals as number;

    home.played++;
    away.played++;
    home.goalsFor += hg;
    home.goalsAgainst += ag;
    away.goalsFor += ag;
    away.goalsAgainst += hg;

    if (hg > ag) {
      home.won++;
      away.lost++;
      home.points += MATCH_POINTS.win;
    } else if (hg < ag) {
      away.won++;
      home.lost++;
      away.points += MATCH_POINTS.win;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += MATCH_POINTS.draw;
      away.points += MATCH_POINTS.draw;
    }

    home.fairPlay += fairPlayForMatch(m.cards?.[m.home]);
    away.fairPlay += fairPlayForMatch(m.cards?.[m.away]);

    const hc = m.cards?.[m.home];
    const ac = m.cards?.[m.away];
    home.yellow += hc?.yellow ?? 0;
    home.red += (hc?.secondYellow ?? 0) + (hc?.directRed ?? 0) + (hc?.yellowAndDirectRed ?? 0);
    away.yellow += ac?.yellow ?? 0;
    away.red += (ac?.secondYellow ?? 0) + (ac?.directRed ?? 0) + (ac?.yellowAndDirectRed ?? 0);
  }

  for (const r of recs.values()) {
    r.goalDiff = r.goalsFor - r.goalsAgainst;
  }
  return recs;
}
