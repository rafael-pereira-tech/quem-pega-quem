import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { validateAnnexCAllowed, validateBracket } from "../../engine/integrity";
import {
  bracketFileSchema,
  loadStructure,
  roundOf32FileSchema,
  anexoCFileSchema,
  loadAnexoC,
} from "../schema";

import type { GroupId } from "../../engine/types";

const read = (name: string) =>
  JSON.parse(readFileSync(new URL(`../../../data/${name}`, import.meta.url), "utf8"));

const rawR32 = roundOf32FileSchema.parse(read("round-of-32.json"));
const structure = loadStructure(rawR32, bracketFileSchema.parse(read("bracket.json")));
const annexC = loadAnexoC(anexoCFileSchema.parse(read("anexo-c.json")));

const allowed: Partial<Record<GroupId, GroupId[]>> = {};
for (const g of rawR32) {
  for (const side of [g.home, g.away]) {
    if (side.rank === 3) allowed[side.lookupWinner] = side.allowedGroups;
  }
}

describe("integridade estrutural (garantida por lógica)", () => {
  it("a árvore do mata-mata é uma eliminatória bem-formada", () => {
    expect(validateBracket(structure)).toEqual([]);
  });

  it("toda combinação do Anexo C respeita o allowedGroups da FIFA e tem solução", () => {
    const rep = validateAnnexCAllowed(annexC, allowed);
    expect(rep.problems).toEqual([]);
    expect(rep.impossible).toEqual([]);
  });

  // O que a lógica NÃO prova: a escolha exata da FIFA nos combos ambíguos.
  // Documenta o tamanho do gap (precisa de diff com a tabela oficial).
  it("documenta quantos combos são ambíguos (precisam da fonte oficial)", () => {
    const rep = validateAnnexCAllowed(annexC, allowed);
    expect(rep.ambiguous.length).toBeLessThanOrEqual(Object.keys(annexC).length);
  });
});
