-- ============================================================================
-- Quem Pega Quem — schema + RLS (migration). Idempotente: pode rodar de novo.
-- Aplica via `supabase db push`, ou cole no SQL Editor.
-- Depois: habilite "Anonymous sign-ins" (Auth > Providers) e vire admin com o
-- UPDATE no fim. Igual ao supabase/schema.sql (este é o que o db push aplica).
-- ============================================================================

-- 1:1 com auth.users. Papel admin/user + apelido público.
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nickname   text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Resultado OFICIAL por jogo (grupos e mata-mata). Admin escreve, todos leem.
create table if not exists public.official_results (
  match_id   text primary key,
  phase      text not null check (phase in ('group', 'knockout')),
  home_goals int,
  away_goals int,
  home_pens  int,
  away_pens  int,
  cards      jsonb,
  locked     boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Cenário/chave de cada usuário. Compartilhável por id quando is_public.
create table if not exists public.scenarios (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null default 'Meu cenário',
  data       jsonb not null default '{}'::jsonb,
  is_public  boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists scenarios_user_id_idx on public.scenarios(user_id);

-- Checagem de admin sem recursão de RLS (security definer).
create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where user_id = auth.uid() and role = 'admin'
  );
$$;

-- Row Level Security
alter table public.profiles          enable row level security;
alter table public.official_results  enable row level security;
alter table public.scenarios         enable row level security;

drop policy if exists "profiles_read"   on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_read"   on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (user_id = auth.uid());
create policy "profiles_update" on public.profiles for update using (user_id = auth.uid());

drop policy if exists "official_read"  on public.official_results;
drop policy if exists "official_write" on public.official_results;
create policy "official_read"  on public.official_results for select using (true);
create policy "official_write" on public.official_results for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "scenarios_read"   on public.scenarios;
drop policy if exists "scenarios_insert" on public.scenarios;
drop policy if exists "scenarios_update" on public.scenarios;
drop policy if exists "scenarios_delete" on public.scenarios;
create policy "scenarios_read"   on public.scenarios for select using (is_public or user_id = auth.uid());
create policy "scenarios_insert" on public.scenarios for insert with check (user_id = auth.uid());
create policy "scenarios_update" on public.scenarios for update using (user_id = auth.uid());
create policy "scenarios_delete" on public.scenarios for delete using (user_id = auth.uid());

-- Cria o profile automaticamente no signup (inclusive anônimo).
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(user_id) values (new.id) on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Realtime: clientes recebem o placar oficial assim que o admin grava (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'official_results'
  ) then
    alter publication supabase_realtime add table public.official_results;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Vire admin depois de logar uma vez (pegue o uuid em Authentication > Users):
--   update public.profiles set role = 'admin' where user_id = '<seu-uuid>';
-- ---------------------------------------------------------------------------
