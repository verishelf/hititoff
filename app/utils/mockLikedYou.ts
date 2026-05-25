import type { LikeReceived, UserProfile } from '../types';

function mockLiker(id: string, name: string, age: number, photo: string): UserProfile {
  return {
    id,
    name,
    age,
    bio: 'Dev mock profile for Liked You preview.',
    photos: [photo],
    interests: ['coffee', 'travel'],
    gender: null,
    looking_for: null,
    pref_age_min: 18,
    pref_age_max: 55,
    pref_min_compatibility: 70,
    pref_interest_filters: [],
    pref_min_photos: 1,
    pref_require_bio: false,
    pref_require_video: false,
    pref_require_instagram: false,
    latitude: null,
    longitude: null,
    location_updated_at: null,
    quiz_vector: [],
    quiz_completed: false,
    daily_likes_used: 0,
    daily_likes_reset_at: new Date().toISOString(),
    boosts_remaining: 0,
    super_likes_remaining: 0,
    boosted_until: null,
    is_premium: false,
    video_intro_url: null,
    instagram_username: null,
    instagram_photos: [],
    created_at: new Date().toISOString(),
  };
}

const MOCK_LIKERS = [
  mockLiker(
    'dev-mock-liker-1',
    'Maya',
    24,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  ),
  mockLiker(
    'dev-mock-liker-2',
    'Jordan',
    27,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  ),
  mockLiker(
    'dev-mock-liker-3',
    'Sofia',
    26,
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  ),
  mockLiker(
    'dev-mock-liker-4',
    'Alex',
    29,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  ),
  mockLiker(
    'dev-mock-liker-5',
    'Priya',
    25,
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
  ),
];

export const DEV_MOCK_LIKES_RECEIVED: LikeReceived[] = MOCK_LIKERS.map((liker, index) => ({
  target_id: 'dev-mock-target',
  liker_id: liker.id,
  is_super_like: index === 2,
  created_at: new Date(Date.now() - index * 3600000).toISOString(),
  liker,
}));

export function getDevMockLikesReceived(realLikes: LikeReceived[]): LikeReceived[] {
  if (!__DEV__ || realLikes.length > 0) return realLikes;
  return DEV_MOCK_LIKES_RECEIVED;
}
