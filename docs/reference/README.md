# Reference — mapa do código

Esta pasta descreve **como o código está estruturado hoje** (descritivo, não
prescritivo). Quando o código diverge do que está aqui, o doc é que está errado
— corrija junto com o PR que diverge.

| Camada de doc | Caminho           | Responde                               |
| ------------- | ----------------- | -------------------------------------- |
| Regras        | `AGENTS.md`       | Quais são os inegociáveis?             |
| Decisões      | `docs/decisions/` | _Por que_ X em vez de Y?               |
| **Reference** | `docs/reference/` | _Como_ X está estruturado aqui?        |
| Playbooks     | `docs/playbooks/` | _Como faço_ a tarefa X, passo a passo? |

## Árvore (alto nível)

```
data/        ← referência estática do torneio (JSON validado por zod)
scripts/     ← validate.ts (npm run validate)
supabase/    ← migrations/ + schema.sql
src/
├── engine/      ← MOTOR PURO (regras) — sem React/IO
├── data/        ← loaders + schema zod dos JSON de data/
├── lib/         ← infra de cross-cutting (env, fusão de placares, layout)
├── state/       ← estado do app (Zustand + persist)
├── hooks/       ← hooks de React (simulação, breakpoint)
├── components/  ← UI (mobile + desktop)
├── supabase/    ← cliente, sessão, leitura/escrita oficial, sync realtime
├── App.tsx · main.tsx · index.css
```

## `src/engine/` — o motor (onde vivem as regras)

Puro: sem React, DOM ou IO. Entrada de topo: `simulate()` em `index.ts`. Ver
ADR 0001.

| Arquivo          | Responsabilidade                                               |
| ---------------- | -------------------------------------------------------------- |
| `index.ts`       | `simulate(input)` — orquestra tudo; reexporta a API pública    |
| `types.ts`       | Tipos do domínio (Team, GroupMatch, Side, TournamentResult…)   |
| `records.ts`     | V/E/D, pontos 3/1/0, saldo, gols, fair play a partir dos jogos |
| `standings.ts`   | Tabela 1º–4º de cada grupo                                     |
| `tiebreakers.ts` | `orderGroup` — **escada de desempate 2026** (recursão de h2h)  |
| `thirds.ts`      | Ranking dos 12 terceiros (sem h2h); marca os 8 que avançam     |
| `annexC.ts`      | `lookupThirdAssignment` — consulta o Anexo C (495 combos)      |
| `bracket.ts`     | Resolve R32 → final a partir de standings + Anexo C            |
| `fairplay.ts`    | Pontuação de fair play por cartões                             |
| `integrity.ts`   | Checagens estruturais usadas por `npm run validate`            |

## `data/` + `src/data/` — dados

`data/` guarda o JSON estático (não muda durante os jogos):
`grupos.json`, `anexo-c.json`, `anexo-c.reference.json` (snapshot oficial da
FIFA — ADR 0002), `round-of-32.json`, `bracket.json`.

`src/data/schema.ts` tem os **loaders zod** (formato do arquivo → tipos do
motor); nenhum JSON é consumido cru. `src/data/static.ts` carrega tudo uma vez
(`staticData`).

## `src/lib/` — infra de cross-cutting

| Arquivo                      | Responsabilidade                                               |
| ---------------------------- | -------------------------------------------------------------- |
| `env.ts`                     | **Único** lugar que lê `import.meta.env` (zod) — ADR 0003/0004 |
| `buildInput.ts`              | **Fusão** oficial > seed > palpite → `SimulationInput`         |
| `bracketLayout.ts`           | Geometria da chave para a UI desktop                           |
| `groupColors.ts`, `flags.ts` | Helpers de apresentação                                        |

## `src/state/`, `src/hooks/` — estado e ligação

- `state/store.ts` — Zustand com `persist`; **só o cenário do usuário** persiste
  (`qpq-scenario`); o oficial vem fresco do backend.
- `hooks/useSimulation.ts` — liga estado → fusão → motor; devolve o resultado.
- `hooks/useIsDesktop.ts` — escolhe layout mobile/desktop.

## `src/components/` — UI

Mobile (abas Grupos / Chave / Melhores 3º) e desktop (`DesktopScreen`,
`BracketDesktop`). Componente é "burro": só desenha o `TournamentResult` e
escreve palpite no estado. `AdminPanel` lança o placar oficial (só admin).

## `src/supabase/` + `supabase/` — backend (opcional)

- `src/supabase/client.ts` — cliente, ou `null` sem credenciais.
- `session.ts` — sessão anônima + flag de admin.
- `official.ts` — ler/gravar/apagar `official_results` (escrita só passa pela
  RLS se for admin).
- `useOfficialSync.ts` — Realtime: aplica no estado o que o admin grava.
- `supabase/migrations/` + `schema.sql` — schema e RLS. Ver ADR 0003 e
  `docs/playbooks/migration.md`.

## Onde estão as regras / testes / validação

- **Regras** — só em `src/engine/` (e na tabela `data/anexo-c.json`). Nunca em
  componente.
- **Testes** — co-localizados em `__tests__/`. Motor em Node (rápido);
  componentes em jsdom (`// @vitest-environment jsdom` no topo). Rodam com
  Vitest (`npm test`); gate completo: `npm run check`.
- **Validação de dados** — `npm run validate` (`scripts/validate.ts`): árvore do
  mata-mata + Anexo C estrutural (495 combos, bijeção, `allowedGroups`).
- **Regressão do Anexo C** — `src/data/__tests__/annex-c-reference.test.ts` trava
  `anexo-c.json` contra o snapshot oficial da FIFA.
