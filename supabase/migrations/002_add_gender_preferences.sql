-- Gender identity and discover preferences

alter table public.profiles
  add column if not exists gender text check (gender in ('male', 'female', 'non_binary')),
  add column if not exists looking_for text check (looking_for in ('male', 'female', 'everyone'));
