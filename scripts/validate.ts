// ============================================================================
// `npm run validate` — relatório de integridade dos dados estáticos.
//
// Garante o que dá pra garantir POR LÓGICA:
//   1. Árvore do mata-mata bem-formada (fases, referências, cobertura das folhas).
//   2. Anexo C estruturalmente completo (495 combos, bijeção por combo).
//   3. Anexo C respeita o `allowedGroups` de cada slot (restrição real da FIFA)
//      e quantos combos têm alocação ÚNICA vs. ambígua.
//
// O que NÃO dá pra provar aqui (precisa de diff com a fonte oficial da FIFA):
//   - Que, nos combos com >1 alocação válida, a tabela escolheu a MESMA da FIFA.
//   - A ORDEM (desempates) — isso é coberto pelos testes em src/engine/__tests__.
// ============================================================================

import { readFileSync } from "node:fs";
import {
  anexoCFileSchema,
  bracketFileSchema,
  gruposFileSchema,
  loadAnexoC,
  loadGrupos,
  loadStructure,
  roundOf32FileSchema,
} from "../src/data/schema";
import { validateAnnexCTable } from "../src/engine/annexC";
import { validateAnnexCAllowed, validateBracket } from "../src/engine/integrity";
import type { GroupId } from "../src/engine/types";

const read = (name: string) =>
  JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));

const C = { red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", dim: "\x1b[2m", reset: "\x1b[0m", bold: "\x1b[1m" };
let failed = false;

function section(title: string, problems: string[], note?: string) {
  if (problems.length === 0) {
    console.log(`${C.green}✓${C.reset} ${C.bold}${title}${C.reset}${note ? ` ${C.dim}${note}${C.reset}` : ""}`);
  } else {
    failed = true;
    console.log(`${C.red}✗ ${C.bold}${title}${C.reset} ${C.red}(${problems.length} problema(s))${C.reset}`);
    for (const p of problems.slice(0, 25)) console.log(`    ${C.red}•${C.reset} ${p}`);
    if (problems.length > 25) console.log(`    ${C.dim}… +${problems.length - 25}${C.reset}`);
  }
}

console.log(`\n${C.bold}Quem Pega Quem — validação de integridade${C.reset}\n`);

// ---- carregar ----
const grupos = loadGrupos(gruposFileSchema.parse(read("grupos.json")));
const annexC = loadAnexoC(anexoCFileSchema.parse(read("anexo-c.json")));
const rawR32 = roundOf32FileSchema.parse(read("round-of-32.json"));
const structure = loadStructure(rawR32, bracketFileSchema.parse(read("bracket.json")));

// allowedGroups por slot (grupo do vencedor que enfrenta o terceiro), do round-of-32 cru.
const allowed: Partial<Record<GroupId, GroupId[]>> = {};
for (const game of rawR32 as Array<{ home: any; away: any }>) {
  for (const side of [game.home, game.away]) {
    if (side.rank === 3 && side.lookupWinner && side.allowedGroups) {
      allowed[side.lookupWinner as GroupId] = side.allowedGroups as GroupId[];
    }
  }
}

// ---- 1. mata-mata ----
section("Árvore do mata-mata (R32 → final)", validateBracket(structure), "32 jogos, folhas e fluxo conferidos");

// ---- 2. Anexo C estrutural ----
section("Anexo C — estrutura (495 combos, bijeção)", validateAnnexCTable(annexC), "C(12,8)=495");

// ---- 3. Anexo C × allowedGroups ----
const rep = validateAnnexCAllowed(annexC, allowed);
section("Anexo C — respeita allowedGroups da FIFA", [...rep.problems, ...rep.impossible.map((k) => `combo "${k}" não tem alocação possível`)]);

const total = Object.keys(annexC).length;
const unique = total - rep.ambiguous.length;
console.log();
console.log(`  ${C.dim}Alocação ÚNICA (provada por lógica):${C.reset} ${C.green}${unique}/${total}${C.reset}`);
if (rep.ambiguous.length > 0) {
  console.log(`  ${C.yellow}Ambíguos (allowedGroups admite >1 alocação válida): ${rep.ambiguous.length}/${total}${C.reset}`);
  console.log(`  ${C.dim}→ Nesses, só um diff com a tabela oficial da FIFA confirma a escolha exata.${C.reset}`);
  console.log(`  ${C.dim}  exemplos: ${rep.ambiguous.slice(0, 12).join(", ")}${rep.ambiguous.length > 12 ? " …" : ""}${C.reset}`);
} else {
  console.log(`  ${C.green}Todos os 495 combos têm alocação ÚNICA → a tabela está provada sem precisar da fonte externa.${C.reset}`);
}

console.log();
console.log(
  failed
    ? `${C.red}${C.bold}FALHOU — corrija os problemas acima.${C.reset}\n`
    : `${C.green}${C.bold}OK — dados consistentes.${C.reset} ${C.dim}(ordem/desempates: rode \`npm test\`)${C.reset}\n`,
);
process.exit(failed ? 1 : 0);
