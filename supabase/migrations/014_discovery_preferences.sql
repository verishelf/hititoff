-- Discovery preference filters (age range)

alter table public.profiles
  add column if not exists pref_age_min int default 18,
  add column if not exists pref_age_max int default 55;

alter table public.profiles
  drop constraint if exists profiles_pref_age_min_check,
  drop constraint if exists profiles_pref_age_max_check,
  drop constraint if exists profiles_pref_age_range_check;

alter table public.profiles
  add constraint profiles_pref_age_min_check
    check (pref_age_min >= 18 and pref_age_min <= 120),
  add constraint profiles_pref_age_max_check
    check (pref_age_max >= 18 and pref_age_max <= 120),
  add constraint profiles_pref_age_range_check
    check (pref_age_min <= pref_age_max);

update public.profiles
set
  pref_age_min = coalesce(pref_age_min, 18),
  pref_age_max = coalesce(pref_age_max, 55)
where pref_age_min is null or pref_age_max is null;
