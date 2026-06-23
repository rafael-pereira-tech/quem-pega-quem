# AGENTS

Regras do projeto que mais importam, para contribuidores humanos e agentes de IA.

## Product Direction

**Quem Pega Quem** é um simulador ao vivo, mobile-first, do mata-mata da Copa do
Mundo 2026: conforme saem os placares da 3ª rodada dos grupos, mostra como se
formam os 16-avos de final — incluindo os 8 melhores terceiros e o cruzamento do
Anexo C da FIFA. Uso típico: acompanhar com amigos durante os jogos (bolão/bar).

Stack: React + TypeScript + Vite + Tailwind v4, majoritariamente client-side,
backend Supabase (auth anônima + admin por role, Postgres + RLS, Realtime),
deploy em Cloudflare Pages.

## Non-Negotiables

- **O motor é puro** (`src/engine/`): sem React, DOM ou IO. Toda regra de
  classificação e desempate vive lá e é coberta por testes.
- **As regras de desempate 2026 e o Anexo C (495 combos) são a fonte da verdade.**
  Foram validados contra o regulamento OFICIAL da FIFA — ver
  `data/anexo-c.reference.json` mais o teste de regressão. Não altere sem
  revalidar (`npm run validate`).
- **Segredos nunca vão para o cliente.** A anon key do Supabase é pública por
  design; a `service_role` NUNCA entra no front. Variáveis de ambiente só são
  lidas em `src/lib/env.ts` (o ESLint proíbe `import.meta.env` em qualquer outro
  lugar).
- **Respeite RLS e o papel de admin.** Escrita de resultado oficial é só admin;
  leitura é pública. O palpite do usuário é local/por-usuário.
- **PRs pequenos e revisáveis.** Se não cabe num diff coerente, proponha uma
  pilha (stacked PRs).
- **Adicione testes para o que importa:** desempates (incl. recursão de H2H),
  fusão de placares (oficial > seed > palpite), Anexo C, RLS e acessibilidade.

## Where To Look First

- `docs/product-vision.md`, `docs/architecture.md`
- `docs/reference/` — como o código está estruturado
- `docs/decisions/` — ADRs aceitos (leia antes de propor alternativas)
- `docs/playbooks/` — feature / bugfix / migration
- `ai/conventions/` — commits, PRs, branches
- `ai/agents/` — definições de agente
- `ai/skills/` — skills adotadas + MCP

## Change Types

- Feature: siga `docs/playbooks/feature.md`.
- Bug: siga `docs/playbooks/bugfix.md`.
- Migração de schema/dados: siga `docs/playbooks/migration.md`.

## Testing Expectations

- **Lógica/motor**: Vitest em ambiente Node (rápido, isolado) — `vite.config.ts`.
- **Componentes**: Vitest + Testing Library em jsdom (`// @vitest-environment jsdom`
  no topo do arquivo de teste).
- **Integridade dos dados**: `npm run validate` (árvore do mata-mata + Anexo C).
- **E2E** (Playwright): opcional/futuro.
- **Gate completo**: `npm run check` = format → lint → typecheck → test → build → audit.

## Review Expectations

Todo PR explica: o que mudou; por quê; como foi validado; e se toca dados
oficiais, RLS, segredos, o motor ou acessibilidade.
