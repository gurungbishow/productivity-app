-- ==============================================================================
-- Supabase Schema: Cross-Device Routine & Settings Sync
-- ==============================================================================
-- Run this SQL in your Supabase Project:
-- Dashboard > SQL Editor > New query > Paste & Run
-- ==============================================================================

-- 1. Create table for storing user routine and settings data
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  user_default_schedule jsonb not null default '[]'::jsonb,
  completed_tasks jsonb not null default '{"date": "", "ids": []}'::jsonb,
  focus_logs jsonb not null default '[]'::jsonb,
  pomodoro_settings jsonb not null default '{}'::jsonb,
  favorite_shayari_ids jsonb not null default '[]'::jsonb,
  custom_categories jsonb not null default '[]'::jsonb,
  custom_shayaris jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure columns exist if table was previously created
alter table public.user_data add column if not exists custom_categories jsonb not null default '[]'::jsonb;
alter table public.user_data add column if not exists custom_shayaris jsonb not null default '[]'::jsonb;

-- 2. Grant table permissions to authenticated users, anon, and service role
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on table public.user_data to authenticated, anon;
grant all on table public.user_data to service_role;

-- 3. Enable Row Level Security (RLS) so each user can only access their own data
alter table public.user_data enable row level security;

-- 4. Drop existing policies if re-running
drop policy if exists "Users can view their own data" on public.user_data;
drop policy if exists "Users can insert their own data" on public.user_data;
drop policy if exists "Users can update their own data" on public.user_data;
drop policy if exists "Users can delete their own data" on public.user_data;

-- 5. Create secure RLS policies
create policy "Users can view their own data"
  on public.user_data for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on public.user_data for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on public.user_data for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own data"
  on public.user_data for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6. Enable Realtime updates (broadcasts changes instantly to all connected devices)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_data'
  ) then
    alter publication supabase_realtime add table public.user_data;
  end if;
end $$;

-- 7. Direct Password Reset Function (Allows resetting password directly by email without email delivery)
create extension if not exists pgcrypto schema extensions;

create or replace function public.reset_password_direct(target_email text, new_password text)
returns json
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  target_user auth.users%rowtype;
begin
  select * into target_user from auth.users where lower(email) = lower(trim(target_email));
  if not found then
    return json_build_object('success', false, 'message', 'No account found with this email address.');
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      updated_at = now()
  where id = target_user.id;

  return json_build_object('success', true, 'message', 'Password reset successfully.');
end;
$$;

grant execute on function public.reset_password_direct(text, text) to anon, authenticated;

