-- Allow users to read swipes directed at them so mutual-match detection works client-side.

drop policy if exists "Users read swipes targeting them" on public.swipes;
create policy "Users read swipes targeting them"
  on public.swipes for select
  using (auth.uid() = target_id);
