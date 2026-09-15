import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { simulate } from "../../engine";
import {
  anexoCFileSchema,
  bracketFileSchema,
  gruposFileSchema,
  loadAnexoC,
  loadGrupos,
  loadStructure,
  roundOf32FileSchema,
} from "../schema";

import type { KnockoutScore } from "../../engine/types";

// ============================================================================
// Replay da Copa 2026: com os 72 jogos de grupo (data/grupos.json) + os 32 do
// mata-mata (data/knockout-results.json), o motor tem que reproduzir o torneio
// real — Espanha campeã, Argentina vice, Inglaterra em 3º.
// Fonte: FIFA Competition Summary (11 jun – 19 jul 2026), Version 34.
// ============================================================================

const read = (name: string) =>
  JSON.parse(readFileSync(new URL(`../../../data/${name}`, import.meta.url), "utf8"));

const knockoutFileSchema = z.array(
  z.object({
    match: z.number().int(),
    round: z.string(),
    home: z.string(),
    away: z.string(),
    homeGoals: z.number().int().nonnegative(),
    awayGoals: z.number().int().nonnegative(),
    aet: z.boolean().optional(),
    penalties: z.object({ home: z.number().int(), away: z.number().int() }).optional(),
  }),
);

const grupos = loadGrupos(gruposFileSchema.parse(read("grupos.json")));
const annexC = loadAnexoC(anexoCFileSchema.parse(read("anexo-c.json")));
const structure = loadStructure(
  roundOf32FileSchema.parse(read("round-of-32.json")),
  bracketFileSchema.parse(read("bracket.json")),
);
const knockoutFile = knockoutFileSchema.parse(read("knockout-results.json"));

const knockoutResults: Record<string, KnockoutScore> = Object.fromEntries(
  knockoutFile.map((g) => [
    String(g.match),
    {
      homeGoals: g.homeGoals,
      awayGoals: g.awayGoals,
      ...(g.penalties ? { penalties: g.penalties } : {}),
    },
  ]),
);

const result = simulate({ ...grupos, annexC, structure, knockoutResults });
const game = (id: string) => result.bracket.find((g) => g.id === id)!;

describe("replay da Copa do Mundo 2026", () => {
  it("fase de grupos completa, sem pendências", () => {
    expect(result.standings).toHaveLength(12);
    expect(result.standings.every((s) => s.complete)).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("terceiros classificados são B D E F I J K L", () => {
    expect(result.thirds.qualifiedGroups).toEqual(["B", "D", "E", "F", "I", "J", "K", "L"]);
    expect(result.annexKey).toBe("BDEFIJKL");
  });

  it("os 32 jogos do mata-mata resolvem os mesmos times do arquivo oficial", () => {
    expect(knockoutFile).toHaveLength(32);
    for (const g of knockoutFile) {
      const resolved = game(String(g.match));
      expect(resolved.home.team).toBe(g.home);
      expect(resolved.away.team).toBe(g.away);
    }
  });

  it("cada jogo tem vencedor (pênaltis incluídos) e propaga pra fase seguinte", () => {
    for (const g of result.bracket) {
      expect(g.winner, `jogo ${g.id}`).toBeDefined();
    }
    // R32 → R16: Paraguai (venceu a Alemanha nos pênaltis) pega a França
    expect(game("89").home.team).toBe("PAR");
    expect(game("89").away.team).toBe("FRA");
  });

  it("semifinais: Espanha passa a França, Argentina passa a Inglaterra", () => {
    expect(game("101").winner).toBe("ESP");
    expect(game("102").winner).toBe("ARG");
  });

  it("final: Espanha 1–0 Argentina (prorrogação) — campeã; Inglaterra em 3º", () => {
    expect(game("104").winner).toBe("ESP");
    expect(game("104").loser).toBe("ARG");
    expect(game("103").winner).toBe("ENG");
    expect(game("103").loser).toBe("FRA");
  });
});
