-- Allow all users to read who liked them; free-tier preview is enforced in the app UI.

drop policy if exists "Premium users read likes received" on public.likes_received;
drop policy if exists "Users read likes received" on public.likes_received;

create policy "Users read likes received"
  on public.likes_received for select
  using (auth.uid() = target_id);
