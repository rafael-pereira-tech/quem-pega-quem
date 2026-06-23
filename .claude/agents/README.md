# .claude/agents/

Claude Code subagent definitions. Each file is a thin wrapper around
the canonical definition under `ai/agents/<name>.md`.

The wrapper carries the YAML frontmatter Claude Code needs (name,
description, model) plus a short body that:

1. Names the canonical file under `ai/agents/`.
2. Tells the subagent to read that file first.
3. Re-states the highest-stakes rules so they survive any read failure.

Edits to agent behaviour go to `ai/agents/<name>.md`, not here. This
directory is the binding, not the source.

## Mapping

| Subagent file           | Canonical source                  |
| ----------------------- | --------------------------------- |
| `dev-fe.md`             | `ai/agents/dev-fe.md`             |
| `supabase-be.md`        | `ai/agents/supabase-be.md`        |
| `reviewer.md`           | `ai/agents/reviewer.md`           |
| `validator-qa.md`       | `ai/agents/validator-qa.md`       |
| `rls-auditor.md`        | `ai/agents/rls-auditor.md`        |
| `design-implementer.md` | `ai/agents/design-implementer.md` |
| `adr-proposer.md`       | `ai/agents/adr-proposer.md`       |
| `migration-runner.md`   | `ai/agents/migration-runner.md`   |

## Model picks

- `opus` for reviewer, rls-auditor, adr-proposer, migration-runner —
  high judgement, lower volume.
- `sonnet` for dev-fe, supabase-be, validator-qa, design-implementer —
  default workhorse model.

Override per invocation if a specific task calls for it; the
frontmatter sets the default.
