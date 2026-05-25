-- Allow users to delete conversations they participate in.

drop policy if exists "Users delete own matches" on public.matches;
create policy "Users delete own matches"
  on public.matches for delete
  using (auth.uid() = user_a or auth.uid() = user_b);
