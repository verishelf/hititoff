-- Dev helper: grant or revoke premium by email (local testing only)

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
