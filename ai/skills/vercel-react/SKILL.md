---
name: vercel-react-best-practices
description: Use this skill when writing or reviewing React / Next.js code that affects bundle size, rendering performance, or data fetching. Forty-plus rules from Vercel Engineering covering App Router patterns, RSC vs client splits, image optimization, and edge runtime considerations.
source: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
pinned: 2026-05-17
---

Vercel Engineering's React + Next.js performance rules, vendored by
reference (browse upstream for the full rule set). Most rules align
with what `dev-fe` agent already does; this skill adds the
empirically-validated edge cases that come from running Vercel-scale
production.

## When to invoke

- Reviewing a PR that adds a large dependency or a heavy client
  component.
- Diagnosing a slow render or large bundle.
- Choosing between Server Components, Client Components, and
  Server Actions for a given feature.
- Setting `dynamic = 'force-static'` / `'force-dynamic'` /
  `revalidate` on a route.
- Working with `next/image`, `next/font`, `next/script`.

## Hand-off

- `dev-fe` is the primary consumer.
- `reviewer` consults when judging "is this the right server/client
  split?" or "is this `'use client'` necessary?".

## Reaching upstream content

- https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
- Browse upstream for the full 40+ rule list. Update `pinned` when
  the rule set shifts significantly.
