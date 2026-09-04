import { supabase } from './supabase';
import { ScheduleItem, UserProfile, PomodoroSettings, FocusSessionLog } from './types';

export interface UserDataPayload {
  profile: UserProfile;
  schedule: ScheduleItem[];
  user_default_schedule: ScheduleItem[];
  completed_tasks: { date: string; ids: string[] };
  focus_logs: FocusSessionLog[];
  pomodoro_settings: PomodoroSettings;
  favorite_shayari_ids: number[];
  updated_at?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'table_missing' | 'error' | 'local_only';

export const SQL_SCHEMA_SCRIPT = `-- 1. Create user_data table for cross-device routine & settings sync
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  user_default_schedule jsonb not null default '[]'::jsonb,
  completed_tasks jsonb not null default '{"date": "", "ids": []}'::jsonb,
  focus_logs jsonb not null default '[]'::jsonb,
  pomodoro_settings jsonb not null default '{}'::jsonb,
  favorite_shayari_ids jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.user_data enable row level security;

-- 3. Drop existing policies if re-running
drop policy if exists "Users can view their own data" on public.user_data;
drop policy if exists "Users can insert their own data" on public.user_data;
drop policy if exists "Users can update their own data" on public.user_data;

-- 4. Create secure RLS policies
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

-- 5. Enable Realtime updates
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_data'
  ) then
    alter publication supabase_realtime add table public.user_data;
  end if;
end $$;`;

function isTableMissingError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    (msg.includes('user_data') && (msg.includes('not find') || msg.includes('schema cache') || msg.includes('does not exist'))) ||
    msg.includes('relation "public.user_data" does not exist')
  );
}

export async function fetchUserDataFromCloud(userId: string): Promise<{
  status: 'success' | 'not_found' | 'table_missing' | 'error' | 'no_client';
  data?: UserDataPayload;
  error?: string;
}> {
  if (!supabase) {
    return { status: 'no_client' };
  }

  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error)) {
        return { status: 'table_missing', error: error.message };
      }
      return { status: 'error', error: error.message };
    }

    if (!data) {
      return { status: 'not_found' };
    }

    return {
      status: 'success',
      data: {
        profile: data.profile || {},
        schedule: Array.isArray(data.schedule) ? data.schedule : [],
        user_default_schedule: Array.isArray(data.user_default_schedule) ? data.user_default_schedule : [],
        completed_tasks: data.completed_tasks || { date: '', ids: [] },
        focus_logs: Array.isArray(data.focus_logs) ? data.focus_logs : [],
        pomodoro_settings: data.pomodoro_settings || {},
        favorite_shayari_ids: Array.isArray(data.favorite_shayari_ids) ? data.favorite_shayari_ids : [],
        updated_at: data.updated_at,
      },
    };
  } catch (err: any) {
    return { status: 'error', error: err?.message || 'Unknown network error' };
  }
}

export async function saveUserDataToCloud(
  userId: string,
  payload: UserDataPayload
): Promise<{
  status: 'success' | 'table_missing' | 'error' | 'no_client';
  error?: string;
  updatedAt?: string;
}> {
  if (!supabase) {
    return { status: 'no_client' };
  }

  try {
    const updatedAt = new Date().toISOString();
    const { error } = await supabase.from('user_data').upsert({
      user_id: userId,
      profile: payload.profile,
      schedule: payload.schedule,
      user_default_schedule: payload.user_default_schedule,
      completed_tasks: payload.completed_tasks,
      focus_logs: payload.focus_logs,
      pomodoro_settings: payload.pomodoro_settings,
      favorite_shayari_ids: payload.favorite_shayari_ids,
      updated_at: updatedAt,
    });

    if (error) {
      if (isTableMissingError(error)) {
        return { status: 'table_missing', error: error.message };
      }
      return { status: 'error', error: error.message };
    }

    return { status: 'success', updatedAt };
  } catch (err: any) {
    return { status: 'error', error: err?.message || 'Unknown network error' };
  }
}

export function subscribeToUserDataChanges(
  userId: string,
  onRemoteUpdate: (data: UserDataPayload) => void
): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`user-sync-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_data',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          const remote = payload.new as any;
          onRemoteUpdate({
            profile: remote.profile || {},
            schedule: Array.isArray(remote.schedule) ? remote.schedule : [],
            user_default_schedule: Array.isArray(remote.user_default_schedule) ? remote.user_default_schedule : [],
            completed_tasks: remote.completed_tasks || { date: '', ids: [] },
            focus_logs: Array.isArray(remote.focus_logs) ? remote.focus_logs : [],
            pomodoro_settings: remote.pomodoro_settings || {},
            favorite_shayari_ids: Array.isArray(remote.favorite_shayari_ids) ? remote.favorite_shayari_ids : [],
            updated_at: remote.updated_at,
          });
        }
      }
    )
    .subscribe();

  return () => {
    if (supabase) {
      supabase.removeChannel(channel);
    }
  };
}
