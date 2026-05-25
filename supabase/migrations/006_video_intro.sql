-- Premium video intro (up to 20 seconds)

alter table public.profiles
  add column if not exists video_intro_url text;
