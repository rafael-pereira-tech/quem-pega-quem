---
name: vercel-web-design-guidelines
description: Use this skill when reviewing or writing web UI for accessibility, performance, and UX defaults. 100-plus rules covering focus states, forms, animation, i18n, motion preferences, and the "table-stakes" of professional web interfaces.
source: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
pinned: 2026-05-17
---

Vercel's audit rule-set for web UI quality. Complements the
`impeccable` skill (which targets visual design system enforcement).
This one targets functional defaults: focus, form validation,
animation respectfulness, etc.

## When to invoke

- Reviewing a PR that adds a new interactive UI surface.
- Writing a form, modal, drawer, or any flow with state transitions.
- Auditing an existing component for "missing the obvious" — the
  rules in this skill flag specifically those.

## What it does NOT do

- Visual design system enforcement (impeccable does that).
- Specific Next/RSC patterns (vercel-react-best-practices does that).
- Component composition (vercel-composition-patterns does that).

## Hand-off

- `dev-fe` for the implementation.
- `validator-qa` to convert findings into automated tests where
  applicable.
- `accesslint` for runtime DOM-level a11y audit on top.

## Reaching upstream content

- https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
