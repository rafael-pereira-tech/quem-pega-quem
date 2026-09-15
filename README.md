# Quem Pega Quem

Simulador ao vivo do mata-mata da Copa do Mundo 2026. Conforme saem os placares da terceira rodada, a chave dos 16-avos se monta na hora — incluindo os 8 melhores terceiros e o cruzamento do [Anexo C](https://www.fifa.com) da FIFA.

**Projeto encerrado após o torneio.** Mantido como case de interface: regras oficiais no motor, UI mobile-first e uma visão desktop para acompanhar os jogos.

**Demo:** [quem-pega-quem.pages.dev](https://quem-pega-quem.pages.dev/)

## O problema

O regulamento de 2026 não é “os dois primeiros de cada grupo”. Há 12 grupos, 8 vagas para os melhores terceiros e 495 combinações possíveis no Anexo C. A pergunta no bar é sempre a mesma: _se a Argentina ganhar de 2, quem ela pega?_

O app responde isso no celular, sem cadastro.

## O que a UI faz

- Tabelas dos 12 grupos com desempate oficial (incluindo confronto direto recursivo)
- Ranking dos terceiros e seleção automática dos 8 que avançam
- Chave R32 → final, com overlay ao vivo nos jogos em andamento
- Palpite local sobre jogos abertos; placar oficial (admin) se sobrepõe e propaga via Realtime
- Superfície mobile (abas Grupos / Chave / Melhores 3º) e visão única no desktop

O motor de classificação vive em `src/engine/`: TypeScript puro, sem React nem I/O, coberto por testes contra o regulamento e o Anexo C (`npm run validate`).

## Stack

React 19 · TypeScript · Vite · Tailwind v4 · Supabase (auth anônima, Postgres, RLS, Realtime) · Cloudflare Pages

## Desenvolvimento

```bash
nvm use          # ver .nvmrc
npm install
cp .env.example .env   # opcional; sem Supabase o app roda só com palpite local
npm run dev
```

Gate local: `npm run check` (format, lint, typecheck, testes, build, audit).
