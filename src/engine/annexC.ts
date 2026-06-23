import { GROUP_IDS } from './types';

import type { AnnexCTable, GroupId, ThirdAssignment } from './types';

// Os 8 grupos cujos VENCEDORES enfrentam um terceiro nos 16-avos.
// (Os vencedores de C, F, H, J enfrentam vices.)
export const THIRD_FACING_WINNERS: readonly GroupId[] = ['A', 'B', 'D', 'E', 'G', 'I', 'K', 'L'];

/** Chave canônica do Anexo C: as 8 letras de grupo ordenadas, ex.: "ABDEGHIJ". */
export function buildAnnexKey(groups: GroupId[]): string {
  return [...groups].sort().join('');
}

/**
 * Consulta o Anexo C com o conjunto de 8 grupos cujos terceiros avançaram.
 * Retorna o mapa slot(grupo-vencedor) → grupo do terceiro, ou null se a chave
 * não existir / não houver exatamente 8 grupos.
 */
export function lookupThirdAssignment(
  table: AnnexCTable,
  groups: GroupId[],
): { key: string; assignment: ThirdAssignment | null } {
  const key = buildAnnexKey(groups);
  if (groups.length !== 8) return { key, assignment: null };
  return { key, assignment: table[key] ?? null };
}

const C_12_8 = 495;

/** Todas as C(12,8) chaves canônicas (8 letras ordenadas) — o conjunto esperado. */
function allCanonicalKeys(): Set<string> {
  const out = new Set<string>();
  const pick = (start: number, acc: GroupId[]) => {
    if (acc.length === 8) {
      out.add(buildAnnexKey(acc));
      return;
    }
    for (let i = start; i < GROUP_IDS.length; i++) pick(i + 1, [...acc, GROUP_IDS[i]!]);
  };
  pick(0, []);
  return out;
}

/** Sanidade do anexo-c.json. Retorna lista de problemas (vazia = OK). */
export function validateAnnexCTable(table: AnnexCTable): string[] {
  const problems: string[] = [];
  const keys = Object.keys(table);
  if (keys.length !== C_12_8) {
    problems.push(`Esperadas ${C_12_8} combinações, encontradas ${keys.length}.`);
  }
  // Completude: o conjunto de chaves tem de ser EXATAMENTE as C(12,8) combinações.
  const expected = allCanonicalKeys();
  const present = new Set(keys.map((k) => buildAnnexKey(k.split('') as GroupId[])));
  for (const k of expected) if (!present.has(k)) problems.push(`Combinação ausente: "${k}".`);
  const validGroup = new Set<string>(GROUP_IDS);
  const facing = new Set<string>(THIRD_FACING_WINNERS);

  for (const key of keys) {
    const groups = key.split('');
    if (key.length !== 8) {
      problems.push(`Chave "${key}" não tem 8 grupos.`);
      continue;
    }
    if (buildAnnexKey(groups as GroupId[]) !== key) {
      problems.push(`Chave "${key}" não está ordenada/canônica.`);
    }
    if (groups.some((g) => !validGroup.has(g))) {
      problems.push(`Chave "${key}" contém grupo inválido.`);
    }
    const assignment = table[key]!;
    const slots = Object.keys(assignment);
    if (slots.length !== 8) {
      problems.push(`Combinação "${key}" deveria mapear 8 slots, mapeia ${slots.length}.`);
    }
    const keyGroups = new Set(groups);
    const assignedThirds: string[] = [];
    for (const [slot, third] of Object.entries(assignment)) {
      if (!facing.has(slot)) {
        problems.push(`Combinação "${key}": slot "${slot}" não é grupo-vencedor de terceiro.`);
      }
      if (third === undefined || !keyGroups.has(third)) {
        problems.push(`Combinação "${key}": terceiro "${third}" do slot ${slot} fora da chave.`);
      } else {
        assignedThirds.push(third);
      }
    }
    // Bijeção: os 8 terceiros alocados são uma permutação dos 8 grupos da chave
    // (nenhum terceiro repetido, nenhum grupo da chave sem alocação).
    if (new Set(assignedThirds).size !== assignedThirds.length) {
      problems.push(`Combinação "${key}": há terceiro alocado em mais de um slot.`);
    }
    for (const g of groups) {
      if (!assignedThirds.includes(g)) {
        problems.push(`Combinação "${key}": o terceiro do grupo ${g} não foi alocado.`);
      }
    }
  }
  return problems;
}
