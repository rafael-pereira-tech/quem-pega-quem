# Supabase + RLS: gotchas

Schema, RLS e clientes do backend. Fonte da verdade do schema:
`supabase/schema.sql` (espelhado em `supabase/migrations/`).

## 1. Três tabelas, três modelos de acesso

Todas com RLS habilitada (`enable row level security`):

- **`profiles`** — 1:1 com `auth.users`. Leitura **pública** (apelidos),
  cada um insere/atualiza só o próprio (`user_id = auth.uid()`). Criada
  automaticamente no signup (inclusive anônimo) pelo trigger
  `handle_new_user`.
- **`official_results`** — placar oficial por jogo. Leitura **pública**,
  escrita **só admin** (`for all using (is_admin()) with check
(is_admin())`). É a única tabela exposta no Realtime.
- **`scenarios`** — palpite/chave por usuário. Lê se `is_public` OU dono;
  insere/atualiza/deleta só o dono.

Ao mexer numa policy, releia o modelo da tabela antes — os três são
deliberadamente diferentes.

## 2. `is_admin()` é `security definer` para evitar recursão de RLS

Checar "este usuário é admin?" exige ler `profiles`, que tem RLS. Uma
policy que consultasse `profiles` direto entraria em recursão. Por isso
`public.is_admin()` é `security definer` com `search_path = public`:
ela lê a tabela ignorando RLS e devolve só um boolean. A policy
`official_write` chama `is_admin()`, nunca faz subselect em `profiles`.

Não reescreva uma policy de admin como subquery em `profiles` — use
`is_admin()`.

## 3. Leitura pública não vaza nada privado

`profiles` e `official_results` têm `select using (true)` de propósito:
apelidos e placares oficiais são públicos. Não há campo sensível
nessas tabelas. Se um dia entrar (ex.: e-mail no profile), a policy de
SELECT precisa parar de ser `true` — não confie em "o front não
mostra".

## 4. `official_results` é admin-write; cuidado ao adicionar caller

A escrita passa por `src/supabase/official.ts` (`upsertOfficial` /
`deleteOfficial`). Funciona para qualquer cliente, mas a RLS rejeita
quem não é admin — a autorização é no banco, não no botão escondido da
UI. `updated_by` registra quem gravou. Qualquer novo caminho de escrita
em `official_results` é mudança digna de revisão (toca dado oficial).

## 5. A `service_role` não existe neste app

Não há cliente service-role no front (seria um vazamento — ver
`ai/docs/security-and-privacy.md`). Toda escrita passa pela RLS como o
usuário logado. Operações administrativas pontuais (ex.: promover
alguém a admin) são feitas à mão no SQL Editor, fora do código:

```sql
update public.profiles set role = 'admin' where user_id = '<uuid>';
```

## 6. Auth anônima é pré-requisito

`useSession` faz `signInAnonymously()` quando não há sessão, então o
usuário ganha um `user_id` (e um `profiles` via trigger) sem login. Isso
só funciona com **"Anonymous sign-ins" habilitado** em Authentication >
Providers no projeto Supabase. Sem isso, o app cai no modo offline
(cliente `null`, sem realtime/cenários).

## 7. Cliente é `null` sem env — e está tudo bem

`src/supabase/client.ts` exporta `supabase: SupabaseClient | null`: é
`null` quando faltam `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. Todo
caller checa (`if (!supabase) return ...`). O app roda 100%
client-side nesse caso. Não assuma cliente não-nulo num módulo novo.

## 8. Realtime: só `official_results` está na publicação

`alter publication supabase_realtime add table public.official_results`.
`useOfficialSync` assina `postgres_changes` nessa tabela e refaz o fetch
a cada evento — quando o admin grava um placar, todos os clientes
recalculam a chave sozinhos. Se quiser realtime em outra tabela (ex.:
`scenarios` compartilhados), adicione-a à publicação **e** o cliente
correspondente.
