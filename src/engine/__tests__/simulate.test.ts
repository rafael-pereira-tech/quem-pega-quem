import { describe, expect, it } from "vitest";
import { simulate } from "../index";
import { GROUP_IDS, type AnnexCTable, type GroupId, type GroupMatch, type KnockoutGameDef, type Team } from "../types";

// FIFA dos terceiros (g3) — controla quais 8 grupos avançam. A..H = 1..8 (passam), I..L = 9..12 (caem).
const THIRD_FIFA: Record<GroupId, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10, K: 11, L: 12,
};

/** Torneio completo: em cada grupo g1>g2>g3>g4 (placar 1-0). Terceiro = g3. */
function buildTournament(): { teams: Team[]; matches: GroupMatch[] } {
  const teams: Team[] = [];
  const matches: GroupMatch[] = [];
  GROUP_IDS.forEach((g, gi) => {
    const ids = [`${g}1`, `${g}2`, `${g}3`, `${g}4`] as const;
    ids.forEach((id, ti) => {
      teams.push({
        id,
        name: id,
        group: g,
        fifaRanking: ti === 2 ? THIRD_FIFA[g] : 200 + gi * 4 + ti,
      });
    });
    // g1 vence todos; g2 vence g3,g4; g3 vence g4 → 9/6/3/0
    const pairs: Array<[string, string]> = [
      [ids[0], ids[1]], [ids[0], ids[2]], [ids[0], ids[3]],
      [ids[1], ids[2]], [ids[1], ids[3]],
      [ids[2], ids[3]],
    ];
    pairs.forEach(([h, a], i) => {
      matches.push({
        id: `${g}-${i}`,
        group: g,
        round: ((i % 3) + 1) as 1 | 2 | 3,
        home: h,
        away: a,
        homeGoals: 1,
        awayGoals: 0,
      });
    });
  });
  return { teams, matches };
}

const annexC: AnnexCTable = {
  // chave dos 8 terceiros classificados → terceiro (grupo) que cada vencedor pega
  ABCDEFGH: { A: "C", B: "D", D: "E", E: "F", G: "A", I: "B", K: "G", L: "H" },
};

const structure: KnockoutGameDef[] = [
  { id: "M1", round: "R32", home: { from: "winner", group: "A" }, away: { from: "third", slot: "A" } },
  { id: "M2", round: "R32", home: { from: "winner", group: "C" }, away: { from: "runnerUp", group: "F" } },
  { id: "M3", round: "R32", home: { from: "winner", group: "I" }, away: { from: "third", slot: "I" } },
  { id: "M9", round: "R16", home: { from: "winnerOf", match: "M1" }, away: { from: "winnerOf", match: "M2" } },
];

describe("simulate() — fluxo completo grupos → terceiros → Anexo C → chave", () => {
  const { teams, matches } = buildTournament();
  const result = simulate({ teams, matches, annexC, structure });

  it("classifica os 12 grupos completos sem avisos", () => {
    expect(result.standings).toHaveLength(12);
    expect(result.standings.every((s) => s.complete)).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("cada terceiro colocado é o g3 do seu grupo", () => {
    for (const s of result.standings) {
      expect(s.table[2]!.team).toBe(`${s.group}3`);
    }
  });

  it("ranqueia os terceiros e escolhe os 8 melhores (A..H)", () => {
    expect(result.thirds.qualifiedGroups).toEqual(["A", "B", "C", "D", "E", "F", "G", "H"]);
    expect(result.annexKey).toBe("ABCDEFGH");
    expect(result.thirdAssignment).toEqual(annexC.ABCDEFGH);
  });

  it("monta o R32 resolvendo vencedores, vices e terceiros corretos", () => {
    const g = (id: string) => result.bracket.find((x) => x.id === id)!;
    expect(g("M1").home.team).toBe("A1");
    expect(g("M1").away.team).toBe("C3"); // terceiro do grupo C enfrenta o vencedor de A
    expect(g("M2").home.team).toBe("C1");
    expect(g("M2").away.team).toBe("F2");
    expect(g("M3").away.team).toBe("B3"); // slot I → terceiro do grupo B
  });

  it("avisa quando a combinação de terceiros não está no Anexo C", () => {
    const r = simulate({ teams, matches, annexC: {}, structure });
    expect(r.thirdAssignment).toBeNull();
    expect(r.warnings.some((w) => w.includes("não encontrada no Anexo C"))).toBe(true);
  });
});
