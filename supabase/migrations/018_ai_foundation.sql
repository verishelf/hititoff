-- AI foundation: profile extensions, message types, analytics tables

-- Profile extensions
alter table public.profiles
  add column if not exists quiz_answers jsonb default '{}',
  add column if not exists profile_prompts jsonb default '[]',
  add column if not exists flirting_style text,
  add column if not exists humor_type text,
  add column if not exists current_mood text check (
    current_mood is null or current_mood in (
      'deep_talks', 'flirty', 'adventurous', 'serious', 'chill', 'spontaneous'
    )
  ),
  add column if not exists mood_updated_at timestamptz,
  add column if not exists voice_bio_url text,
  add column if not exists vibe_clip_url text,
  add column if not exists voice_vibe_summary text,
  add column if not exists last_active_at timestamptz default now(),
  add column if not exists respectful_dater_badge boolean default false,
  add column if not exists verification_status text default 'none' check (
    verification_status in ('none', 'pending', 'verified')
  ),
  add column if not exists pref_match_mood boolean default false,
  add column if not exists pref_mood_filters text[] default '{}';

-- Message extensions
alter table public.messages
  add column if not exists message_type text default 'text' check (
    message_type in ('text', 'voice', 'quick_response')
  ),
  add column if not exists audio_url text,
  add column if not exists audio_duration_ms int,
  add column if not exists moderation_status text default 'approved' check (
    moderation_status in ('pending', 'approved', 'flagged')
  );

-- Pair-level AI compatibility analytics
create table if not exists public.compatibility_analytics (
  user_a uuid references public.profiles(id) on delete cascade not null,
  user_b uuid references public.profiles(id) on delete cascade not null,
  overall_score int not null default 0 check (overall_score between 0 and 100),
  chemistry_score int not null default 0 check (chemistry_score between 0 and 100),
  emotional_resonance int not null default 0 check (emotional_resonance between 0 and 100),
  communication_compat int not null default 0 check (communication_compat between 0 and 100),
  humor_alignment int not null default 0 check (humor_alignment between 0 and 100),
  factors jsonb default '{}',
  computed_at timestamptz default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

-- Match chemistry tracking
create table if not exists public.match_chemistry (
  match_id uuid primary key references public.matches(id) on delete cascade,
  spark_meter int not null default 0 check (spark_meter between 0 and 100),
  response_speed_score int not null default 0 check (response_speed_score between 0 and 100),
  engagement_score int not null default 0 check (engagement_score between 0 and 100),
  depth_score int not null default 0 check (depth_score between 0 and 100),
  humor_alignment int not null default 0 check (humor_alignment between 0 and 100),
  mutual_energy int not null default 0 check (mutual_energy between 0 and 100),
  updated_at timestamptz default now()
);

create table if not exists public.chemistry_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade not null,
  event_type text not null,
  delta int not null default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Safety tables
create table if not exists public.user_blocks (
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  details text default '',
  status text default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz default now()
);

create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('message', 'profile', 'photo', 'voice')),
  target_id uuid not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  reason text not null,
  created_at timestamptz default now()
);

create table if not exists public.quick_response_log (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  template_key text not null,
  created_at timestamptz default now()
);

create table if not exists public.ai_usage_daily (
  user_id uuid references public.profiles(id) on delete cascade not null,
  feature text not null,
  count int not null default 0,
  date date not null default current_date,
  primary key (user_id, feature, date)
);

create table if not exists public.date_suggestions_cache (
  match_id uuid primary key references public.matches(id) on delete cascade,
  suggestions jsonb not null default '[]',
  expires_at timestamptz not null
);

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  selfie_url text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- Voice clips storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-clips',
  'voice-clips',
  false,
  10485760,
  array['audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-m4a']
)
on conflict (id) do nothing;

-- Realtime publications
alter publication supabase_realtime add table public.match_chemistry;

-- RLS
alter table public.compatibility_analytics enable row level security;
alter table public.match_chemistry enable row level security;
alter table public.chemistry_events enable row level security;
alter table public.user_blocks enable row level security;
alter table public.user_reports enable row level security;
alter table public.moderation_flags enable row level security;
alter table public.quick_response_log enable row level security;
alter table public.ai_usage_daily enable row level security;
alter table public.date_suggestions_cache enable row level security;
alter table public.verification_requests enable row level security;

-- Compatibility analytics: participants can read
create policy "Users read own compatibility analytics"
  on public.compatibility_analytics for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Service can upsert compatibility analytics"
  on public.compatibility_analytics for all
  using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- Match chemistry: match participants
create policy "Match participants read chemistry"
  on public.match_chemistry for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create policy "Match participants upsert chemistry"
  on public.match_chemistry for all
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- Chemistry events
create policy "Match participants read chemistry events"
  on public.chemistry_events for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create policy "Match participants insert chemistry events"
  on public.chemistry_events for insert
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- Blocks
create policy "Users manage own blocks"
  on public.user_blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

-- Reports
create policy "Users create reports"
  on public.user_reports for insert
  with check (auth.uid() = reporter_id);

create policy "Users read own reports"
  on public.user_reports for select
  using (auth.uid() = reporter_id);

-- AI usage
create policy "Users manage own ai usage"
  on public.ai_usage_daily for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Date suggestions cache
create policy "Match participants read date suggestions"
  on public.date_suggestions_cache for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create policy "Match participants upsert date suggestions"
  on public.date_suggestions_cache for all
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- Verification requests
create policy "Users manage own verification"
  on public.verification_requests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Quick response log
create policy "Match participants log quick responses"
  on public.quick_response_log for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- Voice storage policies
create policy "Users upload own voice clips"
  on storage.objects for insert
  with check (
    bucket_id = 'voice-clips'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users read own voice clips"
  on storage.objects for select
  using (
    bucket_id = 'voice-clips'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own voice clips"
  on storage.objects for delete
  using (
    bucket_id = 'voice-clips'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Helper: sort pair for compatibility analytics
create or replace function public.sort_pair_ids(a uuid, b uuid)
returns table(sa uuid, sb uuid) as $$
begin
  if a < b then
    return query select a, b;
  else
    return query select b, a;
  end if;
end;
$$ language plpgsql immutable;

-- Increment AI usage counter
create or replace function public.increment_ai_usage(p_feature text)
returns int as $$
declare
  new_count int;
begin
  insert into public.ai_usage_daily (user_id, feature, count, date)
  values (auth.uid(), p_feature, 1, current_date)
  on conflict (user_id, feature, date)
  do update set count = ai_usage_daily.count + 1
  returning count into new_count;
  return new_count;
end;
$$ language plpgsql security definer;

-- Initialize chemistry row on match creation
create or replace function public.init_match_chemistry()
returns trigger as $$
begin
  insert into public.match_chemistry (match_id, spark_meter)
  values (new.id, 20)
  on conflict (match_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_match_created_init_chemistry on public.matches;
create trigger on_match_created_init_chemistry
  after insert on public.matches
  for each row execute function public.init_match_chemistry();
