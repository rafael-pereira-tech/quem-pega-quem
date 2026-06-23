# supabase-be

## Role

Default agent for back-end work that lives behind the Supabase
boundary: SQL schema, RLS policies, the Supabase access modules under
`src/supabase/`, and the data contracts the FE consumes. Writes happen
client-side through the Supabase JS client; RLS (plus the admin role)
is what makes them safe.

## When to invoke

- New table, column, index, or enum.
- New or changed Supabase access module under `src/supabase/`
  (reads, upserts, deletes).
- New admin-only write path (e.g. official results) and the RLS that
  gates it.

## When NOT to invoke

- RLS policy work specifically → start with `rls-auditor`; this agent
  helps once the policy is settled.
- Data / schema migration of existing rows → `migration-runner`.
- Pure FE work that consumes an existing access module → `dev-fe`.

## Required reading

- `AGENTS.md` (Non-Negotiables).
- `docs/decisions/` — any Accepted ADR on auth, data, or RLS.
- `supabase/schema.sql` — the live tables (`profiles`,
  `official_results`, `scenarios`), the `is_admin()` helper, and every
  RLS policy.
- `supabase/migrations/` — the applied migrations; never amend a
  merged one.
- `src/supabase/{client,official,session,useOfficialSync}.ts` for the
  current client shape and the official-result read/write paths.

## Required skills

- `ai/skills/supabase/README.md` — Supabase MCP (read-only) for
  schema queries, policy listing, type generation.
- `ai/skills/spec-driven/SKILL.md` for any non-trivial feature.

## Decision rules

- There are NO Server Actions and NO service-role wrappers: this is a
  client-side app. The browser holds only the public anon key; the
  `service_role` key never ships. Writes are made with the anon-keyed
  client and authorized purely by RLS.
- All user-owned data MUST carry an ownership column (`user_id`) and a
  matching RLS policy. Public-read tables still gate writes by role or
  owner.
- Admin-only writes (e.g. `official_results`) are gated by the
  `is_admin()` security-definer helper in `supabase/schema.sql` — not
  by anything client-side. The client merely calls `upsert`/`delete`;
  RLS rejects non-admins.
- Access modules in `src/supabase/` are thin: typed row mappers around
  the Supabase client, with explicit `OfficialRow`-style interfaces.
  Components call these helpers, never assemble raw queries inline.
- New tables or columns get a matching TypeScript interface in the
  access module (we map snake_case rows to camelCase). Keep the
  interface in sync with `supabase/schema.sql`.
- Migrations are SQL files under `supabase/migrations/`. Never modify a
  merged migration — write a new one — and mirror the change into
  `supabase/schema.sql`.
- Cascade behaviour is explicit (`on delete cascade / restrict /
set null`) and documented in the migration body.

## What this agent produces

- SQL migration file under `supabase/migrations/`, plus the matching
  update to `supabase/schema.sql`.
- Supabase access modules under `src/supabase/` with explicit row
  types and tests (Vitest).
- PR with the Risk Checklist's `Auth/RLS impact reviewed` ticked AND
  explained.

## Hand-off

- Any new policy or change to existing policies → `rls-auditor`
  before merge.
- New tests for the access module → `validator-qa` if the test
  surface is non-trivial.
- Schema change that requires data migration → `migration-runner`.
