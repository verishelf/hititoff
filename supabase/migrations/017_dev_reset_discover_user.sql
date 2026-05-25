-- In-app discover reset for the signed-in user (used by dev reset button)

create or replace function public.dev_reset_discover(
  clear_matches boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  swipes_deleted integer;
  matches_deleted integer;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.swipes where user_id = uid;
  get diagnostics swipes_deleted = row_count;

  matches_deleted := 0;
  if clear_matches then
    delete from public.matches
    where user_a = uid or user_b = uid;
    get diagnostics matches_deleted = row_count;
  end if;

  update public.profiles
  set
    daily_likes_used = 0,
    daily_likes_reset_at = now()
  where id = uid;

  return jsonb_build_object(
    'user_id', uid,
    'swipes_deleted', swipes_deleted,
    'matches_deleted', matches_deleted
  );
end;
$$;

revoke all on function public.dev_reset_discover(boolean) from public;
grant execute on function public.dev_reset_discover(boolean) to authenticated;
