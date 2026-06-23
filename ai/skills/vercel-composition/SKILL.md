---
name: vercel-composition-patterns
description: Use this skill when designing component APIs that risk prop proliferation, or when refactoring a component that has grown a long prop list. Teaches compound-component patterns and state-management strategies.
source: https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns
pinned: 2026-05-17
---

Vercel-curated patterns for React component composition — compound
components, render props (rare), slots, and state-management
strategies that avoid the "10-prop monster" anti-pattern.

## When to invoke

- A component you are about to write has ≥ 6 props.
- A component you are refactoring has ≥ 8 props and they aren't
  all primitive customization knobs.
- You are about to introduce a new state shape that two siblings
  read AND write.
- You are deciding between "container with many props" vs "compound
  component" for a UI piece.

## When NOT to invoke

- The component is genuinely a leaf primitive (Button, Input).
  Compound components for primitives are over-engineering.
- The props are all primitives (color, size, disabled). Composition
  helps for _structural_ growth, not styling growth.

## Hand-off

- `dev-fe` is the primary consumer.
- `design-implementer` — when translating a complex composite from
  the design handoff, compound patterns are often the right shape
  (e.g. `<Card>`, `<Card.Header>`, `<Card.Body>`).

## Reaching upstream content

- https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns
