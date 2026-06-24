-- ============================================================================
-- Quem Pega Quem — schema + RLS do Supabase
-- Rode no SQL Editor do projeto. Depois habilite "Anonymous sign-ins" em
-- Authentication > Providers, e torne-se admin com o UPDATE no fim do arquivo.
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
  home_pens  int,        -- só mata-mata
  away_pens  int,
  cards      jsonb,      -- { "<teamId>": { yellow, secondYellow, directRed, yellowAndDirectRed } }
  locked     boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Cenário/chave de cada usuário. Compartilhável por id quando is_public.
create table if not exists public.scenarios (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null default 'Meu cenário',
  data       jsonb not null default '{}'::jsonb,  -- { groupScores, koScores }
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

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.official_results  enable row level security;
alter table public.scenarios         enable row level security;

-- profiles: leitura pública (apelidos), cada um cuida do próprio
create policy "profiles_read"   on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (user_id = auth.uid());
create policy "profiles_update" on public.profiles for update using (user_id = auth.uid());

-- official_results: leitura pública, escrita só admin
create policy "official_read"  on public.official_results for select using (true);
create policy "official_write" on public.official_results for all
  using (public.is_admin()) with check (public.is_admin());

-- scenarios: lê se público ou dono; escreve só o dono
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

-- Realtime: clientes recebem o placar oficial assim que o admin grava.
alter publication supabase_realtime add table public.official_results;

-- ---------------------------------------------------------------------------
-- Telemetria de uso (ver ADR 0005). Append-only; insert do próprio, read admin.
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,
  name       text not null check (char_length(name) between 1 and 64),  -- 'app_open' | 'score_edit' | ...
  props      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_created_at_idx on public.events (created_at);
create index if not exists events_name_created_idx on public.events (name, created_at);

alter table public.events enable row level security;

-- registra só os próprios eventos; leitura só admin (público não lê telemetria)
create policy "events_insert" on public.events for insert with check (user_id = auth.uid());
create policy "events_read"   on public.events for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Vire admin: faça login uma vez (com seu e-mail) e rode, com SEU id:
--   update public.profiles set role = 'admin' where user_id = '<seu-uuid>';
-- (pegue o uuid em Authentication > Users)
-- ---------------------------------------------------------------------------
