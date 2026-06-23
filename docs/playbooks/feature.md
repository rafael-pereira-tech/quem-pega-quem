# Playbook: Feature

Use ao adicionar comportamento novo. O fluxo é **faseado e com checkpoint
humano** — cada fase produz um artefato revisável antes de passar para a
próxima. Veja a skill `ai/skills/spec-driven/SKILL.md` para o detalhe.

Para trabalho trivial (typo, one-liner de escopo óbvio), pule este playbook e
suba direto. Bug segue [`bugfix.md`](./bugfix.md); migração segue
[`migration.md`](./migration.md).

```
SPECIFY ──▶ PLAN ──▶ IMPLEMENTAR ──▶ TESTAR ──▶ CHECK ──▶ PR
   └────────── revisão humana nas transições ──────────┘
```

## 1. Specify

O que é sucesso, antes de escrever código:

- **Objetivo** — o resultado para o usuário em 1–2 frases.
- **Superfície** — que telas/abas, scripts ou operações de admin passam a
  existir. É mobile, desktop ou os dois?
- **Toca regra?** — se a feature mexe em desempate, terceiros, Anexo C ou na
  fusão de placares, ela mexe no **motor** (`src/engine`) e/ou em dados — diga
  isso. Releia os ADRs 0001 e 0002.
- **Toca backend?** — se cria/altera tabela, coluna ou policy, há migração e
  RLS (ADR 0003) — chame o `rls-auditor`.
- **Fora de escopo** — o que esta feature explicitamente NÃO faz.

## 2. Plan

- **Módulos afetados** — liste arquivos/pastas. Use `docs/reference/README.md`
  para saber o que vive onde.
- **Onde entra a regra** — regra nova vai para `src/engine`, coberta por teste;
  nunca dentro de componente. Dado novo passa por `src/data/schema.ts` (zod).
- **Dependências/ordem** — se não cabe num diff coerente, proponha uma pilha
  de PRs.
- **ADR necessário?** — qualquer escolha estrutural (lib nova, mudança de
  decisão aceita) vira ADR antes — acione `adr-proposer`.
- **Riscos** — o que pode quebrar; o que NÃO vamos testar.

## 3. Implementar

Execute na ordem do plano, pelo agente certo:

- `dev-fe` — componentes, hooks, estado (Zustand), telas.
- `supabase-be` — schema/repos/serviços atrás da fronteira do Supabase.
- `migration-runner` — quando há migração de schema/dado existente.
- `rls-auditor` — **antes** de qualquer passo que toque policy/ownership.
- `design-implementer` — quando há protótipo de design correspondente.

Se a implementação revela que o plano estava errado, **pare** e volte ao Plan.
Não force.

## 4. Testar

Adicione teste para o que importa (ver `docs/reference/README.md` › Testes):

- **Motor/regra** — Vitest em Node. Desempate (incl. recursão de h2h),
  terceiros, Anexo C, montagem da chave.
- **Fusão** — `buildInput` (oficial > seed > palpite).
- **Componente** — Vitest + Testing Library em jsdom
  (`// @vitest-environment jsdom` no topo), com queries semânticas e a11y.
- **Dados** — `npm run validate` se mexeu em `data/`.

## 5. Check

`npm run check` (format → lint → typecheck → test → build → audit) tem de passar.
Se mexeu em `data/`, rode também `npm run validate`.

## 6. PR

Abra o PR seguindo `ai/conventions/prs.md`. O corpo explica: o que mudou; por
quê; como validou; e se toca **dados oficiais, RLS, segredos, o motor ou
acessibilidade** (esses exigem atenção extra do revisor).

## Definition of Done

- `npm run check` (e `npm run validate` quando aplicável) passam.
- Regra nova tem teste que falha sem ela.
- Nada de `import.meta.env` fora de `src/lib/env.ts`; nenhuma `service_role` no
  front.
- Spec/plano permanecem no corpo do PR para rastreabilidade.
