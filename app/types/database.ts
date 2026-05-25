export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          age: number;
          bio: string;
          photos: string[];
          interests: string[];
          gender: string | null;
          looking_for: string | null;
          pref_age_min: number;
          pref_age_max: number;
          pref_min_compatibility: number;
          pref_interest_filters: string[];
          pref_min_photos: number;
          pref_require_bio: boolean;
          pref_require_video: boolean;
          pref_require_instagram: boolean;
          latitude: number | null;
          longitude: number | null;
          location_updated_at: string | null;
          quiz_vector: number[];
          quiz_completed: boolean;
          daily_likes_used: number;
          daily_likes_reset_at: string;
          boosts_remaining: number;
          super_likes_remaining: number;
          boosted_until: string | null;
          is_premium: boolean;
          video_intro_url: string | null;
          instagram_username: string | null;
          instagram_photos: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          age: number;
          bio?: string;
          photos?: string[];
          interests?: string[];
          gender?: string | null;
          looking_for?: string | null;
          pref_age_min?: number;
          pref_age_max?: number;
          pref_min_compatibility?: number;
          pref_interest_filters?: string[];
          pref_min_photos?: number;
          pref_require_bio?: boolean;
          pref_require_video?: boolean;
          pref_require_instagram?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          location_updated_at?: string | null;
          quiz_vector?: number[];
          quiz_completed?: boolean;
          daily_likes_used?: number;
          daily_likes_reset_at?: string;
          boosts_remaining?: number;
          super_likes_remaining?: number;
          boosted_until?: string | null;
          is_premium?: boolean;
          video_intro_url?: string | null;
          instagram_username?: string | null;
          instagram_photos?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          age?: number;
          bio?: string;
          photos?: string[];
          interests?: string[];
          gender?: string | null;
          looking_for?: string | null;
          pref_age_min?: number;
          pref_age_max?: number;
          pref_min_compatibility?: number;
          pref_interest_filters?: string[];
          pref_min_photos?: number;
          pref_require_bio?: boolean;
          pref_require_video?: boolean;
          pref_require_instagram?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          location_updated_at?: string | null;
          quiz_vector?: number[];
          quiz_completed?: boolean;
          daily_likes_used?: number;
          daily_likes_reset_at?: string;
          boosts_remaining?: number;
          super_likes_remaining?: number;
          boosted_until?: string | null;
          is_premium?: boolean;
          video_intro_url?: string | null;
          instagram_username?: string | null;
          instagram_photos?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      swipes: {
        Row: {
          id: string;
          user_id: string;
          target_id: string;
          direction: 'like' | 'pass' | 'super_like';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_id: string;
          direction: 'like' | 'pass' | 'super_like';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_id?: string;
          direction?: 'like' | 'pass' | 'super_like';
          created_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          user_a: string;
          user_b: string;
          created_at: string;
          last_message_at: string | null;
        };
        Insert: {
          id?: string;
          user_a: string;
          user_b: string;
          created_at?: string;
          last_message_at?: string | null;
        };
        Update: {
          id?: string;
          user_a?: string;
          user_b?: string;
          created_at?: string;
          last_message_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          text: string;
          read_by: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          text: string;
          read_by?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          text?: string;
          read_by?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      likes_received: {
        Row: {
          target_id: string;
          liker_id: string;
          is_super_like: boolean;
          created_at: string;
        };
        Insert: {
          target_id: string;
          liker_id: string;
          is_super_like?: boolean;
          created_at?: string;
        };
        Update: {
          target_id?: string;
          liker_id?: string;
          is_super_like?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
