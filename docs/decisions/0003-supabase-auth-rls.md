# 0003 Supabase: auth anônima + admin por role + RLS

## Status

Accepted

## Contexto

O app é majoritariamente client-side e precisa de pouca coisa de servidor:
guardar o **placar oficial** (que só o admin lança e todos veem ao vivo) e,
opcionalmente, o **cenário** de cada usuário. Não queremos cadastro com
e-mail/senha — o atrito mataria o uso "no bar". Mas precisamos de uma fronteira
de segurança real: ninguém além do admin pode escrever resultado oficial, e o
cenário de um usuário não pode vazar para outro.

## Decisão

Backend no **Supabase** (Postgres + Auth + Realtime), com a regra de acesso no
banco via **RLS** (`supabase/migrations/`):

- **Auth anônima** para usuários: cada visitante ganha um usuário sem cadastro.
  Um trigger cria o `profiles` no signup.
- **Admin por role**: `profiles.role in ('user','admin')`. Vira-se admin com um
  `UPDATE` manual. A checagem usa `public.is_admin()` (security definer, sem
  recursão de RLS).
- **RLS por tabela**:
  - `official_results` — leitura **pública**, escrita **só admin**
    (`for all using is_admin() with check is_admin()`); publicada no Realtime
    para empurrar o placar a todos.
  - `scenarios` — por usuário: lê quem é dono **ou** quando `is_public`;
    insert/update/delete só do próprio (`user_id = auth.uid()`).
  - `profiles` — leitura pública; só o dono escreve o próprio.
- **Segredos**: a `anon key` é pública por design e fica no cliente; a
  **`service_role` NUNCA** entra no front. Variáveis de ambiente são lidas
  **só** em `src/lib/env.ts` (ver ADR 0004); as do Supabase são **opcionais** —
  sem elas, o app roda 100% local (sem login/realtime).

## Consequências

- A segurança não depende do cliente: mesmo chamando a API direto, a RLS barra
  escrita de não-admin e leitura cruzada de cenário.
- Sem fricção de cadastro; o custo é que "identidade" é a sessão anônima
  (perdê-la perde o vínculo com cenários remotos).
- O front degrada com elegância: `supabase` é `null` quando não há env, e a UI
  marca "local" em vez de "ao vivo".
- Toda mudança de policy ou tabela passa pelo `rls-auditor` e por uma migração
  (ver `docs/playbooks/migration.md`).

## Alternativas

- **Auth com e-mail/senha ou OAuth** — descartado para o MVP: atrito alto para
  o caso de uso (acompanhar jogo com amigos).
- **Backend próprio (Node/API)** — descartado: Supabase entrega auth, RLS e
  Realtime sem servidor para manter.
- **Sem backend (tudo local)** — insuficiente: não dá placar oficial ao vivo
  compartilhado. Por isso o backend é opcional, não inexistente.
