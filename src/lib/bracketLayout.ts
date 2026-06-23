import type { KnockoutRound, ResolvedKnockoutGame } from "../engine/types";

/**
 * Calcula as meias-chaves (L/R) e a ordem vertical (por folha de R32) do
 * mata-mata, a partir das referências winnerOf. Usado pelos brackets.
 */
export function computeLayout(games: ResolvedKnockoutGame[]) {
  const byId = new Map(games.map((g) => [g.id, g]));
  const half = new Map<string, "L" | "R" | "C">();
  const final = games.find((g) => g.round === "FINAL");

  const assign = (id: string, h: "L" | "R") => {
    const g = byId.get(id);
    if (!g) return;
    half.set(id, h);
    for (const s of [g.home.ref, g.away.ref]) if (s.from === "winnerOf") assign(s.match, h);
  };
  if (final) {
    half.set(final.id, "C");
    if (final.home.ref.from === "winnerOf") assign(final.home.ref.match, "L");
    if (final.away.ref.from === "winnerOf") assign(final.away.ref.match, "R");
  }

  const leafIndex = new Map<string, number>();
  let li = 0;
  const dfs = (id: string) => {
    const g = byId.get(id);
    if (!g) return;
    if (g.round === "R32") {
      leafIndex.set(id, li++);
      return;
    }
    for (const s of [g.home.ref, g.away.ref]) if (s.from === "winnerOf") dfs(s.match);
  };
  if (final) dfs(final.id);

  const minLeaf = (id: string): number => {
    const g = byId.get(id);
    if (!g) return 1e9;
    if (g.round === "R32") return leafIndex.get(id) ?? 1e9;
    let m = 1e9;
    for (const s of [g.home.ref, g.away.ref]) if (s.from === "winnerOf") m = Math.min(m, minLeaf(s.match));
    return m;
  };

  const col = (round: KnockoutRound, side: "L" | "R") =>
    games
      .filter((g) => g.round === round && half.get(g.id) === side)
      .sort((a, b) => minLeaf(a.id) - minLeaf(b.id));

  const ordered = (round: KnockoutRound) =>
    games.filter((g) => g.round === round).sort((a, b) => minLeaf(a.id) - minLeaf(b.id));

  return { col, ordered, final, third: games.find((g) => g.round === "THIRD") };
}
