# Testing: gotchas

Como testamos: **Vitest** + **Testing Library**. Sem Jest, sem MSW.

## 1. O ambiente padrão é Node; jsdom é opt-in por arquivo

`vite.config.ts` roda os testes em `environment: 'node'` — rápido e
isolado, ideal para o motor puro (`src/engine/`) e a camada de dados.
Um teste que toca o DOM (componentes React) declara, na **primeira
linha do arquivo**:

```ts
// @vitest-environment jsdom
```

Sem esse docblock o `render`/`screen` falha porque não há `document`.
É um custo por-arquivo de propósito: não pagamos jsdom nos milhares de
asserts do motor.

## 2. `globals: true` — não precisa importar `describe/it/expect`

Estão no escopo global. Ainda assim importamos `vi`, `describe`, etc.
explicitamente em vários arquivos por clareza; ambos funcionam.

## 3. jest-dom é registrado uma vez em `src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest';
```

Esse `setupFiles` roda nos dois ambientes. Em Node ele só registra os
matchers no `expect` (inócuo); em jsdom é o que dá
`toBeInTheDocument()`, `toBeDisabled()`, `toHaveValue()`, etc. O
cleanup entre testes é automático do `@testing-library/react`.

## 4. Componentes: `render` / `screen` / `userEvent`

Padrão de teste de componente (ver `src/components/__tests__/`):
prefira queries acessíveis (`getByRole`, `getByLabelText`) e
`@testing-library/user-event` para interação real. `fireEvent` é
aceitável para casos simples já em uso.

Mocks de Supabase: como não há servidor nem MSW, mocke o módulo
(`vi.mock('../../supabase/client')`) ou injete dados via store. Não
mocke a rede — o cliente Supabase é `null` quando não há env, então
componentes já lidam com o caso offline.

## 5. Integridade de dados é um gate separado: `npm run validate`

A correção dos JSONs estáticos (árvore do mata-mata bem-formada, Anexo
C com 495 combos, respeito ao `allowedGroups`) é verificada por
`npm run validate` (`scripts/validate.ts`, via `vite-node`), não pelos
testes unitários. É o que protege a fonte da verdade contra um JSON
malformado. A **ordem** (desempates) e a regressão do Anexo C contra a
referência oficial ficam nos testes do motor
(`src/engine/__tests__/`, `src/data/__tests__/annex-c-reference.test.ts`).

## 6. Coverage é opcional

`npm run test:coverage` (provider v8) está disponível, mas não há
threshold obrigatório nem gate de CI por cobertura. Cobrimos o que
importa (regra de classificação, desempates incl. recursão de H2H,
fusão oficial > seed > palpite, Anexo C, RLS, acessibilidade), não uma
métrica.

## 7. E2E (Playwright) é opcional/futuro

Não há suíte E2E hoje. Se adotarmos Playwright, ele cobre só o que um
browser real prova (smoke, jornadas críticas) — não substitui os
testes rápidos de motor/dados.
