# Security + privacy: gotchas

App client-side estático (React + Vite, deploy em Cloudflare Pages).
O modelo de ameaça é o de um SPA: **tudo no bundle é público**. A
autorização real mora na RLS do Supabase (ver
`ai/docs/supabase-and-rls.md`), não no front.

## 1. Env só via `src/lib/env.ts` (o ESLint força)

`src/lib/env.ts` é o **único** arquivo autorizado a ler
`import.meta.env`; o ESLint proíbe leituras diretas em qualquer outro
lugar, então o schema (zod) é a fonte única. Para uma var nova:

1. Adicione ao schema em `env.ts` (prefixo `VITE_`).
2. Espelhe em `.env.example`.
3. Importe `env` e leia `env.MINHA_VAR`.

Não adicione disables de lint por arquivo — a regra é o contrato.

## 2. Só vars `VITE_` chegam ao bundle — e isso é por design

O Vite só injeta variáveis com prefixo `VITE_`. As únicas que usamos são
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, **ambas públicas por
design**: a URL é o endpoint do projeto e a anon key é uma chave de
cliente protegida pela RLS. Vê-las no bundle não é vazamento.

## 3. A `service_role` NUNCA entra no front

A `service_role` key bypassa a RLS — é segredo de servidor. Este projeto
não tem servidor, então **ela simplesmente não existe no código**: não
há cliente service-role, não há var `service_role` no `env.ts`, e ela
não pode ganhar prefixo `VITE_`. Se alguém propor um cliente "admin de
verdade" no front, é vazamento — recuse. Operações privilegiadas são
feitas à mão no SQL Editor ou (no futuro) numa camada de servidor
dedicada.

## 4. Leitura pública não é desculpa pra vazar

`profiles` e `official_results` têm leitura pública via RLS (apelidos e
placares são públicos). Não coloque dado sensível nessas tabelas
contando que "o front não mostra" — qualquer um pode consultar com a
anon key. Se um campo sensível for necessário, a policy de SELECT
precisa mudar (ver `ai/docs/supabase-and-rls.md` §3).

## 5. Sem scripts de terceiros sem necessidade

Mantenha o bundle enxuto e sem tags de terceiros (analytics, widgets,
tag managers) a menos que haja necessidade clara e revisada. Menos
origens = menos superfície. Se um terceiro entrar, documente o porquê.

## 6. CSP / middleware: N/A neste projeto

Não há middleware nem cabeçalhos de resposta sob nosso controle no
código (Cloudflare Pages serve estáticos). Não há fluxo de nonce de CSP
nem rotas de servidor. Se um dia quisermos endurecer cabeçalhos
(CSP, HSTS), o lugar é a config do Cloudflare Pages (`_headers` ou
regras), e aí sim vale documentar aqui.
