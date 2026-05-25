-- HitItOff initial schema

create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age int not null check (age >= 18 and age <= 120),
  bio text default '',
  photos text[] default '{}',
  interests text[] default '{}',
  gender text check (gender in ('male', 'female', 'non_binary')),
  looking_for text check (looking_for in ('male', 'female', 'everyone')),
  latitude double precision,
  longitude double precision,
  location_updated_at timestamptz,
  quiz_vector float8[] default '{}',
  quiz_completed boolean default false,
  daily_likes_used int default 0,
  daily_likes_reset_at timestamptz default now(),
  boosts_remaining int default 0,
  super_likes_remaining int default 1,
  boosted_until timestamptz,
  is_premium boolean default false,
  video_intro_url text,
  created_at timestamptz default now()
);

-- Swipes
create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid references public.profiles(id) on delete cascade not null,
  direction text check (direction in ('like', 'pass', 'super_like')) not null,
  created_at timestamptz default now(),
  unique (user_id, target_id)
);

-- Matches (sorted pair)
create or replace function public.sort_match_pair(a uuid, b uuid)
returns table(user_a uuid, user_b uuid) as $$
begin
  if a < b then
    return query select a, b;
  else
    return query select b, a;
  end if;
end;
$$ language plpgsql immutable;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references public.profiles(id) on delete cascade not null,
  user_b uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  last_message_at timestamptz,
  unique (user_a, user_b),
  check (user_a < user_b)
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  read_by uuid[] default '{}',
  created_at timestamptz default now()
);

-- Likes received
create table if not exists public.likes_received (
  target_id uuid references public.profiles(id) on delete cascade not null,
  liker_id uuid references public.profiles(id) on delete cascade not null,
  is_super_like boolean default false,
  created_at timestamptz default now(),
  primary key (target_id, liker_id)
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, age)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'User'),
    coalesce((new.raw_user_meta_data->>'age')::int, 25)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.likes_received enable row level security;

-- Profiles policies
drop policy if exists "Users can read all profiles for matching" on public.profiles;
create policy "Users can read all profiles for matching"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Swipes policies
drop policy if exists "Users manage own swipes" on public.swipes;
create policy "Users manage own swipes"
  on public.swipes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users read swipes targeting them" on public.swipes;
create policy "Users read swipes targeting them"
  on public.swipes for select
  using (auth.uid() = target_id);

-- Matches policies
drop policy if exists "Users read own matches" on public.matches;
create policy "Users read own matches"
  on public.matches for select
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Users create matches they participate in" on public.matches;
create policy "Users create matches they participate in"
  on public.matches for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Users update own matches" on public.matches;
create policy "Users update own matches"
  on public.matches for update
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Users delete own matches" on public.matches;
create policy "Users delete own matches"
  on public.matches for delete
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Messages policies
drop policy if exists "Match participants read messages" on public.messages;
create policy "Match participants read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

drop policy if exists "Match participants send messages" on public.messages;
create policy "Match participants send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

drop policy if exists "Match participants update messages" on public.messages;
create policy "Match participants update messages"
  on public.messages for update
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

drop policy if exists "Users delete own messages" on public.messages;
create policy "Users delete own messages"
  on public.messages for delete
  using (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- Likes received policies
drop policy if exists "Users can insert likes they send" on public.likes_received;
create policy "Users can insert likes they send"
  on public.likes_received for insert
  with check (auth.uid() = liker_id);

drop policy if exists "Premium users read likes received" on public.likes_received;
create policy "Premium users read likes received"
  on public.likes_received for select
  using (
    auth.uid() = target_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_premium = true
    )
  );

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read profile photos" on storage.objects;
create policy "Public read profile photos"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

drop policy if exists "Users upload own photos" on storage.objects;
create policy "Users upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own photos" on storage.objects;
create policy "Users update own photos"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own photos" on storage.objects;
create policy "Users delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Realtime for messages
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
