import anexoRaw from "../../data/anexo-c.json";
import bracketRaw from "../../data/bracket.json";
import gruposRaw from "../../data/grupos.json";
import r32Raw from "../../data/round-of-32.json";

import {
  anexoCFileSchema,
  bracketFileSchema,
  gruposFileSchema,
  loadAnexoC,
  loadGrupos,
  loadStructure,
  roundOf32FileSchema,
} from "./schema";

import type { AnnexCTable, GroupMatch, KnockoutGameDef, Team } from "../engine/types";

// Referência estática do torneio (não muda durante os jogos). Validada na carga.
const grupos = loadGrupos(gruposFileSchema.parse(gruposRaw));
const annexC: AnnexCTable = loadAnexoC(anexoCFileSchema.parse(anexoRaw));
const structure: KnockoutGameDef[] = loadStructure(
  roundOf32FileSchema.parse(r32Raw),
  bracketFileSchema.parse(bracketRaw),
);

export const staticData = {
  teams: grupos.teams as Team[],
  /** Os 72 jogos de grupo com placar null — a "grade" de fixtures. */
  seedMatches: grupos.matches as GroupMatch[],
  annexC,
  structure,
};

export const teamsById = new Map(staticData.teams.map((t) => [t.id, t]));
