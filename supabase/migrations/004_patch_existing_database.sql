-- Run this on an EXISTING Supabase project that already has the base schema.
-- Do NOT re-run 001_initial_schema.sql on a live database.

-- Gender + discover preferences
alter table public.profiles
  add column if not exists gender text check (gender in ('male', 'female', 'non_binary')),
  add column if not exists looking_for text check (looking_for in ('male', 'female', 'everyone'));

-- Delete own account
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- Dev helper: create mutual matches for local testing
create or replace function public.dev_create_match(user_x uuid, user_y uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sorted_a uuid;
  sorted_b uuid;
  match_id uuid;
begin
  if user_x is null or user_y is null or user_x = user_y then
    raise exception 'Invalid user ids';
  end if;

  if user_x < user_y then
    sorted_a := user_x;
    sorted_b := user_y;
  else
    sorted_a := user_y;
    sorted_b := user_x;
  end if;

  insert into public.swipes (user_id, target_id, direction)
  values
    (sorted_a, sorted_b, 'like'),
    (sorted_b, sorted_a, 'like')
  on conflict (user_id, target_id) do update set direction = excluded.direction;

  insert into public.likes_received (target_id, liker_id, is_super_like)
  values
    (sorted_b, sorted_a, false),
    (sorted_a, sorted_b, false)
  on conflict (target_id, liker_id) do nothing;

  insert into public.matches (user_a, user_b)
  values (sorted_a, sorted_b)
  on conflict (user_a, user_b) do update set user_a = excluded.user_a
  returning id into match_id;

  return match_id;
end;
$$;

revoke all on function public.dev_create_match(uuid, uuid) from public;
grant execute on function public.dev_create_match(uuid, uuid) to anon, authenticated;

-- Premium video intro (up to 20 seconds)
alter table public.profiles
  add column if not exists video_intro_url text;

-- Allow video uploads in profile-photos storage bucket
update storage.buckets
set
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-m4v'
  ]
where id = 'profile-photos';

-- Dev helper: grant premium by email for testing
create or replace function public.dev_set_premium_by_email(
  user_email text,
  premium boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  select id into uid
  from auth.users
  where lower(email) = lower(user_email);

  if uid is null then
    raise exception 'User not found: %', user_email;
  end if;

  update public.profiles
  set is_premium = premium
  where id = uid;

  return uid;
end;
$$;

revoke all on function public.dev_set_premium_by_email(text, boolean) from public;
grant execute on function public.dev_set_premium_by_email(text, boolean) to anon, authenticated;

-- Allow mutual-match detection: users can read swipes directed at them
drop policy if exists "Users read swipes targeting them" on public.swipes;
create policy "Users read swipes targeting them"
  on public.swipes for select
  using (auth.uid() = target_id);

-- Allow users to delete their own messages
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

-- Allow users to delete conversations they participate in
drop policy if exists "Users delete own matches" on public.matches;
create policy "Users delete own matches"
  on public.matches for delete
  using (auth.uid() = user_a or auth.uid() = user_b);
