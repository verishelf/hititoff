import { create } from 'zustand';
import type { QuizAnswers } from '../utils/quizScoring';
import { buildQuizVector } from '../utils/quizScoring';
import { updateUserLocation } from '../services/locationService';
import {
  getProfile,
  getProfileWithValidPhotos,
  updateProfile,
  uploadProfilePhoto,
} from '../services/matchService';
import { getOwnPhone, upsertOwnPhone } from '../services/phoneService';
import type { RadiusMi, Gender, LookingFor } from '../utils/constants';
import type { UserProfile } from '../types';
import type { DiscoveryPreferencesValue } from '../types';

interface UserState {
  profile: UserProfile | null;
  radiusMi: RadiusMi;
  isLoading: boolean;
  error: string | null;
  setRadius: (radius: RadiusMi) => void;
  loadProfile: (userId: string) => Promise<void>;
  saveOnboarding: (
    userId: string,
    data: {
      name: string;
      age: number;
      bio: string;
      interests: string[];
      gender: Gender;
      looking_for: LookingFor;
      photoUris: string[];
      photoMimeTypes?: string[];
      profilePrompts?: { prompt: string; answer: string }[];
      phoneNumber?: string;
    },
  ) => Promise<void>;
  completeQuiz: (userId: string, answers: QuizAnswers) => Promise<void>;
  updateUserProfile: (
    userId: string,
    updates: Partial<
      Pick<
        UserProfile,
        | 'name'
        | 'age'
        | 'bio'
        | 'interests'
        | 'photos'
        | 'video_intro_url'
        | 'instagram_username'
        | 'instagram_photos'
        | 'looking_for'
        | 'pref_age_min'
        | 'pref_age_max'
        | 'profile_prompts'
        | 'current_mood'
        | 'voice_bio_url'
        | 'vibe_clip_url'
        | 'voice_vibe_summary'
      >
    >,
  ) => Promise<void>;
  updateDiscoveryPreferences: (
    userId: string,
    preferences: DiscoveryPreferencesValue,
  ) => Promise<void>;
  refreshLocation: (userId: string) => Promise<void>;
  clear: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  radiusMi: 5,
  isLoading: false,
  error: null,

  setRadius: (radius) => set({ radiusMi: radius }),

  loadProfile: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const [profile, phoneNumber] = await Promise.all([
        getProfileWithValidPhotos(userId),
        getOwnPhone(userId),
      ]);
      set({
        profile: profile ? { ...profile, phone_number: phoneNumber } : null,
        isLoading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to load profile',
        isLoading: false,
      });
    }
  },

  saveOnboarding: async (userId, data) => {
    set({ isLoading: true, error: null });
    try {
      const photoUrls: string[] = [];
      for (let i = 0; i < data.photoUris.length; i++) {
        const url = await uploadProfilePhoto(
          userId,
          data.photoUris[i],
          i,
          data.photoMimeTypes?.[i],
        );
        photoUrls.push(url);
      }

      const profile = await updateProfile(userId, {
        name: data.name,
        age: data.age,
        bio: data.bio,
        interests: data.interests,
        gender: data.gender,
        looking_for: data.looking_for,
        photos: photoUrls,
        profile_prompts: data.profilePrompts ?? [],
      });

      await updateUserLocation(userId);
      if (data.phoneNumber?.trim()) {
        await upsertOwnPhone(userId, data.phoneNumber.trim());
      }
      const refreshed = await getProfile(userId);
      const phoneNumber = await getOwnPhone(userId);
      set({
        profile: refreshed ? { ...refreshed, phone_number: phoneNumber } : profile,
        isLoading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to save profile',
        isLoading: false,
      });
      throw e;
    }
  },

  completeQuiz: async (userId, answers) => {
    set({ isLoading: true, error: null });
    try {
      const quiz_vector = buildQuizVector(answers);
      const profile = await updateProfile(userId, {
        quiz_vector,
        quiz_completed: true,
        quiz_answers: answers,
      });
      set({ profile, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to save quiz',
        isLoading: false,
      });
      throw e;
    }
  },

  updateUserProfile: async (userId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await updateProfile(userId, updates);
      set({ profile, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to update profile',
        isLoading: false,
      });
      throw e;
    }
  },

  updateDiscoveryPreferences: async (userId, preferences) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await updateProfile(userId, {
        looking_for: preferences.looking_for,
        pref_age_min: preferences.pref_age_min,
        pref_age_max: preferences.pref_age_max,
        pref_min_compatibility: preferences.pref_min_compatibility,
        pref_interest_filters: preferences.pref_interest_filters,
        pref_min_photos: preferences.pref_min_photos,
        pref_require_bio: preferences.pref_require_bio,
        pref_require_video: preferences.pref_require_video,
        pref_require_instagram: preferences.pref_require_instagram,
        pref_match_mood: preferences.pref_match_mood,
        pref_mood_filters: preferences.pref_mood_filters,
      });
      set({ profile, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to update preferences',
        isLoading: false,
      });
      throw e;
    }
  },

  refreshLocation: async (userId) => {
    await updateUserLocation(userId);
    const profile = await getProfile(userId);
    if (profile) set({ profile });
  },

  clear: () => set({ profile: null, error: null }),
}));
