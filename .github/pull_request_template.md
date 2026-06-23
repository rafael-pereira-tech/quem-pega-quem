<!--
PR title shape: <type>(<scope>): <subject>
See ai/conventions/commits.md and ai/conventions/prs.md.

Stacked PR? Put `Stack info: Nth of M. Base is ...` in Summary, not
in the title.
-->

## Summary

-

## Test plan

<!-- Suggested gates: `npm run check` and, if you touched a rule or data, `npm run validate`. -->

-

## Risk Checklist

<!--
Untick boxes that do not apply and say so. A ticked box without an
explanation here or in Notes is worse than an unticked one — the
latter at least flags a gap. See ai/conventions/prs.md.
-->

- [ ] Segredos/env: sem `service_role` no cliente; env só via `src/lib/env.ts`
- [ ] RLS / papel admin revisado
- [ ] Motor / Anexo C revalidado (`npm run validate`) se tocou regra ou dados
- [ ] Acessibilidade verificada
- [ ] Dependências (`npm audit`)

## Notes

-
