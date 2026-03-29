-- ═══════════════════════════════════════════════
-- DashGen Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles (extends auth.users) ───────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text not null,
  full_name     text,
  avatar_url    text,
  plan          text not null default 'free', -- 'free' | 'pro' | 'team'
  generations_used  integer not null default 0,
  generations_limit integer not null default 3,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Reports ─────────────────────────────────────
create table public.reports (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  title         text not null,
  description   text,
  report_type   text not null, -- 'supply_chain' | 'sales' | 'finance' | 'hr' | 'custom'
  theme         text not null default 'light', -- 'light' | 'dark'
  metrics       jsonb not null default '[]',   -- array of metric objects
  html_content  text,                          -- generated HTML
  prompt_used   text,                          -- the prompt sent to AI
  ref_image_url text,                          -- uploaded reference image URL
  status        text not null default 'draft', -- 'draft' | 'generating' | 'done' | 'error'
  is_public     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Users can manage own reports"
  on public.reports for all
  using (auth.uid() = user_id);

create policy "Public reports are visible to all"
  on public.reports for select
  using (is_public = true);

-- ── Indexes ─────────────────────────────────────
create index idx_reports_user_id on public.reports(user_id);
create index idx_reports_created_at on public.reports(created_at desc);
create index idx_reports_status on public.reports(status);

-- ── Storage bucket for reference images ─────────
insert into storage.buckets (id, name, public) values ('ref-images', 'ref-images', false);

create policy "Users can upload own images"
  on storage.objects for insert
  with check (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own images"
  on storage.objects for select
  using (auth.uid()::text = (storage.foldername(name))[1]);

-- ── Updated_at trigger ───────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_reports_updated_at before update on public.reports
  for each row execute procedure public.set_updated_at();
