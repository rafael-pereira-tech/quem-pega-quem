// ============================================================================
// Tipos de domínio — Copa do Mundo 2026 (48 seleções, 12 grupos A–L de 4)
// O motor é PURO: estes tipos não dependem de React, DOM ou localStorage.
// ============================================================================

export const GROUP_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;
export type GroupId = (typeof GROUP_IDS)[number];

export type TeamId = string; // ex.: "BRA", "ARG"
export type Round = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Seleções
// ---------------------------------------------------------------------------
export interface Team {
  id: TeamId;
  name: string;
  group: GroupId;
  /** Ranking FIFA — MENOR = melhor. Desempate final (sempre separa). */
  fifaRanking: number;
}

// ---------------------------------------------------------------------------
// Cartões / Fair play (critério 7)
// Modelo fiel ao regulamento: por SELEÇÃO, por JOGO, conta-se o pior evento
// aplicável a cada jogador. Pontuação (maior = melhor, todos ≤ 0):
//   amarelo isolado                         = -1
//   2º amarelo / vermelho indireto          = -3
//   vermelho direto                         = -4
//   amarelo + vermelho direto (mesmo jogo)  = -5
// Entrada simples ("amarelos e vermelhos"): preencha `yellow` e `directRed`.
// ---------------------------------------------------------------------------
export interface MatchCards {
  yellow?: number;
  secondYellow?: number; // vermelho indireto (2º amarelo)
  directRed?: number;
  yellowAndDirectRed?: number; // amarelo + vermelho direto no mesmo jogo
}

export const FAIR_PLAY_POINTS = {
  yellow: -1,
  secondYellow: -3,
  directRed: -4,
  yellowAndDirectRed: -5,
} as const;

export const MATCH_POINTS = { win: 3, draw: 1, loss: 0 } as const;

// ---------------------------------------------------------------------------
// Jogos da fase de grupos
// ---------------------------------------------------------------------------
export interface GroupMatch {
  id: string;
  group: GroupId;
  round: Round;
  home: TeamId;
  away: TeamId;
  /** null = jogo ainda não disputado. */
  homeGoals: number | null;
  awayGoals: number | null;
  /** Cartões por seleção neste jogo (opcional). */
  cards?: Partial<Record<TeamId, MatchCards>>;
  /** Resultado oficial travado pelo job (UI/estado; o motor ignora). */
  locked?: boolean;
}

// ---------------------------------------------------------------------------
// Classificação
// ---------------------------------------------------------------------------
export type TiebreakCriterion =
  | 'points'
  | 'h2hPoints'
  | 'h2hGoalDiff'
  | 'h2hGoalsFor'
  | 'goalDiff'
  | 'goalsFor'
  | 'fairPlay'
  | 'fifaRanking'
  | 'teamId'; // fallback determinístico (não deveria ser alcançado)

export interface TeamRecord {
  team: TeamId;
  group: GroupId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  /** Pontuação fair play acumulada (≤ 0; maior = melhor). */
  fairPlay: number;
  /** Cartões acumulados (para exibição). */
  yellow: number;
  red: number;
}

export interface RankedTeam extends TeamRecord {
  /** 1..4 dentro do grupo. */
  position: number;
  /** Critério que colocou esta seleção à frente da seguinte (explicativo p/ UI). */
  decidedBy: TiebreakCriterion;
}

export interface GroupStanding {
  group: GroupId;
  table: RankedTeam[]; // ordenado 1º..4º
  /** Todos os jogos do grupo têm placar. */
  complete: boolean;
}

// ---------------------------------------------------------------------------
// Ranking dos terceiros (cruza os 12; SEM confronto direto)
// Ordem: 1.Pontos 2.Saldo geral 3.Gols geral 4.Fair play 5.Ranking FIFA
// ---------------------------------------------------------------------------
export interface RankedThird extends TeamRecord {
  rank: number; // 1..12
  qualified: boolean; // top 8
  decidedBy: TiebreakCriterion;
}

export interface ThirdPlaceRanking {
  rows: RankedThird[]; // ordenado 1..12
  /** Conjunto ORDENADO dos 8 grupos cujos terceiros avançaram (chave do Anexo C). */
  qualifiedGroups: GroupId[];
}

// ---------------------------------------------------------------------------
// Anexo C — 495 combinações: C(12,8)
// chave = string com as 8 letras de grupo ordenadas, ex.: "ABDEGHIJ"
// valor = para cada grupo-VENCEDOR que enfrenta um terceiro, qual grupo de
//         onde vem esse terceiro.
// ---------------------------------------------------------------------------
export type ThirdAssignment = Partial<Record<GroupId, GroupId>>;
export type AnnexCTable = Record<string, ThirdAssignment>;

// ---------------------------------------------------------------------------
// Estrutura do mata-mata (R32 → final)
// ---------------------------------------------------------------------------
export type KnockoutRound = 'R32' | 'R16' | 'QF' | 'SF' | 'THIRD' | 'FINAL';

export type Side =
  | { from: 'winner'; group: GroupId } // 1º do grupo
  | { from: 'runnerUp'; group: GroupId } // 2º do grupo
  | { from: 'third'; slot: GroupId } // terceiro que enfrenta o VENCEDOR de `slot`
  | { from: 'winnerOf'; match: string }
  | { from: 'loserOf'; match: string }; // disputa de 3º lugar

export interface KnockoutGameDef {
  id: string;
  round: KnockoutRound;
  home: Side;
  away: Side;
}

/** Placar de um jogo do mata-mata. Pênaltis só quando empata em 90+30. */
export interface KnockoutScore {
  /** Gols após tempo normal + prorrogação. */
  homeGoals: number | null;
  awayGoals: number | null;
  penalties?: { home: number; away: number } | null;
  locked?: boolean;
}

export interface ResolvedSide {
  ref: Side;
  team?: TeamId; // resolvido quando conhecido
  label: string; // "1A", "2C", "3D", "Venc. M49"...
}

export interface ResolvedKnockoutGame {
  id: string;
  round: KnockoutRound;
  home: ResolvedSide;
  away: ResolvedSide;
  score?: KnockoutScore;
  winner?: TeamId; // derivado do placar
  loser?: TeamId;
}

// ---------------------------------------------------------------------------
// Entrada / saída do motor
// ---------------------------------------------------------------------------
export interface SimulationInput {
  teams: Team[];
  matches: GroupMatch[];
  annexC: AnnexCTable;
  structure: KnockoutGameDef[];
  knockoutResults?: Record<string, KnockoutScore>;
}

export interface TournamentResult {
  standings: GroupStanding[];
  thirds: ThirdPlaceRanking;
  annexKey: string | null;
  thirdAssignment: ThirdAssignment | null;
  bracket: ResolvedKnockoutGame[];
  warnings: string[];
}
