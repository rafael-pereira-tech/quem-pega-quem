# Arquitetura

Quatro camadas, com uma fronteira dura entre **regra** e **tudo o mais**.

```
┌──────────────────────────────────────────────────────────────┐
│  UI (src/components, src/hooks, src/state)  — React + Tailwind │
│     ▲ lê resultado                          ▼ escreve palpite  │
├──────────────────────────────────────────────────────────────┤
│  FUSÃO (src/lib/buildInput.ts)  oficial > seed > palpite       │
├───────────────────────────────┬──────────────────────────────┤
│  MOTOR PURO (src/engine)       │  DADOS (data/ + src/data)     │
│  records, standings,           │  grupos / anexo-c /           │
│  tiebreakers, thirds, annexC,  │  round-of-32 / bracket  +     │
│  bracket  — sem React/IO       │  loaders zod (schema.ts)      │
├──────────────────────────────────────────────────────────────┤
│  BACKEND (src/supabase + supabase/)  auth anônima + RLS + RT   │
└──────────────────────────────────────────────────────────────┘
```

## 1. Motor puro — `src/engine/`

Onde vivem **todas** as regras de classificação. Sem React, sem DOM, sem IO,
sem ler arquivos: funções que recebem dados e devolvem dados. A entrada de topo
é `simulate(input)` (`src/engine/index.ts`), 100% determinística — a mesma
entrada sempre dá a mesma saída.

Peças:

- `records.ts` — V/E/D, pontos (3/1/0), saldo, gols, fair play a partir dos jogos.
- `tiebreakers.ts` — `orderGroup`: a escada de desempate **oficial 2026**, com a
  recursão do confronto direto (ver ADR 0001).
- `standings.ts` — monta a tabela 1º–4º de cada grupo.
- `thirds.ts` — rankeia os 12 terceiros (sem confronto direto) e marca os 8 que
  avançam; `qualifiedGroups` é a chave do Anexo C.
- `annexC.ts` — `lookupThirdAssignment`: consulta a tabela de 495 combos e
  devolve o slot(grupo-vencedor) → grupo do terceiro.
- `bracket.ts` — resolve R32 → final a partir das classificações e do Anexo C.
- `integrity.ts` — checagens estruturais usadas por `npm run validate`.

**Por que o motor é puro:** a regra de desempate 2026 e o Anexo C são a parte
crítica e sutil do produto. Isolá-los de React/IO permite testá-los como um
contrato fechado (entrada → saída esperada), rodar em Node (rápido) e ter
certeza de que um refactor de UI nunca muda um resultado de jogo. **Toda regra
nova entra aqui, coberta por teste.**

## 2. Dados — `data/` + `src/data/`

Referência estática do torneio (não muda durante os jogos):

- `data/grupos.json` — 12 grupos, seleções, fixtures (72 jogos com placar `null`).
- `data/anexo-c.json` — as 495 combinações do Anexo C.
- `data/anexo-c.reference.json` — snapshot OFICIAL da FIFA (ver ADR 0002).
- `data/round-of-32.json` + `data/bracket.json` — estrutura do mata-mata.

`src/data/schema.ts` tem os **loaders zod**: validam o formato real do arquivo e
traduzem para os tipos do motor. `src/data/static.ts` carrega tudo uma vez na
inicialização (`staticData`). Nenhum JSON é consumido cru — sempre passa pelo
schema.

## 3. Fusão de placares — `src/lib/buildInput.ts`

O motor não sabe de onde vem cada placar. Quem decide é a camada de fusão, em
**três camadas com prioridade**:

1. **OFICIAL** (admin/Supabase) — quando `locked`, é a verdade e fica read-only.
2. **SEED** (`data/grupos.json`) — resultado real já jogado embutido no dado;
   também trava o jogo.
3. **PALPITE** (cenário do usuário, em `src/state`) — preenche só os jogos ainda
   abertos.

`buildSimulationInput(scenario, official)` produz o `SimulationInput` único que
vai pro `simulate()`. É o único ponto que mistura "verdade" e "palpite".

## 4. UI e estado — `src/components`, `src/hooks`, `src/state`

- **Componentes** mobile (abas Grupos/Chave/Melhores 3º) e desktop
  (`DesktopScreen`, `BracketDesktop`); `useIsDesktop` escolhe.
- **Estado** (`src/state/store.ts`) — Zustand com `persist`. Só o **cenário do
  usuário** persiste (localStorage `qpq-scenario`); o oficial sempre vem fresco
  do backend.
- **`useSimulation`** liga estado → fusão → motor e devolve o `TournamentResult`
  para a UI desenhar.

## 5. Backend — `src/supabase/` + `supabase/`

Opcional: sem credenciais, `supabase` é `null` e o app roda local. Quando ligado:

- **Auth anônima** dá um usuário a cada visitante; admin é por `role` no
  `profiles`.
- **`official_results`** — placar oficial; admin escreve, todos leem; **Realtime**
  empurra a mudança pra todos os clientes.
- **`scenarios`** — cenário por usuário, compartilhável quando `is_public`.
- **RLS** protege tudo (ver ADR 0003). A `service_role` **nunca** entra no front.

## Onde ficam as regras (resumo)

| Regra                               | Lugar                          |
| ----------------------------------- | ------------------------------ |
| Pontos, desempate de grupo 2026     | `src/engine/tiebreakers.ts`    |
| Ranking dos terceiros (sem h2h)     | `src/engine/thirds.ts`         |
| Anexo C (495 combos → confronto)    | `src/engine/annexC.ts` + dados |
| Montagem da chave R32 → final       | `src/engine/bracket.ts`        |
| Prioridade oficial > seed > palpite | `src/lib/buildInput.ts`        |
| Quem pode escrever o quê            | RLS em `supabase/migrations/`  |

## Fluxo de dados (uma frase)

`data/` (zod) → `staticData` → **fusão** com `official` (Supabase) e `scenario`
(usuário) → `simulate()` (motor puro) → `TournamentResult` → UI.
