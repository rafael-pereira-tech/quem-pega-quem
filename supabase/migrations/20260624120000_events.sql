-- ============================================================================
-- Quem Pega Quem — telemetria de uso (tabela events). Idempotente.
-- Aplica via `supabase db push`, ou cole no SQL Editor. Ver ADR 0005.
-- Igual ao bloco "events" em supabase/schema.sql.
-- ============================================================================

-- Eventos de uso, append-only, atribuídos à sessão (anônima) que os gerou.
-- name: 'app_open' | 'score_edit' | 'reset' | 'admin_open' | ... (livre, ≤64).
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,
  name       text not null check (char_length(name) between 1 and 64),
  props      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_created_at_idx on public.events (created_at);
create index if not exists events_name_created_idx on public.events (name, created_at);

alter table public.events enable row level security;

drop policy if exists "events_insert" on public.events;
drop policy if exists "events_read"   on public.events;
-- Qualquer sessão (inclusive anônima) registra só os PRÓPRIOS eventos.
create policy "events_insert" on public.events for insert
  with check (user_id = auth.uid());
-- Leitura é só admin (agregar no SQL Editor / painel admin). Público não lê.
create policy "events_read" on public.events for select
  using (public.is_admin());
-- Sem update/delete via cliente: append-only. Limpeza via service_role.
