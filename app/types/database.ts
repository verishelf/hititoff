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
          pref_match_mood: boolean;
          pref_mood_filters: string[];
          latitude: number | null;
          longitude: number | null;
          location_updated_at: string | null;
          quiz_vector: number[];
          quiz_answers: Json;
          quiz_completed: boolean;
          profile_prompts: Json;
          flirting_style: string | null;
          humor_type: string | null;
          current_mood: string | null;
          mood_updated_at: string | null;
          voice_bio_url: string | null;
          vibe_clip_url: string | null;
          voice_vibe_summary: string | null;
          last_active_at: string | null;
          respectful_dater_badge: boolean;
          verification_status: string;
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
          pref_match_mood?: boolean;
          pref_mood_filters?: string[];
          latitude?: number | null;
          longitude?: number | null;
          location_updated_at?: string | null;
          quiz_vector?: number[];
          quiz_answers?: Json;
          quiz_completed?: boolean;
          profile_prompts?: Json;
          flirting_style?: string | null;
          humor_type?: string | null;
          current_mood?: string | null;
          mood_updated_at?: string | null;
          voice_bio_url?: string | null;
          vibe_clip_url?: string | null;
          voice_vibe_summary?: string | null;
          last_active_at?: string | null;
          respectful_dater_badge?: boolean;
          verification_status?: string;
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
          pref_match_mood?: boolean;
          pref_mood_filters?: string[];
          latitude?: number | null;
          longitude?: number | null;
          location_updated_at?: string | null;
          quiz_vector?: number[];
          quiz_answers?: Json;
          quiz_completed?: boolean;
          profile_prompts?: Json;
          flirting_style?: string | null;
          humor_type?: string | null;
          current_mood?: string | null;
          mood_updated_at?: string | null;
          voice_bio_url?: string | null;
          vibe_clip_url?: string | null;
          voice_vibe_summary?: string | null;
          last_active_at?: string | null;
          respectful_dater_badge?: boolean;
          verification_status?: string;
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
          message_type: string;
          audio_url: string | null;
          audio_duration_ms: number | null;
          moderation_status: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          text: string;
          read_by?: string[];
          created_at?: string;
          message_type?: string;
          audio_url?: string | null;
          audio_duration_ms?: number | null;
          moderation_status?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          text?: string;
          read_by?: string[];
          created_at?: string;
          message_type?: string;
          audio_url?: string | null;
          audio_duration_ms?: number | null;
          moderation_status?: string;
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
      compatibility_analytics: {
        Row: {
          user_a: string;
          user_b: string;
          overall_score: number;
          chemistry_score: number;
          emotional_resonance: number;
          communication_compat: number;
          humor_alignment: number;
          factors: Json;
          computed_at: string;
        };
        Insert: {
          user_a: string;
          user_b: string;
          overall_score?: number;
          chemistry_score?: number;
          emotional_resonance?: number;
          communication_compat?: number;
          humor_alignment?: number;
          factors?: Json;
          computed_at?: string;
        };
        Update: {
          user_a?: string;
          user_b?: string;
          overall_score?: number;
          chemistry_score?: number;
          emotional_resonance?: number;
          communication_compat?: number;
          humor_alignment?: number;
          factors?: Json;
          computed_at?: string;
        };
        Relationships: [];
      };
      match_chemistry: {
        Row: {
          match_id: string;
          spark_meter: number;
          response_speed_score: number;
          engagement_score: number;
          depth_score: number;
          humor_alignment: number;
          mutual_energy: number;
          updated_at: string;
        };
        Insert: {
          match_id: string;
          spark_meter?: number;
          response_speed_score?: number;
          engagement_score?: number;
          depth_score?: number;
          humor_alignment?: number;
          mutual_energy?: number;
          updated_at?: string;
        };
        Update: {
          match_id?: string;
          spark_meter?: number;
          response_speed_score?: number;
          engagement_score?: number;
          depth_score?: number;
          humor_alignment?: number;
          mutual_energy?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      chemistry_events: {
        Row: {
          id: string;
          match_id: string;
          event_type: string;
          delta: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          event_type: string;
          delta?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          event_type?: string;
          delta?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      user_blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          details: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          details?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reported_id?: string;
          reason?: string;
          details?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      quick_response_log: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          template_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          template_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          template_key?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_usage_daily: {
        Row: {
          user_id: string;
          feature: string;
          count: number;
          date: string;
        };
        Insert: {
          user_id: string;
          feature: string;
          count?: number;
          date?: string;
        };
        Update: {
          user_id?: string;
          feature?: string;
          count?: number;
          date?: string;
        };
        Relationships: [];
      };
      date_suggestions_cache: {
        Row: {
          match_id: string;
          suggestions: Json;
          expires_at: string;
        };
        Insert: {
          match_id: string;
          suggestions?: Json;
          expires_at: string;
        };
        Update: {
          match_id?: string;
          suggestions?: Json;
          expires_at?: string;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          id: string;
          user_id: string;
          selfie_url: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          selfie_url: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          selfie_url?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profile_phones: {
        Row: {
          user_id: string;
          phone_number: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          phone_number: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          phone_number?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      match_phone_shares: {
        Row: {
          match_id: string;
          user_id: string;
          shared_at: string;
        };
        Insert: {
          match_id: string;
          user_id: string;
          shared_at?: string;
        };
        Update: {
          match_id?: string;
          user_id?: string;
          shared_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_discovery_candidates: {
        Args: {
          p_user_id: string;
          p_radius_mi?: number;
          p_limit?: number;
        };
        Returns: Json[];
      };
      compute_match_chemistry: {
        Args: { p_match_id: string };
        Returns: undefined;
      };
      increment_ai_usage: {
        Args: { p_feature: string };
        Returns: number;
      };
      is_blocked: {
        Args: { user_a: string; user_b: string };
        Returns: boolean;
      };
      update_respectful_dater_badge: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      dev_reset_discover: {
        Args: { clear_matches?: boolean };
        Returns: undefined;
      };
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      get_phone_exchange_status: {
        Args: { p_match_id: string };
        Returns: {
          i_shared: boolean;
          they_shared: boolean;
          their_phone: string | null;
          my_phone: string | null;
        }[];
      };
      share_phone_with_match: {
        Args: { p_match_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
