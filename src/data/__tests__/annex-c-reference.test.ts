import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { anexoCFileSchema, loadAnexoC } from "../schema";
import { buildAnnexKey } from "../../engine/annexC";
import type { GroupId } from "../../engine/types";

// Snapshot OFICIAL do Anexo C, extraído do PDF de regulamentos da FIFA (pp. 79-83)
// e triangulado com a Wikipedia + uma extração independente (0 diffs). Ver _source.
// Este teste trava o anexo-c.json contra a fonte oficial: qualquer edição acidental
// que mude um confronto de terceiro quebra aqui.
const read = (name: string) =>
  JSON.parse(readFileSync(new URL(`../../../data/${name}`, import.meta.url), "utf8"));

const reference: { table: Record<string, Record<string, string>> } = read("anexo-c.reference.json");
const ours = loadAnexoC(anexoCFileSchema.parse(read("anexo-c.json")));

// canonicaliza nossa tabela pro mesmo formato do snapshot (chave ordenada).
const oursCanon: Record<string, Record<string, string>> = {};
for (const [k, v] of Object.entries(ours)) {
  oursCanon[buildAnnexKey(k.split("") as GroupId[])] = v as Record<string, string>;
}

describe("anexo-c.json bate com o Anexo C OFICIAL da FIFA", () => {
  it("tem exatamente as 495 mesmas combinações", () => {
    expect(Object.keys(oursCanon).sort()).toEqual(Object.keys(reference.table).sort());
  });

  it("cada combinação aloca os terceiros exatamente como a FIFA (3960 confrontos)", () => {
    const mismatches: string[] = [];
    for (const [key, refAssign] of Object.entries(reference.table)) {
      const got = oursCanon[key];
      if (!got) {
        mismatches.push(`${key}: ausente`);
        continue;
      }
      for (const [slot, third] of Object.entries(refAssign)) {
        if (got[slot] !== third) mismatches.push(`${key} ${slot}: nosso=${got[slot]} FIFA=${third}`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
