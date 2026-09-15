# Quem Pega Quem 🏆🇪🇸

> **ARCHIVED — the 2026 World Cup is over and this project is frozen.**
> No more score updates. It is kept as an engineering case study: a live,
> mobile-first simulator of the World Cup knockout bracket, with the official
> rules engine, the complete tournament data, and a full-bracket replay test.
>
> **Live demo (frozen at the final whistle):**
> [quem-pega-quem.pages.dev](https://quem-pega-quem.pages.dev/)

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand ·
React Router · Zod · Supabase (anonymous auth, Postgres, RLS, Realtime) ·
Cloudflare Pages

## The problem

The 2026 format broke the classic "top two go through" mental model: 12
groups, 8 slots for the best third-placed teams, and **495 possible
combinations** in FIFA's Annex C mapping thirds to round-of-32 ties. The
question at every bar was always the same: _if Argentina wins by two, who do
they face?_

This app answered it on a phone, with no sign-up: as third-round scores came
in, the round-of-32 bracket assembled live — including the 8 best thirds and
the Annex C cross-pairing.

## How it ended — 2026 World Cup

**Champions: Spain** — 1–0 over Argentina after extra time (Ferran Torres,
106'), July 19 at MetLife. Runners-up: Argentina. Third place: England (6–4
over France). Semi-finalists: France and England.

The entire tournament is recorded in this repo and replayed by the engine:

- `data/grupos.json` — all 72 group-stage games
- `data/knockout-results.json` — all 32 knockout games (R32 → final, with shootouts)
- `src/data/__tests__/copa-2026-replay.test.ts` — end-to-end replay proving:
  complete groups, qualified thirds `B D E F I J K L`, and Spain champions

Score source: FIFA Competition Summary (June 11 – July 19, 2026), Version 34.

## Features

- **12 group tables** with the official tiebreak ladder, including recursive head-to-head
- **Best-thirds ranking** with automatic selection of the 8 advancing teams
- **Full bracket R32 → final**, with live overlay on games in progress and a
  completed-bracket view (mobile phase stepper + full-column desktop tree)
- **Local guesses** on open games; **official scores (admin)** override and
  propagate to everyone via Realtime
- **Mobile-first UI** (Groups / Bracket / Best thirds tabs) plus a single-screen desktop view
- **Anonymous by default** — no account needed to simulate; admin signs in via magic link

## Architecture

Four layers with a hard boundary between **rules** and everything else
(see `docs/architecture.md`; decisions in `docs/decisions/`):

```
┌──────────────────────────────────────────────────────────────┐
│ UI (src/components, src/hooks, src/state) — React + Tailwind  │
│      ▲ reads result                         ▼ writes guess    │
├──────────────────────────────────────────────────────────────┤
│ MERGE (src/lib/buildInput.ts) — official > seed > guess       │
├───────────────────────────────┬──────────────────────────────┤
│ PURE ENGINE (src/engine)       │ DATA (data/ + src/data)       │
│ records, standings,            │ grupos / anexo-c /            │
│ tiebreakers, thirds, annexC,   │ round-of-32 / bracket /       │
│ bracket — no React/IO          │ knockout-results + Zod loaders│
├──────────────────────────────────────────────────────────────┤
│ BACKEND (src/supabase + supabase/) — anon auth + RLS + RT     │
└──────────────────────────────────────────────────────────────┘
```

The top-level entry is `simulate(input)` (`src/engine/index.ts`) — 100% pure
and deterministic: same input, same output. The UI never computes standings;
it renders a `TournamentResult`.

### Engineering highlights

- **Pure rules engine** (`src/engine/`, ADR 0001): zero React/DOM/IO. The 2026
  tiebreak ladder lives in `tiebreakers.ts`, including the recursive
  head-to-head sub-group step most implementations get wrong.
- **Annex C as source of truth** (ADR 0002): all C(12,8) = 495 third-place
  combinations in `data/anexo-c.json`, structurally validated by
  `npm run validate` (bijection per combo + `allowedGroups` conformance).
- **Contract-first data layer**: every file in `data/` is parsed by a Zod
  schema in `src/data/schema.ts` — file format drift fails fast at load, not
  mid-tournament.
- **Three-layer score merge** (`src/lib/buildInput.ts`): locked official
  result → played seed → user guess. Seeding the full official tournament
  turns the app into an archive without touching the engine.
- **Testing pyramid** (ADR 0008): fast Node unit tests for the engine, jsdom +
  Testing Library for components, a full-tournament **replay test** as the
  data-integrity backstop, `npm run validate` for structural invariants.
- **Accessibility**: skip link, labeled score inputs, `aria-pressed` steppers,
  screen-reader headings per tab — enforced by `eslint-plugin-jsx-a11y`.
- **Quality gate**: `npm run check` = format → lint → typecheck → test →
  build → audit, with pre-commit (lint-staged) and pre-push (typecheck) hooks.

## Security & privacy

Audited 2026-09-15; posture is "anonymous-first, least privilege":

- **No secrets in the repo or its history.** Only the public Supabase anon key
  is ever referenced (public by design); `service_role` never reaches the
  client — env is read in exactly one file (`src/lib/env.ts`, ESLint-enforced).
  `.env.local` is gitignored; `dist/` is not tracked.
- **Row Level Security matrix** (`supabase/migrations/`): official results are
  admin-write / public-read via a `security definer is_admin()` check;
  analytics events are append-only and admin-read-only; user scenarios are
  owner-scoped; profiles are self-writable.
- **Anonymous auth by default** (Supabase anonymous sign-ins); admin uses
  passwordless magic link. No passwords stored anywhere.
- **Local-first guesses**: user scenarios persist in `localStorage`
  (`qpq-scenario`) and never leave the device unless Supabase is configured.
- **Minimal telemetry**: a closed set of 4 product events (`app_open`,
  `score_edit`, `reset`, `admin_open`) tied to the anonymous session, plus an
  optional Cloudflare Web Analytics beacon. No ad trackers. The only
  third-party data share is Google Fonts (IP/user-agent on font fetch) and the
  Supabase backend itself.
- **Dependencies**: `npm audit` is part of the gate. The one production `high`
  found (React Router GHSA-qwww-vcr4-c8h2, RSC-mode CSRF — not applicable to
  this client-only SPA) was patched; remaining highs are transitive
  build/dev toolchain, not shipped in an exploitable path.

## Project structure

```
data/                 72 group games + 32 knockout games + Annex C (495 combos)
src/engine/           pure rules: records → standings → tiebreakers → thirds → bracket
src/data/             Zod contracts + loaders + static bundle + data tests
src/lib/              score merge (official > seed > guess), layout, round helpers
src/state/            Zustand store (persisted user scenario only)
src/components/      mobile views, full desktop bracket tree, admin panel
src/supabase/         client, anonymous session, official sync, analytics
supabase/migrations/  Postgres schema + RLS policies (idempotent)
scripts/validate.ts   structural integrity: bracket tree + Annex C
```

## Getting started

```bash
nvm use          # see .nvmrc
npm install
cp .env.example .env.local   # optional; without Supabase the app runs fully local
npm run dev
```

| Script             | What it does                                                |
| ------------------ | ----------------------------------------------------------- |
| `npm run dev`      | Vite dev server with HMR                                    |
| `npm run check`    | Full gate: format → lint → typecheck → test → build → audit |
| `npm test`         | Vitest (engine in Node, components in jsdom)                |
| `npm run validate` | Bracket-tree + Annex C integrity report                     |
| `npm run build`    | Typecheck + production bundle                               |

## Status

Archived after the final. The demo stays up as a frozen snapshot; issues and
PRs are closed. Reuse the engine (`src/engine/` + `data/`) for the next
tournament — that boundary is exactly what it was built for.
