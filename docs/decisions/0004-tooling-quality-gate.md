# 0004 Tooling e gate de qualidade

## Status

Accepted

## Contexto

Um projeto com regras de negócio críticas (desempate, Anexo C) e segredos
(Supabase) precisa de um chão de qualidade automático e barato, que rode igual
na máquina do dev e no CI, e que torne difícil cometer os erros que mais doem
aqui: vazar `import.meta.env`, quebrar o formato, baixar a cobertura das regras
ou subir dado inconsistente.

## Decisão

Stack de tooling enxuta sobre Vite + TypeScript:

- **ESLint flat** (`eslint.config.mjs`) + **typescript-eslint** + import-x +
  jsx-a11y + react-hooks/refresh + vitest/testing-library. `lint --max-warnings=0`.
- **Prettier** como formatador único (plugins: tailwindcss, packagejson).
- **Vitest** + Testing Library (jsdom para componentes, Node para o motor).
  **Não usamos Jest.**
- **Disciplina de ambiente**: `import.meta.env` é **proibido por lint** fora de
  `src/lib/env.ts` (regra `no-restricted-syntax`). O env é validado por zod num
  só lugar (ver ADR 0003).
- **`npm run check`** é o gate completo e a ordem é fixa:
  `format:check → lint → typecheck → test → build → audit`.
- **`npm run validate`** checa a integridade dos dados (árvore do mata-mata +
  Anexo C estrutural) — roda como job separado no CI.
- **simple-git-hooks**: `pre-commit` roda lint-staged (eslint --fix + prettier);
  `pre-push` roda typecheck.
- **CI** (`.github/workflows/ci.yml`): job `check` roda `npm run check`; job
  `validate` roda `npm run validate`. Node fixado em `.nvmrc` (>=20), npm.
- Deploy em **Cloudflare Pages**.

## Consequências

- O mesmo comando (`npm run check`) reproduz o CI localmente — sem surpresa.
- Vazamento de env, drift de formato e quebra de tipo/teste são pegos antes do
  merge; o hook de pre-commit conserta o que dá.
- Adicionar uma lib estrutural nova é uma decisão (ADR), não um `npm install`
  avulso — a stack é deliberadamente pequena (sem Next, sem i18n, sem shadcn).

## Alternativas

- **Jest** — descartado: o projeto é Vite; Vitest reusa a mesma config/transform
  e roda mais rápido.
- **Husky** — descartado em favor de simple-git-hooks (leve, sem dependências de
  shell extras).
- **Ler `import.meta.env` onde precisar** — descartado: espalha env e arrisca
  vazar segredo; centralizar em `env.ts` + proibir por lint é mais seguro.
