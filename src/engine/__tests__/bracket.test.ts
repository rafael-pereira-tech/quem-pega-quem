import { describe, expect, it } from "vitest";
import { decideOutcome, resolveBracket } from "../bracket";
import { buildAnnexKey, lookupThirdAssignment } from "../annexC";
import type {
  AnnexCTable,
  GroupId,
  GroupStanding,
  KnockoutGameDef,
  RankedTeam,
  TeamId,
} from "../types";

function standing(group: GroupId, ids: [TeamId, TeamId, TeamId, TeamId]): GroupStanding {
  const table: RankedTeam[] = ids.map((id, i) => ({
    team: id,
    group,
    played: 3,
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
    position: i + 1,
    decidedBy: "points",
  }));
  return { group, table, complete: true };
}

describe("Anexo C — chave e consulta", () => {
  it("buildAnnexKey ordena as letras", () => {
    expect(buildAnnexKey(["D", "A", "C", "B"] as GroupId[])).toBe("ABCD");
  });

  it("lookup retorna o mapa do slot quando a chave existe", () => {
    const table: AnnexCTable = { ABDEGHIJ: { A: "D", B: "H" } };
    const r = lookupThirdAssignment(table, ["J", "A", "B", "D", "E", "G", "H", "I"] as GroupId[]);
    expect(r.key).toBe("ABDEGHIJ");
    expect(r.assignment).toEqual({ A: "D", B: "H" });
  });

  it("retorna null se não houver 8 grupos ou a chave não existir", () => {
    const table: AnnexCTable = {};
    expect(lookupThirdAssignment(table, ["A", "B"] as GroupId[]).assignment).toBeNull();
    expect(
      lookupThirdAssignment(table, ["A", "B", "C", "D", "E", "F", "G", "H"] as GroupId[])
        .assignment,
    ).toBeNull();
  });
});

describe("decideOutcome", () => {
  it("decide pelo placar de 90+30", () => {
    expect(decideOutcome("X", "Y", { homeGoals: 2, awayGoals: 1 })).toEqual({
      winner: "X",
      loser: "Y",
    });
  });
  it("vai pros pênaltis no empate", () => {
    expect(
      decideOutcome("X", "Y", { homeGoals: 1, awayGoals: 1, penalties: { home: 2, away: 4 } }),
    ).toEqual({ winner: "Y", loser: "X" });
  });
  it("indefinido se empate sem pênaltis ou placar faltando", () => {
    expect(decideOutcome("X", "Y", { homeGoals: 1, awayGoals: 1 })).toEqual({});
    expect(decideOutcome("X", "Y", { homeGoals: null, awayGoals: null })).toEqual({});
    expect(decideOutcome(undefined, "Y", { homeGoals: 1, awayGoals: 0 })).toEqual({});
  });
});

describe("montagem do mata-mata", () => {
  const standings = [
    standing("A", ["A1", "A2", "A3", "A4"]),
    standing("B", ["B1", "B2", "B3", "B4"]),
    standing("C", ["C1", "C2", "C3", "C4"]),
    standing("D", ["D1", "D2", "D3", "D4"]),
    standing("E", ["E1", "E2", "E3", "E4"]),
    standing("F", ["F1", "F2", "F3", "F4"]),
  ];
  const assignment = { A: "D" as GroupId }; // o terceiro que enfrenta o vencedor de A vem do grupo D

  const structure: KnockoutGameDef[] = [
    { id: "M1", round: "R32", home: { from: "winner", group: "A" }, away: { from: "third", slot: "A" } },
    { id: "M2", round: "R32", home: { from: "winner", group: "C" }, away: { from: "runnerUp", group: "F" } },
    { id: "M3", round: "R32", home: { from: "runnerUp", group: "B" }, away: { from: "runnerUp", group: "E" } },
    { id: "M4", round: "R16", home: { from: "winnerOf", match: "M1" }, away: { from: "winnerOf", match: "M2" } },
  ];

  const results = {
    M1: { homeGoals: 2, awayGoals: 1 },
    M2: { homeGoals: 1, awayGoals: 1, penalties: { home: 4, away: 2 } },
  };

  const bracket = resolveBracket(structure, standings, assignment, results);
  const game = (id: string) => bracket.find((g) => g.id === id)!;

  it("resolve vencedor, vice e terceiro (via Anexo C) para seleções", () => {
    expect(game("M1").home.team).toBe("A1");
    expect(game("M1").away.team).toBe("D3"); // terceiro do grupo D
    expect(game("M1").away.label).toBe("3D");
    expect(game("M2").home.label).toBe("1C");
    expect(game("M2").away.label).toBe("2F");
    expect(game("M3").home.team).toBe("B2");
    expect(game("M3").away.team).toBe("E2");
  });

  it("deriva o vencedor por placar e por pênaltis", () => {
    expect(game("M1").winner).toBe("A1");
    expect(game("M2").winner).toBe("C1"); // venceu nos pênaltis
  });

  it("encadeia winnerOf nas fases seguintes", () => {
    expect(game("M4").home.team).toBe("A1");
    expect(game("M4").away.team).toBe("C1");
    expect(game("M4").home.label).toBe("Venc. M1");
    expect(game("M4").winner).toBeUndefined(); // sem placar ainda
  });

  it("deixa slot do terceiro em aberto quando não há atribuição do Anexo C", () => {
    const b = resolveBracket([structure[0]!], standings, null, {});
    expect(b[0]!.away.team).toBeUndefined();
    expect(b[0]!.away.label).toBe("3·(A)");
  });
});
