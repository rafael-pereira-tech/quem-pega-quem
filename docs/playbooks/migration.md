# Playbook: Migração (Supabase)

Use para mudar schema ou dados no Postgres do Supabase: nova tabela/coluna,
rename/drop, ajuste de policy RLS, correção em massa de linhas de usuário.
Conduzido pelo `migration-runner`; toda mudança de policy passa pelo
`rls-auditor`.

## Passos

1. **Documente o objetivo** — o que muda, a superfície afetada (tabelas,
   policies, código que lê/escreve) e o **caminho de rollback**.
2. **Crie a migração** em `supabase/migrations/` com nome ordenável por
   timestamp (`AAAAMMDDHHMMSS_descricao.sql`), seguindo o estilo do
   `20260622120000_init.sql`: **idempotente** (`if not exists`,
   `drop policy if exists` antes de `create policy`, `create or replace`).
3. **RLS junto da tabela.** Toda tabela com dado de usuário nasce com
   `enable row level security` e suas policies no mesmo arquivo. Releia o
   ADR 0003: `official_results` (admin-write/public-read), `scenarios`
   (por usuário), checagem de admin via `public.is_admin()`. Acione o
   `rls-auditor`.
4. **Mantenha `schema.sql` em dia.** `supabase/schema.sql` reflete o estado
   atual; a migração é o que o `supabase db push` aplica — os dois batem.
5. **Não misture.** Migração mecânica de schema/dado em commits separados de
   mudança de produto.
6. **Aplicar e validar.** Rode `supabase db push` (ou cole no SQL Editor).
   Confirme que a RLS barra o caso negativo (não-admin não escreve oficial; um
   usuário não lê o cenário privado de outro) e que `npm run check` passa.

## Pontos de atenção

- Realtime: se uma tabela precisa empurrar mudança para os clientes, adicione-a
  à publication `supabase_realtime` (como `official_results` faz) — de forma
  idempotente.
- Segredo: nenhuma migração ou código de migração usa `service_role` no front.

## Definition of Done

- Comportamento preservado ou mudado de propósito; risco de rollback documentado.
- Migração idempotente, com RLS, aplicada com sucesso.
- Caso negativo de RLS verificado; `npm run check` passa.
