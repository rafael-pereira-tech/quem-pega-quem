// ============================================================================
// Validação de INTEGRIDADE dos dados estáticos (mata-mata + Anexo C).
// Puro: sem React/DOM/IO. Cada função devolve uma lista de problemas
// (vazia = OK), pra ser usada tanto em testes quanto no script `npm run validate`.
//
// Há DOIS regimes de correção distintos:
//   • A ORDEM (ranking de grupo / terceiros) é ALGORÍTMICA  -> tiebreakers.ts + testes.
//   • Os CONFRONTOS dos terceiros vêm da TABELA FIXA da FIFA (Anexo C), escolhida
//     por logística/sedes/datas. Não dá pra "calcular": só dá pra checar que a
//     tabela é internamente consistente e respeita as restrições publicadas
//     (`allowedGroups` de cada slot no round-of-32.json).
// ============================================================================

import type { AnnexCTable, GroupId, KnockoutGameDef } from "./types";
import { GROUP_IDS } from "./types";
import { THIRD_FACING_WINNERS } from "./annexC";

const ROUND_COUNTS: Record<string, number> = {
  R32: 16,
  R16: 8,
  QF: 4,
  SF: 2,
  THIRD: 1,
  FINAL: 1,
};

function checkCoverage(
  problems: string[],
  label: string,
  got: GroupId[],
  expected: readonly GroupId[],
) {
  if (got.length !== new Set(got).size) problems.push(`${label}: há grupos repetidos.`);
  const set = new Set(got);
  for (const e of expected) if (!set.has(e)) problems.push(`${label}: faltou o grupo ${e}.`);
  for (const x of set) if (!expected.includes(x)) problems.push(`${label}: grupo inesperado ${x}.`);
}

/**
 * Valida a ÁRVORE do mata-mata (R32 → final): contagem por fase, referências
 * válidas, e que ela é uma eliminatória bem-formada — cada vencedor alimenta
 * exatamente 1 jogo seguinte, os 2 perdedores de SF vão pra disputa de 3º, e
 * as 32 folhas de R32 cobrem 12 vencedores + 12 vices + 8 slots de terceiro.
 */
export function validateBracket(structure: KnockoutGameDef[]): string[] {
  const problems: string[] = [];

  const byRound = new Map<string, number>();
  for (const g of structure) byRound.set(g.round, (byRound.get(g.round) ?? 0) + 1);
  for (const [r, n] of Object.entries(ROUND_COUNTS)) {
    const got = byRound.get(r) ?? 0;
    if (got !== n) problems.push(`Fase ${r}: esperados ${n} jogos, encontrados ${got}.`);
  }

  const ids = new Set(structure.map((g) => g.id));
  if (ids.size !== structure.length) problems.push("Há ids de jogos duplicados.");
  const byId = new Map(structure.map((g) => [g.id, g]));

  // Consumo de vencedores/perdedores pelas fases seguintes.
  const winnerUsed = new Map<string, number>();
  const loserUsed = new Map<string, number>();
  for (const g of structure) {
    for (const s of [g.home, g.away]) {
      if (s.from === "winnerOf") {
        if (!ids.has(s.match)) problems.push(`J${g.id}: winnerOf aponta p/ J${s.match} inexistente.`);
        winnerUsed.set(s.match, (winnerUsed.get(s.match) ?? 0) + 1);
      } else if (s.from === "loserOf") {
        if (!ids.has(s.match)) problems.push(`J${g.id}: loserOf aponta p/ J${s.match} inexistente.`);
        loserUsed.set(s.match, (loserUsed.get(s.match) ?? 0) + 1);
      }
    }
  }

  // Cada jogo (exceto final e 3º lugar) tem o vencedor consumido EXATAMENTE 1×.
  for (const g of structure) {
    const used = winnerUsed.get(g.id) ?? 0;
    if (g.round === "FINAL" || g.round === "THIRD") {
      if (used !== 0) problems.push(`Vencedor de J${g.id} (${g.round}) não deveria alimentar outro jogo (alimenta ${used}).`);
    } else if (used !== 1) {
      problems.push(`Vencedor de J${g.id} (${g.round}) deveria alimentar exatamente 1 jogo (alimenta ${used}).`);
    }
  }

  // Perdedores: só os 2 da semifinal, e só pra disputa de 3º.
  for (const [mid, n] of loserUsed) {
    const src = byId.get(mid);
    if (!src || src.round !== "SF") problems.push(`loserOf usa J${mid}, que não é semifinal.`);
    if (n > 1) problems.push(`Perdedor de J${mid} consumido ${n}×.`);
  }
  if (loserUsed.size !== 2) problems.push(`Disputa de 3º deveria usar 2 perdedores de SF, usa ${loserUsed.size}.`);

  // Cobertura das folhas de R32.
  const winners: GroupId[] = [];
  const runners: GroupId[] = [];
  const thirds: GroupId[] = [];
  for (const g of structure) {
    if (g.round !== "R32") continue;
    for (const s of [g.home, g.away]) {
      if (s.from === "winner") winners.push(s.group);
      else if (s.from === "runnerUp") runners.push(s.group);
      else if (s.from === "third") thirds.push(s.slot);
      else problems.push(`J${g.id}: folha de R32 com origem inválida "${s.from}".`);
    }
  }
  checkCoverage(problems, "Vencedores (1º)", winners, GROUP_IDS);
  checkCoverage(problems, "Vices (2º)", runners, GROUP_IDS);
  checkCoverage(problems, "Slots de terceiro", thirds, THIRD_FACING_WINNERS);

  return problems;
}

export interface AnnexAllowedReport {
  /** Violações duras: alocação fora do allowedGroups, ou combo sem matching possível. */
  problems: string[];
  /** Combos cuja restrição admite >1 alocação válida (a FIFA escolheu 1; só diff externo confirma). */
  ambiguous: string[];
  /** Combos sem NENHUMA alocação possível respeitando allowedGroups (dado inconsistente). */
  impossible: string[];
}

/** Conta alocações (matchings perfeitos) slot→terceiro que respeitam `allowed`, com teto. */
function countMatchings(
  allowed: Partial<Record<GroupId, GroupId[]>>,
  available: Set<GroupId>,
  cap = 2,
): number {
  let count = 0;
  const used = new Set<GroupId>();
  const rec = (i: number) => {
    if (count >= cap) return;
    if (i === THIRD_FACING_WINNERS.length) {
      count++;
      return;
    }
    const slot = THIRD_FACING_WINNERS[i]!;
    for (const g of allowed[slot] ?? []) {
      if (available.has(g) && !used.has(g)) {
        used.add(g);
        rec(i + 1);
        used.delete(g);
        if (count >= cap) return;
      }
    }
  };
  rec(0);
  return count;
}

/**
 * Cruza o Anexo C com o `allowedGroups` de cada slot (restrição real da FIFA):
 *   • toda alocação respeita o allowedGroups do slot (e, por tabela, nunca repete o
 *     próprio grupo do vencedor);
 *   • todo combo admite ≥1 alocação (senão o dado é impossível);
 *   • quantos combos têm alocação ÚNICA vs. ambígua — se 100% únicos, a tabela está
 *     provada por lógica; os ambíguos precisam de conferência com a fonte oficial.
 */
export function validateAnnexCAllowed(
  table: AnnexCTable,
  allowed: Partial<Record<GroupId, GroupId[]>>,
): AnnexAllowedReport {
  const problems: string[] = [];
  const ambiguous: string[] = [];
  const impossible: string[] = [];

  for (const slot of THIRD_FACING_WINNERS) {
    if (!allowed[slot] || allowed[slot]!.length === 0)
      problems.push(`allowedGroups ausente/vazio para o slot ${slot}.`);
    if ((allowed[slot] ?? []).includes(slot))
      problems.push(`allowedGroups do slot ${slot} inclui o próprio grupo (rematch).`);
  }

  for (const [key, assignment] of Object.entries(table)) {
    const available = new Set(key.split("") as GroupId[]);
    for (const slot of THIRD_FACING_WINNERS) {
      const third = assignment[slot];
      if (third && !(allowed[slot] ?? []).includes(third))
        problems.push(`"${key}": 3º do grupo ${third} no slot ${slot} viola allowedGroups.`);
    }
    const n = countMatchings(allowed, available);
    if (n === 0) impossible.push(key);
    else if (n > 1) ambiguous.push(key);
  }

  return { problems, ambiguous, impossible };
}
