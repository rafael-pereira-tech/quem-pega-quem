# Agents

Role-scoped agent definitions. An agent is a prompt + behavioural
contract that a tool (Claude Code, Cursor, Codex CLI, OpenCode, ...)
loads to take on a specific role.

## Matrix — which agent for which task

| Task                                                         | Agent                | Layer    |
| ------------------------------------------------------------ | -------------------- | -------- |
| Build a React component / Zustand store / hook               | `dev-fe`             | generic  |
| Add a table / repo / migration / RLS policy                  | `supabase-be`        | generic  |
| Review an open PR for code + arch                            | `reviewer`           | generic  |
| Add tests (unit / component) or a11y / data-integrity checks | `validator-qa`       | generic  |
| Touch RLS policies, ownership boundary, or admin-only writes | `rls-auditor`        | specific |
| Implement a screen from `design/` (handoffs)                 | `design-implementer` | specific |
| A decision was made in conversation; draft the ADR           | `adr-proposer`       | specific |
| Run a schema / data migration                                | `migration-runner`   | specific |

Generic agents handle the bulk of feature work. Specific agents kick in
for high-stakes or low-frequency flows where the cost of getting it
wrong is high. Specific agents preempt generic ones when both could
apply — e.g. a feature that touches RLS is owned by `rls-auditor`, not
`supabase-be`, until the policy is settled.

## Universal rules

Every agent in this directory operates under these constraints (see
**AGENTS.md** → Non-Negotiables for the canonical text):

1. Read **AGENTS.md** (Non-Negotiables) before doing anything.
2. Check **`docs/decisions/`** for relevant ADRs. Don't suggest
   alternatives to an Accepted decision without surfacing it first.
3. Follow **`ai/conventions/`** for commits, PRs, and branches.
4. Keep PRs small and reviewable. If the work doesn't fit in one
   coherent diff, propose a stacked-PR plan instead of one big change.
5. **The engine is pure** (`src/engine/`): no React, DOM, or IO.
   Classification and tiebreak rules live there and are test-covered.
6. **The 2026 tiebreakers and Annex C (495 combos) are the source of
   truth**, validated against the official FIFA regulation
   (`data/anexo-c.reference.json`). Never change them without
   re-running `npm run validate`.
7. **Secrets never reach the client.** The Supabase anon key is public
   by design; the `service_role` key NEVER ships to the front end. Env
   vars are read only in `src/lib/env.ts`.
8. **Respect RLS and the admin role.** Official-result writes are
   admin-only via the Supabase client; reads are public; each user's
   guesses are local/per-user.
9. Add tests for what matters (tiebreaks incl. H2H recursion, score
   merge, Annex C, RLS, a11y).
10. Co-author attribution: include a `Co-Authored-By:` footer naming the
    tool that drafted the change.

## File format

Each agent file follows this template:

```markdown
# <Agent name>

## Role

One paragraph.

## When to invoke

- Bullet triggers.

## When NOT to invoke

- Anti-triggers (hand off to which agent instead).

## Required reading

- File paths. Read these before touching code.

## Decision rules

- Domain-specific guidance.

## What this agent produces

- Concrete artefact.

## Hand-off

- Who picks up after.
```

## Tool-specific bindings

Agents in this directory are the source of truth. Tool-specific files
are thin pointers — see `.claude/agents/`, `.cursor/rules/*.mdc`, and
`opencode.json`. Edit the file under `ai/agents/`, not the pointer.

OpenAI Codex CLI reads `AGENTS.md` at the repo root and picks up the
`Where To Look First` section automatically; it does not need a
per-agent file.
