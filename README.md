# Quem Pega Quem 🏆🇪🇸

> **ARCHIVED — projeto encerrado após a Copa do Mundo 2026.** Não recebe mais
> atualizações de placar. Mantido como case de interface e de motor de regras:
> o torneio completo (grupos + mata-mata) está registrado em `data/` e o
> replay é verificado por teste.

Simulador ao vivo do mata-mata da Copa do Mundo 2026. Conforme saíam os
placares da terceira rodada, a chave dos 16-avos se montava na hora —
incluindo os 8 melhores terceiros e o cruzamento do Anexo C da FIFA.

**Demo (congelada no torneio final):**
[quem-pega-quem.pages.dev](https://quem-pega-quem.pages.dev/)

## O conceito

O regulamento de 2026 não era “os dois primeiros de cada grupo”. Com 12
grupos, 8 vagas para os melhores terceiros e 495 combinações possíveis no
Anexo C, a pergunta no bar era sempre a mesma:
_se a Argentina ganhar de 2, quem ela pega?_

O app respondia isso no celular, sem cadastro:

- Tabelas dos 12 grupos com desempate oficial (incluindo confronto direto recursivo)
- Ranking dos terceiros e seleção automática dos 8 que avançam
- Chave R32 → final, com overlay ao vivo nos jogos em andamento
- Palpite local sobre jogos abertos; placar oficial (admin) se sobrepunha e propagava via Realtime
- Superfície mobile (abas Grupos / Chave / Melhores 3º) e visão única no desktop

O motor de classificação vive em `src/engine/`: TypeScript puro, sem React
nem I/O, coberto por testes contra o regulamento e o Anexo C
(`npm run validate`).

## Como terminou — Copa do Mundo 2026

**Campeã: Espanha** — 1–0 na Argentina na prorrogação (gol de Ferran Torres,
106'), 19/07 no MetLife. Vice: Argentina. 3º lugar: Inglaterra (6–4 na
França). Semifinalistas: França e Inglaterra.

O torneio inteiro está registrado no repo e é reproduzido pelo motor:

- `data/grupos.json` — os 72 jogos da fase de grupos
- `data/knockout-results.json` — os 32 do mata-mata (R32 → final, com pênaltis),
  que o app abre já preenchidos e travados, como os grupos
- `src/data/__tests__/copa-2026-replay.test.ts` — replay ponta-a-ponta que
  prova: grupos completos, terceiros `B D E F I J K L`, e Espanha campeã

Fonte dos placares: FIFA Competition Summary (11 jun – 19 jul 2026).

## Stack

React 19 · TypeScript · Vite · Tailwind v4 · Supabase (auth anônima,
Postgres, RLS, Realtime) · Cloudflare Pages

## Desenvolvimento

```bash
nvm use          # ver .nvmrc
npm install
cp .env.example .env   # opcional; sem Supabase o app roda só com palpite local
npm run dev
```

Gate local: `npm run check` (format, lint, typecheck, testes, build, audit).
