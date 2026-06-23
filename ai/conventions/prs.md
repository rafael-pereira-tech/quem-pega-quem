# Pull request conventions

## Title

The PR title follows the same shape as a commit subject:

```
<type>(<scope>): <subject>
```

See [commits.md](./commits.md) for the type / scope tables and subject
phrasing. The squash-merge commit reuses this title verbatim, so it
must stand alone.

If the PR is part of a stack, do **not** put `[1/N]` in the title — put
it in the description (see below). Title stays clean.

## Body

Use this template (the GitHub PR template at
`.github/pull_request_template.md` mirrors it):

```markdown
## Summary

- 1–3 bullets describing what changed and why
- Reference ADRs / issues that motivate the change

## Test plan

- Concrete commands and outcomes the reviewer can replicate
- E.g. `npm run check` passes locally; `npm run validate` re-validates
  the engine + Annex C; `npm test` covers the touched logic

## Risk Checklist

- [ ] Secrets/env: no `service_role` in the client; env read only via `src/lib/env.ts`
- [ ] RLS / admin role reviewed
- [ ] Engine / Annex C revalidated (`npm run validate`) if a rule or data changed
- [ ] Accessibility impact checked
- [ ] Dependencies reviewed (`npm run audit`)

## Notes

- Anything that doesn't fit above: follow-up TODOs, known gaps,
  reviewer asks
```

## Stacked PRs

When a change is too large or too uneven to review as one PR, stack
small PRs end-to-end. Each PR's base branch is the previous PR's branch
(not `main`).

Conventions:

- Branch names mirror the eventual merge order: `chore/prettier`,
  `chore/test-infrastructure`, etc. Don't number them — the dependency
  is encoded in the base branch, not the name.
- The Summary section explicitly states the stack position:
  > Stack info: 2nd of 4. Base is `chore/prettier-and-cleanup` (#18).
  > Merge that first so the diff stays clean.
- Each PR's `Test plan` only validates that PR's slice, not the whole
  stack.
- The top-of-stack PR's description links to all downstream PRs.

When a base PR merges:

- Rebase the next PR onto `main` (`git rebase --onto main <old-base>`).
- GitHub will update the diff once the new base is pushed.
- Don't force-push to a base that other people are reviewing — wait for
  acknowledgement first.

## Risk Checklist — how to use it

The Risk Checklist is not paperwork. Each tickbox maps to a real
project constraint (see `AGENTS.md` Non-Negotiables):

- **Secrets/env** — the Supabase `service_role` key NEVER ships to the
  client; the anon key is public by design. Environment variables are
  read only in `src/lib/env.ts` (ESLint forbids `import.meta.env`
  anywhere else). Flag any change that touches env wiring.
- **RLS / admin role** — writing an official result is admin-only;
  reads are public; the user's guess is local/per-user. A new policy
  or ownership boundary must have a contract test that fails on the
  pre-change policy.
- **Engine / Annex C** — the 2026 tiebreak rules and the Annex C
  495-combo cross-pairing are the source of truth, validated against
  FIFA via `data/anexo-c.reference.json`. If you touched a rule or its
  data, re-run `npm run validate` and say so here.
- **Accessibility** — interactive features need keyboard and
  screen-reader paths, not just mouse.
- **Dependencies** — `npm run audit` must stay clean at the `high`
  level. Note any add / update / removal and why.

A ticked box without an explanation in the Summary or Notes is worse
than an unticked box — the latter at least flags a gap. Untick boxes
that don't apply and say so; don't tick to make the diff look clean.

## When NOT to open a PR

- Trivial inline fixes can wait for the next batch — don't open three
  PRs for three typos in `docs/`.
- WIP that isn't ready for review goes on a branch without a PR until
  it is. Draft PRs are fine if reviewers actually want early eyes.

## Review expectations

Reviewers should explain, in order:

1. Whether the change matches the PR's stated intent.
2. Whether the Risk Checklist is honest.
3. Whether the test plan is sufficient for the risk.
4. Whether the code is the simplest change that meets (1)–(3).

Style nits are last and optional.
