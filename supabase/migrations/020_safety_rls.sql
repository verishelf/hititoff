-- Safety RLS hardening and chemistry compute helper

-- Block check helper for services
create or replace function public.is_blocked(user_a uuid, user_b uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.user_blocks
    where (blocker_id = user_a and blocked_id = user_b)
       or (blocker_id = user_b and blocked_id = user_a)
  );
end;
$$ language plpgsql security definer;

-- Compute chemistry from messages (heuristic, no AI)
create or replace function public.compute_match_chemistry(p_match_id uuid)
returns void as $$
declare
  v_msg_count int;
  v_avg_len float;
  v_question_count int;
  v_laugh_count int;
  v_users uuid[];
  v_user_a_msgs int;
  v_user_b_msgs int;
  v_response_speed int := 50;
  v_engagement int := 50;
  v_depth int := 30;
  v_humor int := 40;
  v_energy int := 50;
  v_spark int;
begin
  select count(*) into v_msg_count from public.messages where match_id = p_match_id;
  if v_msg_count = 0 then return; end if;

  select avg(length(text)), count(*) filter (where text like '%?%'),
         count(*) filter (where text ~ '[😂🤣😆😄]|haha|lol|lmao')
  into v_avg_len, v_question_count, v_laugh_count
  from public.messages where match_id = p_match_id and message_type = 'text';

  select array[user_a, user_b] into v_users from public.matches where id = p_match_id;

  select count(*) into v_user_a_msgs from public.messages
  where match_id = p_match_id and sender_id = v_users[1];
  select count(*) into v_user_b_msgs from public.messages
  where match_id = p_match_id and sender_id = v_users[2];

  v_engagement := least(100, greatest(20, round(coalesce(v_avg_len, 0) * 2)));
  v_depth := least(100, v_question_count * 15 + least(50, v_msg_count * 5));
  v_humor := least(100, v_laugh_count * 20 + 20);
  if v_user_a_msgs > 0 and v_user_b_msgs > 0 then
    v_energy := least(100, 50 + 50 * (1 - abs(v_user_a_msgs - v_user_b_msgs)::float / greatest(v_user_a_msgs, v_user_b_msgs)));
  end if;
  v_spark := round((v_response_speed + v_engagement + v_depth + v_humor + v_energy) / 5.0);

  insert into public.match_chemistry (
    match_id, spark_meter, response_speed_score, engagement_score,
    depth_score, humor_alignment, mutual_energy, updated_at
  ) values (
    p_match_id, v_spark, v_response_speed, v_engagement,
    v_depth, v_humor, v_energy, now()
  )
  on conflict (match_id) do update set
    spark_meter = excluded.spark_meter,
    response_speed_score = excluded.response_speed_score,
    engagement_score = excluded.engagement_score,
    depth_score = excluded.depth_score,
    humor_alignment = excluded.humor_alignment,
    mutual_energy = excluded.mutual_energy,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- Trigger chemistry recompute on new message
create or replace function public.on_message_chemistry_update()
returns trigger as $$
begin
  perform public.compute_match_chemistry(new.match_id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_update_chemistry on public.messages;
create trigger on_message_update_chemistry
  after insert on public.messages
  for each row execute function public.on_message_chemistry_update();

-- Update respectful dater badge based on reply rate
create or replace function public.update_respectful_dater_badge(p_user_id uuid)
returns void as $$
declare
  v_reply_rate float;
begin
  -- Simplified: users with last_active within 7 days and badge criteria
  update public.profiles
  set respectful_dater_badge = (
    last_active_at > now() - interval '7 days'
    and exists (
      select 1 from public.messages m
      join public.matches mt on mt.id = m.match_id
      where m.sender_id = p_user_id
      and m.created_at > now() - interval '30 days'
      limit 1
    )
  )
  where id = p_user_id;
end;
$$ language plpgsql security definer;

grant execute on function public.compute_match_chemistry(uuid) to authenticated;
grant execute on function public.is_blocked(uuid, uuid) to authenticated;
grant execute on function public.increment_ai_usage(text) to authenticated;
