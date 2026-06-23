# Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/) with
project-specific scopes.

## Format

```
<type>(<scope>): <subject>

[optional body explaining WHY, wrapped at ~72 cols]

[optional footer(s)]
```

- `type` — required, lower-case, one of the list below.
- `scope` — optional, lower-case, one of the list below (or new with a
  short comment in the PR description).
- `subject` — imperative mood, lower-case, no trailing period, ≤ 72
  chars.
- Body explains **why** (not _what_ — the diff already says that).
- Footers carry `Refs: #N`, `Closes: #N`, `BREAKING CHANGE: ...`, and
  `Co-Authored-By: ...`.

## Types

| Type       | When                                                          |
| ---------- | ------------------------------------------------------------- |
| `feat`     | New user-facing behavior or new capability                    |
| `fix`      | Bug fix that changes behavior                                 |
| `chore`    | Repo or toolchain change with no user-visible effect          |
| `docs`     | Documentation only (README, ADRs, playbooks, `ai/`)           |
| `refactor` | Code change that neither fixes a bug nor adds a feature       |
| `perf`     | Performance improvement                                       |
| `test`     | Adding or fixing tests, no production code change             |
| `ci`       | CI configuration only (`.github/workflows/`)                  |
| `build`    | Build-system / dependency change                              |
| `style`    | Formatting only (run by Prettier; rarely a standalone commit) |
| `revert`   | Reverts a prior commit (reference its SHA in the body)        |

## Scopes

Start with this set. Add new scopes as the codebase grows — propose them
in the PR description so reviewers can spot drift.

| Scope      | Covers                                                       |
| ---------- | ------------------------------------------------------------ |
| `engine`   | Pure engine (`src/engine/`): classification + tiebreak rules |
| `groups`   | Group-stage standings and ordering                           |
| `bracket`  | Round-of-32 bracket / knockout tree wiring                   |
| `thirds`   | Best-third-placed teams ranking and selection                |
| `annexc`   | Annex C cross-pairing (495 combos) + reference data          |
| `ui`       | React components and screens (`src/components/`, `src/app/`) |
| `data`     | Data layer: JSON fixtures, loaders, Zod schemas              |
| `supabase` | Supabase client, Realtime, migrations, server wiring         |
| `auth`     | Anonymous auth / session / admin role gating                 |
| `rls`      | Supabase RLS policies and ownership boundary code            |
| `admin`    | Admin surface (official-result entry)                        |
| `a11y`     | Accessibility-focused change                                 |
| `deps`     | Dependency add / update / remove                             |
| `lint`     | ESLint / Prettier config                                     |
| `test`     | Vitest / Playwright config (not the tests themselves)        |
| `ci`       | Workflow files                                               |
| `adr`      | Architecture Decision Records                                |
| `design`   | `design/`, `design/v3/`, and design-token mapping            |
| `ai`       | `ai/`, `.claude/`, `.cursor/rules/`, Codex/OpenCode config   |

If a change spans many scopes, drop the scope rather than chain them.
`fix(engine,ui): ...` is not allowed; prefer `fix: ...` and explain
the breadth in the body.

## Subject phrasing

| Good                                              | Bad                     |
| ------------------------------------------------- | ----------------------- |
| `fix(engine): recurse H2H when teams stay tied`   | `bug fix`               |
| `feat(thirds): rank the eight best third placers` | `Added thirds ranking`  |
| `docs(adr): 0010 — Zustand for live match state…` | `Update docs`           |
| `chore(deps): add zod`                            | `add some dependencies` |

## Body — what belongs there

- The _why_. The user need, the bug symptom, the constraint that forces
  the choice.
- The non-obvious trade-off. The alternative considered and rejected.
- Pointers to ADRs or issues that motivate the change.

What does **not** belong in the body:

- A restatement of the diff.
- "This commit adds X and Y" — that is the subject's job.

## Footers

- `Refs: #N` — related issue (no auto-close).
- `Closes: #N` — closes the issue on merge.
- `BREAKING CHANGE: <description>` — required when shipping a breaking
  change; also bumps the type to `feat!:` or `fix!:` per Conventional
  Commits.
- `Co-Authored-By: Name <email>` — for pair / AI contributions.

## Co-authoring with AI

When an AI agent (Claude Code, Cursor, Codex, OpenCode, ...) drafted
the change, add a `Co-Authored-By:` footer naming the tool. Keep the
review responsibility on the human author — the footer is attribution,
not endorsement.

## Examples

```
feat(admin): gate official-result entry behind admin role

Adds an admin-only card-entry surface. Anonymous visitors see the
read-only simulation; only the admin role may write official scores.
Writes go through RLS, not a client check — this is just the UI gate.

Refs: #34
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

```
fix(engine): recurse head-to-head when a sub-group stays tied

Two teams level on points were ordered by goal difference before the
2026 rules' head-to-head step ran, flipping a real bracket. Applying
H2H first — and recursing when three-plus teams remain tied — matches
FIFA. Adds a Vitest regression case from the failing fixture.

Closes: #41
```

```
chore(annexc): revalidate Annex C reference against FIFA

Re-ran `npm run validate` after a fixture refresh; the 495-combo
cross-pairing still matches `data/anexo-c.reference.json`. No engine
change — this records the green run.
```

## Local gates (pre-commit / pre-push)

The repo installs git hooks via `simple-git-hooks` on `npm ci` /
`npm install` (postinstall script). The hooks are:

- **pre-commit** — `lint-staged` runs Prettier + ESLint `--fix` on
  staged files. Fast (<5s typical).
- **pre-push** — `npm run typecheck`. Catches type failures before
  CI runs them.

**Bypass policy**: `--no-verify` and `SKIP_SIMPLE_GIT_HOOKS=1` are
allowed when justified. They are not silent — the bypass should be
mentioned in the PR description so the reviewer can spot the
intentional skip. Habitual bypassing is a smell; if the hook keeps
catching issues, fix the issue, don't dodge.

Hooks **do not** replace CI. CI runs the full `check` script. The
hooks exist to shorten the local feedback loop and to keep PRs
clean of trivial formatting churn.
