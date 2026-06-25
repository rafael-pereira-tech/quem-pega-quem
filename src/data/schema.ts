import { z } from "zod";

import { buildAnnexKey } from "../engine/annexC";

import type {
  AnnexCTable,
  GroupId,
  GroupMatch,
  KnockoutGameDef,
  KnockoutRound,
  Side,
  Team,
} from "../engine/types";

// ============================================================================
// CONTRATO + loaders dos arquivos em /data (formato REAL fornecido).
// Toda a tradução "formato do arquivo → tipos do motor" vive aqui.
// ============================================================================

const groupId = z.enum(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]);
const teamId = z.string().min(1);
const matchday = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const cardsSchema = z
  .object({
    yellow: z.number().int().nonnegative().optional(),
    secondYellow: z.number().int().nonnegative().optional(),
    directRed: z.number().int().nonnegative().optional(),
    yellowAndDirectRed: z.number().int().nonnegative().optional(),
  })
  .strict();

/** Ranking FIFA ausente (null) → "pior possível"; empata e cai no fallback por id. */
export const UNKNOWN_FIFA = Number.MAX_SAFE_INTEGER;

// ---------------------------------------------------------------------------
// data/grupos.json — objeto chaveado por grupo
// { "A": { teams:[{id,name,fifaRanking,fairPlay}×4], matches:[{matchday,home,away,homeGoals,awayGoals,cards?,locked?}] }, ... }
// ---------------------------------------------------------------------------
const groupTeamSchema = z.object({
  id: teamId,
  name: z.string(),
  fifaRanking: z.number().int().positive().nullable(),
  fairPlay: z.number().optional(), // seed manual de fair play (atualmente o motor deriva de cartões)
});

const groupMatchSchema = z.object({
  matchday,
  home: teamId,
  away: teamId,
  homeGoals: z.number().int().nonnegative().nullable(),
  awayGoals: z.number().int().nonnegative().nullable(),
  cards: z.record(teamId, cardsSchema).optional(),
  locked: z.boolean().optional(),
  kickoff: z.string().optional(), // ISO 8601 (com offset)
  venue: z.string().optional(), // "Cidade / Estádio"
});

const groupBlockSchema = z.object({
  teams: z.array(groupTeamSchema).length(4),
  matches: z.array(groupMatchSchema),
});

export const gruposFileSchema = z.record(groupId, groupBlockSchema);
export type GruposFile = z.infer<typeof gruposFileSchema>;

export function loadGrupos(file: GruposFile): { teams: Team[]; matches: GroupMatch[] } {
  const teams: Team[] = [];
  const matches: GroupMatch[] = [];
  for (const [g, block] of Object.entries(file) as [GroupId, z.infer<typeof groupBlockSchema>][]) {
    for (const t of block.teams) {
      teams.push({
        id: t.id,
        name: t.name || t.id,
        group: g,
        fifaRanking: t.fifaRanking ?? UNKNOWN_FIFA,
      });
    }
    block.matches.forEach((m) => {
      matches.push({
        id: `${g}-R${m.matchday}-${m.home}-${m.away}`,
        group: g,
        round: m.matchday,
        home: m.home,
        away: m.away,
        homeGoals: m.homeGoals,
        awayGoals: m.awayGoals,
        ...(m.cards ? { cards: m.cards } : {}),
        ...(m.locked !== undefined ? { locked: m.locked } : {}),
        ...(m.kickoff ? { kickoff: m.kickoff } : {}),
        ...(m.venue ? { venue: m.venue } : {}),
      });
    });
  }
  return { teams, matches };
}

// ---------------------------------------------------------------------------
// data/anexo-c.json — { "ABCDEFGH": { "A":"H", ... 8 slots }, ... 495 chaves }
// ---------------------------------------------------------------------------
export const anexoCFileSchema = z.record(z.string(), z.record(groupId, groupId));

export function loadAnexoC(file: z.infer<typeof anexoCFileSchema>): AnnexCTable {
  const table: AnnexCTable = {};
  for (const [key, value] of Object.entries(file)) {
    table[buildAnnexKey(key.split("") as GroupId[])] = value;
  }
  return table;
}

// ---------------------------------------------------------------------------
// data/round-of-32.json — [{ match, type, home, away }] (16 jogos)
//   side: {rank:1,group} | {rank:2,group} | {rank:3,lookupWinner,allowedGroups}
// ---------------------------------------------------------------------------
const r32SideSchema = z.discriminatedUnion("rank", [
  z.object({ rank: z.literal(1), group: groupId }),
  z.object({ rank: z.literal(2), group: groupId }),
  z.object({ rank: z.literal(3), lookupWinner: groupId, allowedGroups: z.array(groupId) }),
]);

const r32GameSchema = z.object({
  match: z.number().int(),
  type: z.string(),
  home: r32SideSchema,
  away: r32SideSchema,
});
export const roundOf32FileSchema = z.array(r32GameSchema);

function r32Side(s: z.infer<typeof r32SideSchema>): Side {
  if (s.rank === 1) return { from: "winner", group: s.group };
  if (s.rank === 2) return { from: "runnerUp", group: s.group };
  return { from: "third", slot: s.lookupWinner };
}

// ---------------------------------------------------------------------------
// data/bracket.json — [{ match, round, home, away }] (R16 → final)
//   side: {winnerOf:n} | {loserOf:n}
// ---------------------------------------------------------------------------
const bracketSideSchema = z.union([
  z.object({ winnerOf: z.number().int() }),
  z.object({ loserOf: z.number().int() }),
]);

const bracketGameSchema = z.object({
  match: z.number().int(),
  round: z.enum(["R16", "QF", "SF", "third_place", "final"]),
  home: bracketSideSchema,
  away: bracketSideSchema,
});
export const bracketFileSchema = z.array(bracketGameSchema);

const ROUND_MAP: Record<z.infer<typeof bracketGameSchema>["round"], KnockoutRound> = {
  R16: "R16",
  QF: "QF",
  SF: "SF",
  third_place: "THIRD",
  final: "FINAL",
};

function bracketSide(s: z.infer<typeof bracketSideSchema>): Side {
  return "winnerOf" in s
    ? { from: "winnerOf", match: String(s.winnerOf) }
    : { from: "loserOf", match: String(s.loserOf) };
}

/** Combina os dois arquivos do mata-mata num único KnockoutGameDef[] (R32→final). */
export function loadStructure(
  r32File: z.infer<typeof roundOf32FileSchema>,
  bracketFile: z.infer<typeof bracketFileSchema>,
): KnockoutGameDef[] {
  const r32: KnockoutGameDef[] = r32File.map((g) => ({
    id: String(g.match),
    round: "R32",
    home: r32Side(g.home),
    away: r32Side(g.away),
  }));
  const rest: KnockoutGameDef[] = bracketFile.map((g) => ({
    id: String(g.match),
    round: ROUND_MAP[g.round],
    home: bracketSide(g.home),
    away: bracketSide(g.away),
  }));
  return [...r32, ...rest];
}
