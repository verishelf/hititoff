import type { Gender, LookingFor } from '../utils/constants';
import type { MoodId } from '../utils/moodData';
import type { ProfilePrompt } from '../utils/profilePrompts';
import type { CompatibilityBreakdown } from '../services/aiService';

export type SwipeDirection = 'like' | 'pass' | 'super_like';

export type MessageType = 'text' | 'voice' | 'quick_response' | 'date_invite';

export type VerificationStatus = 'none' | 'pending' | 'verified';

export interface DiscoveryPreferencesValue {
  looking_for: LookingFor;
  pref_age_min: number;
  pref_age_max: number;
  pref_min_compatibility: number;
  pref_interest_filters: string[];
  pref_min_photos: number;
  pref_require_bio: boolean;
  pref_require_video: boolean;
  pref_require_instagram: boolean;
  pref_match_mood?: boolean;
  pref_mood_filters?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  interests: string[];
  gender: Gender | null;
  looking_for: LookingFor | null;
  pref_age_min: number;
  pref_age_max: number;
  pref_min_compatibility: number;
  pref_interest_filters: string[];
  pref_min_photos: number;
  pref_require_bio: boolean;
  pref_require_video: boolean;
  pref_require_instagram: boolean;
  pref_match_mood?: boolean;
  pref_mood_filters?: string[];
  latitude: number | null;
  longitude: number | null;
  location_updated_at: string | null;
  quiz_vector: number[];
  quiz_answers?: Record<string, string>;
  quiz_completed: boolean;
  profile_prompts?: ProfilePrompt[];
  flirting_style?: string | null;
  humor_type?: string | null;
  current_mood?: MoodId | null;
  mood_updated_at?: string | null;
  voice_bio_url?: string | null;
  vibe_clip_url?: string | null;
  voice_vibe_summary?: string | null;
  last_active_at?: string | null;
  respectful_dater_badge?: boolean;
  verification_status?: VerificationStatus;
  daily_likes_used: number;
  daily_likes_reset_at: string;
  boosts_remaining: number;
  super_likes_remaining: number;
  boosted_until: string | null;
  is_premium: boolean;
  video_intro_url: string | null;
  instagram_username: string | null;
  instagram_photos: string[];
  phone_number?: string | null;
  created_at: string;
}

export interface Candidate extends UserProfile {
  distanceMi: number;
  compatibilityScore: number;
  quizScore: number;
  locationScore: number;
  compatibilityBreakdown?: CompatibilityBreakdown;
}

export interface MatchRecord {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  last_message_at: string | null;
  otherUser?: UserProfile;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  text: string;
  read_by: string[];
  created_at: string;
  message_type?: MessageType;
  audio_url?: string | null;
  audio_duration_ms?: number | null;
  moderation_status?: string;
}

export interface LikeReceived {
  target_id: string;
  liker_id: string;
  is_super_like: boolean;
  created_at: string;
  liker?: UserProfile;
}

export interface InboxDateInvite {
  messageId: string;
  matchId: string;
  senderId: string;
  when: string;
  reason: string;
  createdAt: string;
  isUnread: boolean;
  otherUser?: UserProfile;
}

export type { CompatibilityBreakdown };

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Quiz: undefined;
  Main: undefined;
  Chat: {
    matchId: string;
    otherUserName: string;
    otherUserId: string;
    otherUserInterests?: string[];
  };
  Paywall: undefined;
  CustomerCenter: undefined;
  PracticeMode: undefined;
  UserProfile: {
    userId: string;
    name: string;
    age: number;
    bio: string;
    interests: string[];
    photos: string[];
    videoIntroUrl?: string | null;
    instagramUsername?: string | null;
    instagramPhotos?: string[];
    distanceMi?: number;
    compatibilityScore?: number;
    matchId?: string;
    fromLikedYou?: boolean;
    currentMood?: MoodId | null;
    voiceBioUrl?: string | null;
    voiceVibeSummary?: string | null;
    respectfulDaterBadge?: boolean;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Swipe: undefined;
  Matches: undefined;
  Profile: { edit?: boolean } | undefined;
};
