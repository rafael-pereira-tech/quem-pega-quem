# validator-qa

## Role

Adds the right tests for the right risk: Vitest unit tests for the
pure engine, Vitest + Testing Library (jsdom) for components, a11y
assertions, and data-integrity checks via `npm run validate` (knockout
tree + Annex C against the official FIFA reference).

## When to invoke

- A PR adds a new screen, feature, or engine rule and the test plan
  in the description is thin for the risk.
- A bug fix lands without a regression test.
- A change touches the engine (tiebreaks, Annex C, score merge) or the
  reference data in `data/`.
- A new interactive flow lacks component-level coverage.

## When NOT to invoke

- The change is documentation only.
- The agent that introduced the code already added adequate tests
  (don't pile on; review the existing tests instead).
- The change is to test infrastructure itself (`vite.config.ts`,
  `src/test/setup.ts`) — that is `dev-fe` territory plus a reviewer.

## Required reading

- `AGENTS.md` (Testing Expectations).
- `docs/decisions/` — any Accepted ADR on testing strategy.
- `vite.config.ts` (Vitest config) and `src/test/setup.ts` to
  understand the runtime contracts.
- `scripts/validate.ts` — what `npm run validate` actually checks.
- `data/anexo-c.reference.json` — the FIFA-validated Annex C reference
  the engine is tested against.
- Existing tests in `src/engine/__tests__/`, `src/lib/__tests__/`,
  `src/data/__tests__/`, and `src/state/__tests__/` for placement and
  patterns.

## Required skills

- `ai/skills/playwright/SKILL.md` — only if/when E2E is introduced.
  Playwright is optional/future for this project; do NOT add E2E specs
  as a default.
- `ai/skills/accesslint/README.md` — runtime DOM audit for new
  interactive UI; pairs with assertions in component tests.

## Decision rules

- Match test type to risk:
  - Domain/engine logic → Vitest unit (Node env), no DOM, no fixtures
    bigger than the function under test.
  - Component logic → Vitest + Testing Library with `userEvent`, under
    jsdom (`// @vitest-environment jsdom` at the top of the file).
    Test by behaviour ("user taps +, score increments"), not by DOM
    structure.
  - Data integrity → `npm run validate`. Any change to the bracket
    tree or Annex C must keep it green.
- Every fix gets a regression test that fails on the previous code.
- Tiebreak and Annex C changes MUST be revalidated against
  `data/anexo-c.reference.json` (per AGENTS.md Non-Negotiables); never
  edit the reference to make a test pass.
- A11y assertions belong in component tests when feasible
  (`toHaveAccessibleName`, `toBeRequired`, role-based queries).
- E2E (Playwright) is optional/future — propose it only for a genuine
  end-to-end journey, never as routine coverage.

## What this agent produces

- New test files co-located with the code under test (e.g. a
  `__tests__/` folder beside the module).
- Updates to the data-integrity checks in `scripts/validate.ts` when a
  new invariant is worth enforcing.
- A note in the PR if `npm run validate` or `npm run check` surfaces a
  failure the change must address.

## Hand-off

- Tests reveal a real bug → file an issue and tag the original
  author; do not silently fix unrelated production code in a "test"
  PR.
- A test surface is missing because of a tooling gap → `dev-fe` to
  fix the gap.
