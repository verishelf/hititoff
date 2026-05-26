-- Server-side discovery RPC with mood, block, and compatibility filtering

create or replace function public.haversine_mi(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
) returns double precision as $$
declare
  r constant double precision := 3958.8;
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
begin
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat / 2) ^ 2
    + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ^ 2;
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  return r * c;
end;
$$ language plpgsql immutable;

create or replace function public.quiz_similarity(a float8[], b float8[])
returns int as $$
declare
  dot float8 := 0;
  mag_a float8 := 0;
  mag_b float8 := 0;
  i int;
  sim float8;
begin
  if a is null or b is null or array_length(a, 1) is null or array_length(b, 1) is null then
    return 0;
  end if;
  if array_length(a, 1) <> array_length(b, 1) then
    return 0;
  end if;
  for i in 1..array_length(a, 1) loop
    dot := dot + a[i] * b[i];
    mag_a := mag_a + a[i] ^ 2;
    mag_b := mag_b + b[i] ^ 2;
  end loop;
  if mag_a = 0 or mag_b = 0 then
    return 0;
  end if;
  sim := dot / (sqrt(mag_a) * sqrt(mag_b));
  return greatest(0, least(100, round(sim * 100)));
end;
$$ language plpgsql immutable;

create or replace function public.moods_compatible(viewer_mood text, candidate_mood text)
returns boolean as $$
begin
  if viewer_mood is null or candidate_mood is null then
    return true;
  end if;
  if viewer_mood = candidate_mood then
    return true;
  end if;
  if viewer_mood = 'flirty' and candidate_mood in ('spontaneous', 'chill') then return true; end if;
  if viewer_mood = 'spontaneous' and candidate_mood in ('flirty', 'adventurous', 'chill') then return true; end if;
  if viewer_mood = 'deep_talks' and candidate_mood in ('serious', 'chill') then return true; end if;
  if viewer_mood = 'serious' and candidate_mood in ('deep_talks', 'chill') then return true; end if;
  if viewer_mood = 'adventurous' and candidate_mood in ('spontaneous', 'flirty') then return true; end if;
  if viewer_mood = 'chill' then return true; end if;
  return false;
end;
$$ language plpgsql immutable;

create or replace function public.get_discovery_candidates(
  p_user_id uuid,
  p_radius_mi int default 25,
  p_limit int default 50
)
returns table (
  id uuid,
  name text,
  age int,
  bio text,
  photos text[],
  interests text[],
  gender text,
  looking_for text,
  latitude double precision,
  longitude double precision,
  quiz_vector float8[],
  quiz_completed boolean,
  boosted_until timestamptz,
  is_premium boolean,
  video_intro_url text,
  instagram_username text,
  instagram_photos text[],
  current_mood text,
  voice_bio_url text,
  vibe_clip_url text,
  voice_vibe_summary text,
  respectful_dater_badge boolean,
  verification_status text,
  profile_prompts jsonb,
  distance_mi double precision,
  quiz_score int,
  location_score int,
  compatibility_score int,
  ai_overall_score int,
  ai_chemistry_score int,
  ai_emotional_resonance int,
  ai_communication_compat int,
  ai_humor_alignment int
) as $$
declare
  v_user public.profiles%rowtype;
  v_effective_radius int;
  v_min_compat int;
begin
  select * into v_user from public.profiles where profiles.id = p_user_id;
  if not found then return; end if;
  if v_user.latitude is null or v_user.longitude is null then return; end if;
  if not v_user.quiz_completed or v_user.quiz_vector is null or array_length(v_user.quiz_vector, 1) is null then return; end if;
  if v_user.gender is null or v_user.looking_for is null then return; end if;

  v_effective_radius := case
    when v_user.is_premium then p_radius_mi
    else least(p_radius_mi, 3)
  end;

  v_min_compat := case
    when v_user.is_premium then coalesce(v_user.pref_min_compatibility, 70)
    else 70
  end;

  return query
  with excluded as (
    select s.target_id as uid from public.swipes s where s.user_id = p_user_id
    union
    select case when m.user_a = p_user_id then m.user_b else m.user_a end
    from public.matches m
    where m.user_a = p_user_id or m.user_b = p_user_id
    union
    select b.blocked_id from public.user_blocks b where b.blocker_id = p_user_id
    union
    select b.blocker_id from public.user_blocks b where b.blocked_id = p_user_id
    union
    select p_user_id
  ),
  scored as (
    select
      p.id as candidate_id,
      sp.sa as pair_a,
      sp.sb as pair_b,
      public.haversine_mi(v_user.latitude, v_user.longitude, p.latitude, p.longitude) as distance_mi,
      public.quiz_similarity(v_user.quiz_vector, p.quiz_vector) as quiz_score,
      greatest(
        0,
        least(
          100,
          round(
            100 * (
              1 - public.haversine_mi(v_user.latitude, v_user.longitude, p.latitude, p.longitude)
                / v_effective_radius
            )
          )
        )
      )::int as location_score
    from public.profiles p
    cross join lateral public.sort_pair_ids(p_user_id, p.id) sp
    where p.id not in (select uid from excluded)
  ),
  ranked as (
    select
      s.*,
      round(0.6 * s.quiz_score + 0.4 * s.location_score)::int as compatibility_score
    from scored s
  )
  select
    p.id,
    p.name,
    p.age,
    p.bio,
    p.photos,
    p.interests,
    p.gender,
    p.looking_for,
    p.latitude,
    p.longitude,
    p.quiz_vector,
    p.quiz_completed,
    p.boosted_until,
    p.is_premium,
    p.video_intro_url,
    p.instagram_username,
    p.instagram_photos,
    p.current_mood,
    p.voice_bio_url,
    p.vibe_clip_url,
    p.voice_vibe_summary,
    p.respectful_dater_badge,
    p.verification_status,
    p.profile_prompts,
    r.distance_mi,
    r.quiz_score,
    r.location_score,
    r.compatibility_score,
    coalesce(ca.overall_score, r.compatibility_score)::int as ai_overall_score,
    coalesce(ca.chemistry_score, 0)::int as ai_chemistry_score,
    coalesce(ca.emotional_resonance, 0)::int as ai_emotional_resonance,
    coalesce(ca.communication_compat, 0)::int as ai_communication_compat,
    coalesce(ca.humor_alignment, 0)::int as ai_humor_alignment
  from public.profiles p
  join ranked r on r.candidate_id = p.id
  left join public.compatibility_analytics ca
    on ca.user_a = r.pair_a and ca.user_b = r.pair_b
  where p.quiz_completed = true
    and p.latitude is not null
    and p.longitude is not null
    and p.quiz_vector is not null
    and array_length(p.quiz_vector, 1) > 0
    and p.gender is not null
    and p.looking_for is not null
    and (v_user.looking_for = 'everyone' or v_user.looking_for = p.gender)
    and (p.looking_for = 'everyone' or p.looking_for = v_user.gender)
    and (not v_user.is_premium or (p.age >= coalesce(v_user.pref_age_min, 18) and p.age <= coalesce(v_user.pref_age_max, 55)))
    and r.distance_mi <= v_effective_radius
    and r.compatibility_score >= v_min_compat
    and coalesce(array_length(p.photos, 1), 0) >= case
      when v_user.is_premium then coalesce(v_user.pref_min_photos, 1)
      else least(coalesce(v_user.pref_min_photos, 1), 2)
    end
    and (
      not v_user.is_premium
      or coalesce(array_length(v_user.pref_interest_filters, 1), 0) = 0
      or v_user.pref_interest_filters && p.interests
    )
    and (not v_user.pref_require_bio or length(trim(p.bio)) >= 10)
    and (not v_user.pref_require_video or not v_user.is_premium or p.video_intro_url is not null)
    and (not v_user.pref_require_instagram or not v_user.is_premium or p.instagram_username is not null)
    and (
      not coalesce(v_user.pref_match_mood, false)
      or v_user.current_mood is null
      or public.moods_compatible(v_user.current_mood, p.current_mood)
    )
    and (
      coalesce(array_length(v_user.pref_mood_filters, 1), 0) = 0
      or p.current_mood = any(v_user.pref_mood_filters)
    )
  order by
    case when p.boosted_until is not null and p.boosted_until > now() then 1 else 0 end desc,
    case when p.is_premium then 1 else 0 end desc,
    r.compatibility_score desc
  limit p_limit;
end;
$$ language plpgsql security definer;

grant execute on function public.get_discovery_candidates(uuid, int, int) to authenticated;
