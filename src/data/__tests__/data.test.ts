import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  anexoCFileSchema,
  bracketFileSchema,
  gruposFileSchema,
  loadAnexoC,
  loadGrupos,
  loadStructure,
  roundOf32FileSchema,
} from "../schema";
import { simulate } from "../../engine";
import { validateAnnexCTable } from "../../engine/annexC";

const read = (name: string) =>
  JSON.parse(readFileSync(new URL(`../../../data/${name}`, import.meta.url), "utf8"));

const grupos = loadGrupos(gruposFileSchema.parse(read("grupos.json")));
const annexC = loadAnexoC(anexoCFileSchema.parse(read("anexo-c.json")));
const structure = loadStructure(
  roundOf32FileSchema.parse(read("round-of-32.json")),
  bracketFileSchema.parse(read("bracket.json")),
);

describe("arquivos reais em /data conformam ao contrato", () => {
  it("grupos.json: 12 grupos × 4 seleções × 6 jogos", () => {
    expect(new Set(grupos.teams.map((t) => t.group)).size).toBe(12);
    expect(grupos.teams).toHaveLength(48);
    expect(grupos.matches).toHaveLength(72);
  });

  it("anexo-c.json: 495 combinações, todas válidas", () => {
    expect(Object.keys(annexC)).toHaveLength(495);
    expect(validateAnnexCTable(annexC)).toEqual([]);
  });

  it("mata-mata: 32 jogos (R32→final) com ids únicos", () => {
    expect(structure).toHaveLength(32);
    expect(structure.filter((g) => g.round === "R32")).toHaveLength(16);
    expect(structure.filter((g) => g.round === "FINAL")).toHaveLength(1);
    expect(new Set(structure.map((g) => g.id)).size).toBe(32);
  });

  it("toda referência winnerOf/loserOf aponta pra um jogo existente", () => {
    const ids = new Set(structure.map((g) => g.id));
    for (const g of structure) {
      for (const side of [g.home, g.away]) {
        if (side.from === "winnerOf" || side.from === "loserOf") {
          expect(ids.has(side.match)).toBe(true);
        }
      }
    }
  });
});

describe("simulate() roda ponta-a-ponta com os dados reais", () => {
  const result = simulate({ ...grupos, annexC, structure });

  it("produz 12 classificações (provisórias, já que não há placares)", () => {
    expect(result.standings).toHaveLength(12);
    expect(result.standings.every((s) => s.table.length === 4)).toBe(true);
  });

  it("escolhe 8 terceiros e acha a combinação no Anexo C", () => {
    expect(result.thirds.qualifiedGroups).toHaveLength(8);
    expect(result.annexKey).not.toBeNull();
    expect(result.thirdAssignment).not.toBeNull();
  });

  it("monta o R32 e resolve os slots de vencedor/vice/terceiro", () => {
    const r32 = result.bracket.filter((g) => g.round === "R32");
    expect(r32).toHaveLength(16);
    // jogo 79 = vencedor de A vs terceiro (lookupWinner A)
    const g79 = result.bracket.find((g) => g.id === "79")!;
    expect(g79.home.label).toBe("1A");
    expect(g79.away.label.startsWith("3")).toBe(true);
    // com os 8 grupos de terceiros definidos, todo slot de R32 resolve uma seleção
    expect(r32.every((g) => g.home.team && g.away.team)).toBe(true);
  });
});
