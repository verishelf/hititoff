-- Dev helper: create a mutual match between two users (for local testing only)

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
