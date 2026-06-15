-- =============================================
-- BOLÃO COPA 2026 — Supabase Schema
-- Execute no SQL Editor do seu projeto Supabase
-- =============================================

-- 1. PROFILES (estende auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text,
  avatar_url  text,
  cpf         text unique,
  score       integer default 0,
  correct_picks integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. PICKS (palpites dos usuários)
create table if not exists public.picks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  match_id    text not null,            -- ID do jogo na API football-data.org
  picked_team text not null,            -- Nome do time escolhido
  is_correct  boolean,                  -- Preenchido após o jogo terminar
  points      integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, match_id)
);

-- 3. Row Level Security (RLS) — cada usuário vê/edita só os seus dados
alter table public.profiles enable row level security;
alter table public.picks enable row level security;

-- Profiles: todos podem ler (para o ranking), cada um edita o próprio
create policy "Profiles são visíveis por todos"
  on public.profiles for select using (true);

create policy "Usuário edita próprio perfil"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Picks: todos podem ver (para ranking), cada um edita os próprios
create policy "Picks são visíveis por todos"
  on public.picks for select using (true);

create policy "Usuário gerencia próprios picks"
  on public.picks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Trigger: cria perfil automático ao cadastrar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. View: ranking público
create or replace view public.ranking as
  select
    p.id,
    p.name,
    p.avatar_url,
    p.score,
    p.correct_picks,
    rank() over (order by p.score desc, p.correct_picks desc) as position
  from public.profiles p
  order by p.score desc;

-- =============================================
-- CONFIGURAÇÕES DO SUPABASE (faça manualmente):
--
-- 1. Authentication > Providers > Google
--    - Ative e cole Client ID + Secret do Google Cloud
--    - Redirect URL: https://SEU_PROJETO.supabase.co/auth/v1/callback
--
-- 2. Authentication > URL Configuration
--    - Site URL: https://seu-bolao.vercel.app
--    - Redirect URLs: https://seu-bolao.vercel.app/app.html
--
-- 3. Se quiser desativar confirmação de e-mail (mais simples):
--    Authentication > Email Templates > Confirm signup
--    Authentication > Settings > desmarque "Enable email confirmations"
-- =============================================
