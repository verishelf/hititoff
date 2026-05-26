import {
  finalCompatibility,
  locationScore,
  quizSimilarity,
} from '../utils/compatibility';
import {
  COMPATIBILITY_THRESHOLD,
  DEFAULT_PREF_AGE_MAX,
  DEFAULT_PREF_AGE_MIN,
  DEFAULT_PREF_MIN_COMPATIBILITY,
  DEFAULT_PREF_MIN_PHOTOS,
  FREE_DAILY_LIKES,
  FREE_MAX_RADIUS_MI,
} from '../utils/constants';
import { haversineMi } from '../utils/distance';
import type {
  Candidate,
  LikeReceived,
  MatchRecord,
  SwipeDirection,
  UserProfile,
} from '../types';
import {
  filterValidPhotoUrls,
  normalizePhotoUrl,
  uploadProfilePhoto,
} from './photoService';
import type { Database } from '../types/database';
import { computeCompatibility } from './aiService';
import { supabase } from './supabase';

export { deleteProfilePhoto, deleteProfileVideo, uploadInstagramPhoto, uploadProfilePhoto, uploadProfileVideo } from './photoService';

const USE_DISCOVERY_RPC = true;

function mapProfile(row: Record<string, unknown>): UserProfile {
  const profile = row as unknown as UserProfile;
  const photos = Array.isArray(profile.photos)
    ? profile.photos
        .filter((photo): photo is string => typeof photo === 'string' && photo.length > 0)
        .map(normalizePhotoUrl)
    : [];
  const instagramPhotos = Array.isArray(profile.instagram_photos)
    ? profile.instagram_photos
        .filter((photo): photo is string => typeof photo === 'string' && photo.length > 0)
        .map(normalizePhotoUrl)
    : [];

  return {
    ...profile,
    photos,
    instagram_photos: instagramPhotos,
    pref_age_min:
      typeof profile.pref_age_min === 'number'
        ? profile.pref_age_min
        : DEFAULT_PREF_AGE_MIN,
    pref_age_max:
      typeof profile.pref_age_max === 'number'
        ? profile.pref_age_max
        : DEFAULT_PREF_AGE_MAX,
    pref_min_compatibility:
      typeof profile.pref_min_compatibility === 'number'
        ? profile.pref_min_compatibility
        : DEFAULT_PREF_MIN_COMPATIBILITY,
    pref_interest_filters: Array.isArray(profile.pref_interest_filters)
      ? profile.pref_interest_filters.filter(
          (interest): interest is string => typeof interest === 'string' && interest.length > 0,
        )
      : [],
    pref_min_photos:
      typeof profile.pref_min_photos === 'number'
        ? profile.pref_min_photos
        : DEFAULT_PREF_MIN_PHOTOS,
    pref_require_bio: Boolean(profile.pref_require_bio),
    pref_require_video: Boolean(profile.pref_require_video),
    pref_require_instagram: Boolean(profile.pref_require_instagram),
    instagram_username:
      typeof profile.instagram_username === 'string' && profile.instagram_username.length > 0
        ? profile.instagram_username
        : null,
    video_intro_url: profile.video_intro_url
      ? normalizePhotoUrl(profile.video_intro_url)
      : null,
    quiz_answers: (profile.quiz_answers as Record<string, string>) ?? {},
    profile_prompts: Array.isArray(profile.profile_prompts) ? profile.profile_prompts : [],
    current_mood: profile.current_mood ?? null,
    mood_updated_at: profile.mood_updated_at ?? null,
    voice_bio_url: profile.voice_bio_url ?? null,
    vibe_clip_url: profile.vibe_clip_url ?? null,
    voice_vibe_summary: profile.voice_vibe_summary ?? null,
    last_active_at: profile.last_active_at ?? null,
    respectful_dater_badge: Boolean(profile.respectful_dater_badge),
    verification_status: profile.verification_status ?? 'none',
    pref_match_mood: Boolean(profile.pref_match_mood),
    pref_mood_filters: Array.isArray(profile.pref_mood_filters)
      ? profile.pref_mood_filters.filter((m): m is string => typeof m === 'string')
      : [],
  };
}

function sortPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function genderPreferencesMatch(a: UserProfile, b: UserProfile): boolean {
  if (!a.gender || !b.gender || !a.looking_for || !b.looking_for) return false;

  const aInterestedInB = a.looking_for === 'everyone' || a.looking_for === b.gender;
  const bInterestedInA = b.looking_for === 'everyone' || b.looking_for === a.gender;

  return aInterestedInB && bInterestedInA;
}

function matchesAgePreference(viewer: UserProfile, candidate: UserProfile): boolean {
  if (!viewer.is_premium) return true;

  const minAge = viewer.pref_age_min ?? DEFAULT_PREF_AGE_MIN;
  const maxAge = viewer.pref_age_max ?? DEFAULT_PREF_AGE_MAX;

  return candidate.age >= minAge && candidate.age <= maxAge;
}

function effectiveMinCompatibility(viewer: UserProfile): number {
  if (!viewer.is_premium) return COMPATIBILITY_THRESHOLD;
  return viewer.pref_min_compatibility ?? DEFAULT_PREF_MIN_COMPATIBILITY;
}

function matchesCompatibilityPreference(viewer: UserProfile, compatibilityScore: number): boolean {
  return compatibilityScore >= effectiveMinCompatibility(viewer);
}

function matchesInterestPreference(viewer: UserProfile, candidate: UserProfile): boolean {
  if (!viewer.is_premium) return true;

  const filters = viewer.pref_interest_filters ?? [];
  if (filters.length === 0) return true;

  return filters.some((interest) => candidate.interests.includes(interest));
}

function matchesPhotoPreference(viewer: UserProfile, candidate: UserProfile): boolean {
  const minPhotos = viewer.pref_min_photos ?? DEFAULT_PREF_MIN_PHOTOS;
  if (!viewer.is_premium && minPhotos > 2) return candidate.photos.length >= DEFAULT_PREF_MIN_PHOTOS;

  return candidate.photos.length >= minPhotos;
}

function matchesProfileQualityPreferences(viewer: UserProfile, candidate: UserProfile): boolean {
  if (viewer.pref_require_bio && candidate.bio.trim().length < 10) return false;

  if (viewer.pref_require_video) {
    if (!viewer.is_premium) return true;
    if (!candidate.video_intro_url) return false;
  }

  if (viewer.pref_require_instagram) {
    if (!viewer.is_premium) return true;
    if (!candidate.instagram_username) return false;
  }

  return true;
}

async function resetDailyLikesIfNeeded(profile: UserProfile): Promise<UserProfile> {
  const resetAt = new Date(profile.daily_likes_reset_at);
  const now = new Date();
  const isNewDay =
    resetAt.getUTCFullYear() !== now.getUTCFullYear() ||
    resetAt.getUTCMonth() !== now.getUTCMonth() ||
    resetAt.getUTCDate() !== now.getUTCDate();

  if (!isNewDay) return profile;

  const { data, error } = await supabase
    .from('profiles')
    .update({
      daily_likes_used: 0,
      daily_likes_reset_at: now.toISOString(),
    })
    .eq('id', profile.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return mapProfile(data);
}

export async function getProfileWithValidPhotos(userId: string): Promise<UserProfile | null> {
  const profile = await getProfile(userId);
  if (!profile) return null;

  const validPhotos = await filterValidPhotoUrls(profile.photos);
  if (validPhotos.length === profile.photos.length) {
    return profile;
  }

  return updateProfile(userId, { photos: validPhotos });
}

export async function canSwipe(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  isPremium: boolean;
}> {
  const profile = await getProfile(userId);
  if (!profile) return { allowed: false, remaining: 0, isPremium: false };

  const updated = await resetDailyLikesIfNeeded(profile);

  if (updated.is_premium) {
    return { allowed: true, remaining: Infinity, isPremium: true };
  }

  const remaining = Math.max(0, FREE_DAILY_LIKES - updated.daily_likes_used);
  return {
    allowed: remaining > 0,
    remaining,
    isPremium: false,
  };
}

export async function fetchCandidates(
  userId: string,
  radiusMi: number,
): Promise<Candidate[]> {
  if (USE_DISCOVERY_RPC) {
    try {
      return await fetchCandidatesViaRpc(userId, radiusMi);
    } catch {
      // Fall back to client-side filtering
    }
  }
  return fetchCandidatesClientSide(userId, radiusMi);
}

async function fetchCandidatesViaRpc(
  userId: string,
  radiusMi: number,
): Promise<Candidate[]> {
  const { data, error } = await supabase.rpc('get_discovery_candidates', {
    p_user_id: userId,
    p_radius_mi: radiusMi,
    p_limit: 50,
  });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const profile = mapProfile(record);
    const breakdown = record.ai_overall_score
      ? {
          overall_score: record.ai_overall_score as number,
          chemistry_score: (record.ai_chemistry_score as number) ?? 0,
          emotional_resonance: (record.ai_emotional_resonance as number) ?? 0,
          communication_compat: (record.ai_communication_compat as number) ?? 0,
          humor_alignment: (record.ai_humor_alignment as number) ?? 0,
        }
      : undefined;

    return {
      ...profile,
      distanceMi: record.distance_mi as number,
      quizScore: record.quiz_score as number,
      locationScore: record.location_score as number,
      compatibilityScore: (record.ai_overall_score as number) ?? (record.compatibility_score as number),
      compatibilityBreakdown: breakdown,
    };
  });
}

async function fetchCandidatesClientSide(
  userId: string,
  radiusMi: number,
): Promise<Candidate[]> {
  const currentUser = await getProfile(userId);
  if (
    !currentUser?.latitude ||
    !currentUser.longitude ||
    !currentUser.quiz_completed ||
    currentUser.quiz_vector.length === 0 ||
    !currentUser.gender ||
    !currentUser.looking_for
  ) {
    return [];
  }

  const effectiveRadius = currentUser.is_premium
    ? radiusMi
    : Math.min(radiusMi, FREE_MAX_RADIUS_MI);

  const [{ data: swipes }, { data: matches }] = await Promise.all([
    supabase.from('swipes').select('target_id').eq('user_id', userId),
    supabase
      .from('matches')
      .select('user_a, user_b')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`),
  ]);

  const excluded = new Set<string>([userId]);
  swipes?.forEach((s) => excluded.add(s.target_id));
  matches?.forEach((m) => {
    excluded.add(m.user_a === userId ? m.user_b : m.user_a);
  });

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('quiz_completed', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error) throw new Error(error.message);

  const now = Date.now();
  const candidates: Candidate[] = [];

  for (const row of profiles ?? []) {
    const profile = mapProfile(row);
    if (excluded.has(profile.id)) continue;
    if (!profile.latitude || !profile.longitude) continue;
    if (!profile.quiz_vector?.length) continue;
    if (!genderPreferencesMatch(currentUser, profile)) continue;
    if (!matchesAgePreference(currentUser, profile)) continue;
    if (!matchesPhotoPreference(currentUser, profile)) continue;
    if (!matchesInterestPreference(currentUser, profile)) continue;
    if (!matchesProfileQualityPreferences(currentUser, profile)) continue;

    const distanceMi = haversineMi(
      currentUser.latitude,
      currentUser.longitude,
      profile.latitude,
      profile.longitude,
    );

    if (distanceMi > effectiveRadius) continue;

    const qScore = quizSimilarity(currentUser.quiz_vector, profile.quiz_vector);
    const lScore = locationScore(distanceMi, effectiveRadius);
    const compatibilityScore = finalCompatibility(qScore, lScore);

    if (!matchesCompatibilityPreference(currentUser, compatibilityScore)) continue;

    const isBoosted =
      profile.boosted_until &&
      new Date(profile.boosted_until).getTime() > now;

    candidates.push({
      ...profile,
      distanceMi,
      quizScore: qScore,
      locationScore: lScore,
      compatibilityScore,
      ...(isBoosted ? { boosted_until: profile.boosted_until } : {}),
    });
  }

  candidates.sort((a, b) => {
    const aBoost =
      a.boosted_until && new Date(a.boosted_until).getTime() > now ? 1 : 0;
    const bBoost =
      b.boosted_until && new Date(b.boosted_until).getTime() > now ? 1 : 0;
    if (aBoost !== bBoost) return bBoost - aBoost;
    return b.compatibilityScore - a.compatibilityScore;
  });

  return candidates;
}

export async function recordSwipe(
  userId: string,
  targetId: string,
  direction: SwipeDirection,
): Promise<{ matched: boolean; matchId?: string }> {
  if (direction === 'like' || direction === 'super_like') {
    const swipeCheck = await canSwipe(userId);
    if (!swipeCheck.allowed) {
      throw new Error('Daily like limit reached');
    }
  }

  if (direction === 'super_like') {
    const profile = await getProfile(userId);
    if (!profile?.is_premium) {
      throw new Error('Super likes require HitItOff Pro');
    }
  }

  const { error: swipeError } = await supabase.from('swipes').upsert(
    {
      user_id: userId,
      target_id: targetId,
      direction,
    },
    { onConflict: 'user_id,target_id' },
  );

  if (swipeError) throw new Error(swipeError.message);

  if (direction === 'like' || direction === 'super_like') {
    const profile = await getProfile(userId);
    if (profile && !profile.is_premium) {
      await supabase
        .from('profiles')
        .update({ daily_likes_used: profile.daily_likes_used + 1 })
        .eq('id', userId);
    }

    await supabase.from('likes_received').upsert(
      {
        target_id: targetId,
        liker_id: userId,
        is_super_like: direction === 'super_like',
      },
      { onConflict: 'target_id,liker_id' },
    );

    const { data: mutualLike } = await supabase
      .from('swipes')
      .select('id')
      .eq('user_id', targetId)
      .eq('target_id', userId)
      .in('direction', ['like', 'super_like'])
      .maybeSingle();

    if (mutualLike) {
      const [user_a, user_b] = sortPair(userId, targetId);
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .upsert({ user_a, user_b }, { onConflict: 'user_a,user_b' })
        .select('id')
        .single();

      if (matchError) throw new Error(matchError.message);

      // Trigger AI compatibility compute in background
      computeCompatibility(userId, targetId).catch(() => {});

      return { matched: true, matchId: match.id };
    }
  }

  return { matched: false };
}

export async function createMatchFromLikedYou(
  userId: string,
  likerId: string,
): Promise<string> {
  const { data: like, error: likeError } = await supabase
    .from('likes_received')
    .select('liker_id')
    .eq('target_id', userId)
    .eq('liker_id', likerId)
    .maybeSingle();

  if (likeError) throw new Error(likeError.message);
  if (!like) throw new Error('This person has not liked you');

  const existingMatchId = await getMatchIdForUsers(userId, likerId);
  if (existingMatchId) return existingMatchId;

  const swipeCheck = await canSwipe(userId);
  if (!swipeCheck.allowed) {
    throw new Error('Daily like limit reached');
  }

  const { error: swipeError } = await supabase.from('swipes').upsert(
    {
      user_id: userId,
      target_id: likerId,
      direction: 'like',
    },
    { onConflict: 'user_id,target_id' },
  );

  if (swipeError) throw new Error(swipeError.message);

  const profile = await getProfile(userId);
  if (profile && !profile.is_premium) {
    await supabase
      .from('profiles')
      .update({ daily_likes_used: profile.daily_likes_used + 1 })
      .eq('id', userId);
  }

  const [user_a, user_b] = sortPair(userId, likerId);
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .upsert({ user_a, user_b }, { onConflict: 'user_a,user_b' })
    .select('id')
    .single();

  if (matchError) throw new Error(matchError.message);
  return match.id;
}

export async function getMatches(userId: string): Promise<MatchRecord[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const results: MatchRecord[] = [];

  for (const match of data ?? []) {
    const otherId = match.user_a === userId ? match.user_b : match.user_a;
    const otherUser = await getProfile(otherId);
    results.push({
      ...match,
      otherUser: otherUser ?? undefined,
    });
  }

  return results;
}

export async function getWhoLikedMe(userId: string): Promise<LikeReceived[]> {
  const { data, error } = await supabase
    .from('likes_received')
    .select('*')
    .eq('target_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const results: LikeReceived[] = [];
  for (const like of data ?? []) {
    const liker = await getProfile(like.liker_id);
    results.push({ ...like, liker: liker ?? undefined });
  }
  return results;
}

export async function applyBoost(userId: string): Promise<void> {
  const profile = await getProfile(userId);
  if (!profile?.is_premium) {
    throw new Error('Boost requires premium subscription');
  }

  const boostedUntil = new Date(
    Date.now() + 30 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase
    .from('profiles')
    .update({ boosted_until: boostedUntil })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

export async function updateProfile(
  userId: string,
  updates: Partial<
      Pick<
        UserProfile,
        | 'name'
        | 'age'
        | 'bio'
        | 'photos'
        | 'interests'
        | 'gender'
        | 'looking_for'
        | 'pref_age_min'
        | 'pref_age_max'
        | 'pref_min_compatibility'
        | 'pref_interest_filters'
        | 'pref_min_photos'
        | 'pref_require_bio'
        | 'pref_require_video'
        | 'pref_require_instagram'
        | 'video_intro_url'
        | 'instagram_username'
        | 'instagram_photos'
        | 'quiz_vector'
        | 'quiz_completed'
        | 'quiz_answers'
        | 'profile_prompts'
        | 'flirting_style'
        | 'humor_type'
        | 'current_mood'
        | 'mood_updated_at'
        | 'voice_bio_url'
        | 'vibe_clip_url'
        | 'voice_vibe_summary'
        | 'pref_match_mood'
        | 'pref_mood_filters'
        | 'verification_status'
      >
  >,
): Promise<UserProfile> {
  const payload = { ...updates } as Database['public']['Tables']['profiles']['Update'];
  if (updates.profile_prompts) {
    payload.profile_prompts = updates.profile_prompts as unknown as Database['public']['Tables']['profiles']['Update']['profile_prompts'];
  }
  if (updates.quiz_answers) {
    payload.quiz_answers = updates.quiz_answers as unknown as Database['public']['Tables']['profiles']['Update']['quiz_answers'];
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function syncPremiumStatus(
  userId: string,
  isPremium: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_premium: isPremium })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

export async function resetDiscover(
  userId: string,
  options?: { clearMatches?: boolean },
): Promise<void> {
  const clearMatches = options?.clearMatches ?? true;

  const { error: rpcError } = await supabase.rpc('dev_reset_discover', {
    clear_matches: clearMatches,
  });

  if (!rpcError) return;

  const { error: swipeError } = await supabase
    .from('swipes')
    .delete()
    .eq('user_id', userId);

  if (swipeError) throw new Error(swipeError.message);

  if (clearMatches) {
    const { error: matchError } = await supabase
      .from('matches')
      .delete()
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    if (matchError) throw new Error(matchError.message);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      daily_likes_used: 0,
      daily_likes_reset_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) throw new Error(profileError.message);
}

export async function getMatchIdForUsers(
  userId: string,
  otherUserId: string,
): Promise<string | null> {
  const [user_a, user_b] = sortPair(userId, otherUserId);
  const { data, error } = await supabase
    .from('matches')
    .select('id')
    .eq('user_a', user_a)
    .eq('user_b', user_b)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}
