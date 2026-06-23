import type { SimulationInput, TeamId, Team, TournamentResult } from "./types";
import { computeGroupStandings } from "./standings";
import { rankThirds, THIRD_QUALIFIERS } from "./thirds";
import { lookupThirdAssignment } from "./annexC";
import { resolveBracket } from "./bracket";

export * from "./types";
export { computeGroupStandings } from "./standings";
export { orderGroup } from "./tiebreakers";
export { rankThirds, THIRD_QUALIFIERS } from "./thirds";
export { buildAnnexKey, lookupThirdAssignment, validateAnnexCTable, THIRD_FACING_WINNERS } from "./annexC";
export { resolveBracket, decideOutcome } from "./bracket";
export { computeRecords, isPlayed } from "./records";
export { fairPlayForMatch } from "./fairplay";

/**
 * Função de topo: recebe o estado atual (placares incluídos) e devolve
 * classificações, ranking dos terceiros, chave do Anexo C e o mata-mata montado.
 * É 100% pura e determinística — a mesma entrada sempre dá a mesma saída.
 */
export function simulate(input: SimulationInput): TournamentResult {
  const teamsById = new Map<TeamId, Team>(input.teams.map((t) => [t.id, t]));

  const standings = computeGroupStandings(input.teams, input.matches);
  const thirds = rankThirds(standings, teamsById);

  const warnings: string[] = [];
  for (const s of standings) {
    if (!s.complete) warnings.push(`Grupo ${s.group} incompleto — classificação provisória.`);
  }

  const { key, assignment } = lookupThirdAssignment(input.annexC, thirds.qualifiedGroups);
  if (thirds.qualifiedGroups.length !== THIRD_QUALIFIERS) {
    warnings.push(
      `Esperados ${THIRD_QUALIFIERS} grupos de terceiros classificados, ` +
        `obtidos ${thirds.qualifiedGroups.length}.`,
    );
  } else if (!assignment) {
    warnings.push(`Combinação de terceiros "${key}" não encontrada no Anexo C.`);
  }

  const bracket = resolveBracket(input.structure, standings, assignment, input.knockoutResults);

  return {
    standings,
    thirds,
    annexKey: thirds.qualifiedGroups.length === THIRD_QUALIFIERS ? key : null,
    thirdAssignment: assignment,
    bracket,
    warnings,
  };
}
