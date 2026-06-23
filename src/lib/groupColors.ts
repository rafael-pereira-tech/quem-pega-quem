import type { GroupId } from "../engine/types";

// Paleta festiva dos 12 grupos (direção Transmissão).
export const GROUP_COLOR: Record<GroupId, string> = {
  A: "#FF3B6B",
  B: "#FF7A00",
  C: "#FFB400",
  D: "#36C275",
  E: "#00B3A6",
  F: "#2E9BFF",
  G: "#6C5CE7",
  H: "#C44CFF",
  I: "#FF4FA3",
  J: "#18C0C4",
  K: "#8BC34A",
  L: "#FF5C5C",
};

// Grupos com fundo claro → texto escuro no badge.
const DARK_TEXT: Record<GroupId, string> = {
  A: "#fff",
  B: "#fff",
  C: "#16140f",
  D: "#06210f",
  E: "#04201e",
  F: "#04162b",
  G: "#fff",
  H: "#fff",
  I: "#fff",
  J: "#04201f",
  K: "#0f2104",
  L: "#fff",
};

export const groupColor = (g: GroupId) => GROUP_COLOR[g];
export const groupTextColor = (g: GroupId) => DARK_TEXT[g];
/** Cor do grupo com alpha hex (ex.: "33" = ~20%). */
export const groupColorAlpha = (g: GroupId, alphaHex: string) => GROUP_COLOR[g] + alphaHex;
