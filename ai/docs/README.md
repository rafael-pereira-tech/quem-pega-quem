# ai/docs/

Engineering learnings captured **from the work that has already shipped**.
These are not policy — that's `ai/conventions/`. They are not decisions
— those are `docs/decisions/`. They are the _non-obvious things a future
contributor (or agent) would otherwise have to rediscover_.

A learning belongs here if:

- it surprised the implementer of a PR, AND
- it's not derivable from reading the code at a glance, AND
- it would save a future contributor a real chunk of time.

If the answer is in `git log` or the file you're editing, don't put it
here.

## Index

- [`testing.md`](./testing.md) — Vitest (Node padrão, jsdom opt-in por
  arquivo), Testing Library, jest-dom em `src/test/setup.ts`,
  `npm run validate`, coverage opcional, Playwright futuro.
- [`supabase-and-rls.md`](./supabase-and-rls.md) — schema real
  (profiles / official_results / scenarios), `is_admin()`, modelos de
  acesso, cliente `null` sem env, Realtime.
- [`security-and-privacy.md`](./security-and-privacy.md) — env só via
  `src/lib/env.ts`, anon key pública por design, `service_role` nunca
  no front, CSP/middleware N/A.
- [`server-actions.md`](./server-actions.md) — N/A (placeholder):
  escrita via cliente Supabase + RLS, sem camada de servidor.
- [`i18n.md`](./i18n.md) — N/A: app PT-BR único, strings inline.
