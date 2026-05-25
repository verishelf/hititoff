-- Advanced discovery preference filters

alter table public.profiles
  add column if not exists pref_min_compatibility int default 70,
  add column if not exists pref_interest_filters text[] default '{}',
  add column if not exists pref_min_photos int default 1,
  add column if not exists pref_require_bio boolean default false,
  add column if not exists pref_require_video boolean default false,
  add column if not exists pref_require_instagram boolean default false;

alter table public.profiles
  drop constraint if exists profiles_pref_min_compatibility_check,
  drop constraint if exists profiles_pref_min_photos_check;

alter table public.profiles
  add constraint profiles_pref_min_compatibility_check
    check (pref_min_compatibility >= 0 and pref_min_compatibility <= 100),
  add constraint profiles_pref_min_photos_check
    check (pref_min_photos >= 1 and pref_min_photos <= 6);

update public.profiles
set
  pref_min_compatibility = coalesce(pref_min_compatibility, 70),
  pref_interest_filters = coalesce(pref_interest_filters, '{}'),
  pref_min_photos = coalesce(pref_min_photos, 1),
  pref_require_bio = coalesce(pref_require_bio, false),
  pref_require_video = coalesce(pref_require_video, false),
  pref_require_instagram = coalesce(pref_require_instagram, false)
where pref_min_compatibility is null
   or pref_interest_filters is null
   or pref_min_photos is null
   or pref_require_bio is null
   or pref_require_video is null
   or pref_require_instagram is null;
