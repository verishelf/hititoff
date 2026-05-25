-- Instagram username and curated Instagram-style photos on profiles.

alter table public.profiles
  add column if not exists instagram_username text,
  add column if not exists instagram_photos text[] not null default '{}';
