-- Private phone numbers + mutual exchange per match

create table if not exists public.profile_phones (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone_number text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.match_phone_shares (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  shared_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

alter table public.profile_phones enable row level security;
alter table public.match_phone_shares enable row level security;

drop policy if exists "Users manage own phone" on public.profile_phones;
create policy "Users manage own phone"
  on public.profile_phones for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Match participants read phone shares" on public.match_phone_shares;
create policy "Match participants read phone shares"
  on public.match_phone_shares for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

drop policy if exists "Users share own phone in their matches" on public.match_phone_shares;
create policy "Users share own phone in their matches"
  on public.match_phone_shares for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create or replace function public.get_phone_exchange_status(p_match_id uuid)
returns table (
  i_shared boolean,
  they_shared boolean,
  their_phone text,
  my_phone text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_other_id uuid;
begin
  if v_user_id is null then
    return;
  end if;

  select case when m.user_a = v_user_id then m.user_b else m.user_a end
  into v_other_id
  from public.matches m
  where m.id = p_match_id
    and (m.user_a = v_user_id or m.user_b = v_user_id);

  if v_other_id is null then
    return;
  end if;

  return query
  select
    exists (
      select 1 from public.match_phone_shares s
      where s.match_id = p_match_id and s.user_id = v_user_id
    ) as i_shared,
    exists (
      select 1 from public.match_phone_shares s
      where s.match_id = p_match_id and s.user_id = v_other_id
    ) as they_shared,
    case
      when exists (
        select 1 from public.match_phone_shares s
        where s.match_id = p_match_id and s.user_id = v_user_id
      )
      and exists (
        select 1 from public.match_phone_shares s
        where s.match_id = p_match_id and s.user_id = v_other_id
      )
      then (select p.phone_number from public.profile_phones p where p.user_id = v_other_id)
      else null
    end as their_phone,
    (select p.phone_number from public.profile_phones p where p.user_id = v_user_id) as my_phone;
end;
$$;

create or replace function public.share_phone_with_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profile_phones p where p.user_id = v_user_id
  ) then
    raise exception 'Add your phone number to your profile first';
  end if;

  if not exists (
    select 1 from public.matches m
    where m.id = p_match_id
      and (m.user_a = v_user_id or m.user_b = v_user_id)
  ) then
    raise exception 'Not a match participant';
  end if;

  insert into public.match_phone_shares (match_id, user_id)
  values (p_match_id, v_user_id)
  on conflict (match_id, user_id) do nothing;
end;
$$;

grant execute on function public.get_phone_exchange_status(uuid) to authenticated;
grant execute on function public.share_phone_with_match(uuid) to authenticated;
