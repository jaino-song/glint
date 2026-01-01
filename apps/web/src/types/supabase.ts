// 자동 생성된 Supabase 타입
// 실제 타입 생성: pnpm generate:types

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
          email: string;
          name: string | null;
          avatar_url: string | null;
          role: 'USER' | 'ADMIN';
          plan: 'FREE' | 'LIGHT' | 'PRO' | 'BUSINESS';
          credits: number;
          language: string;
          onboarding_completed: boolean;
          onboarding_step: number;
          notification_email: boolean;
          notification_push: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'USER' | 'ADMIN';
          plan?: 'FREE' | 'LIGHT' | 'PRO' | 'BUSINESS';
          credits?: number;
          language?: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          notification_email?: boolean;
          notification_push?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'USER' | 'ADMIN';
          plan?: 'FREE' | 'LIGHT' | 'PRO' | 'BUSINESS';
          credits?: number;
          language?: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          notification_email?: boolean;
          notification_push?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'user' | 'assistant' | 'system';
          type: 'text' | 'analysis_card' | 'error';
          content: string | null;
          analysis_ref_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: 'user' | 'assistant' | 'system';
          type: 'text' | 'analysis_card' | 'error';
          content?: string | null;
          analysis_ref_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'user' | 'assistant' | 'system';
          type?: 'text' | 'analysis_card' | 'error';
          content?: string | null;
          analysis_ref_id?: string | null;
          created_at?: string;
        };
      };
      analysis_results: {
        Row: {
          id: string;
          video_id: string;
          video_url: string;
          video_title: string | null;
          video_thumbnail: string | null;
          video_duration_seconds: number | null;
          mode: 'STANDARD' | 'DEEP';
          result_json: Json | null;
          transcript: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          video_url: string;
          video_title?: string | null;
          video_thumbnail?: string | null;
          video_duration_seconds?: number | null;
          mode: 'STANDARD' | 'DEEP';
          result_json?: Json | null;
          transcript?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          video_url?: string;
          video_title?: string | null;
          video_thumbnail?: string | null;
          video_duration_seconds?: number | null;
          mode?: 'STANDARD' | 'DEEP';
          result_json?: Json | null;
          transcript?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      analysis_jobs: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          video_url: string;
          video_id: string | null;
          mode: 'STANDARD' | 'DEEP';
          status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
          credits_reserved: number;
          result_id: string | null;
          error_message: string | null;
          error_code: string | null;
          progress: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          video_url: string;
          video_id?: string | null;
          mode: 'STANDARD' | 'DEEP';
          status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
          credits_reserved?: number;
          result_id?: string | null;
          error_message?: string | null;
          error_code?: string | null;
          progress?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          video_url?: string;
          video_id?: string | null;
          mode?: 'STANDARD' | 'DEEP';
          status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
          credits_reserved?: number;
          result_id?: string | null;
          error_message?: string | null;
          error_code?: string | null;
          progress?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: 'CHARGE' | 'USE' | 'REFUND' | 'EXPIRE' | 'BONUS' | 'REWARD';
          description: string | null;
          reference_id: string | null;
          reference_type: string | null;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: 'CHARGE' | 'USE' | 'REFUND' | 'EXPIRE' | 'BONUS' | 'REWARD';
          description?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          balance_after: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          type?: 'CHARGE' | 'USE' | 'REFUND' | 'EXPIRE' | 'BONUS' | 'REWARD';
          description?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          balance_after?: number;
          created_at?: string;
        };
      };
      ad_configs: {
        Row: {
          id: string;
          platform: 'web' | 'ios' | 'android';
          placement_type: 'banner' | 'interstitial' | 'rewarded' | 'native';
          position: string;
          unit_id: string;
          enabled: boolean;
          priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform: 'web' | 'ios' | 'android';
          placement_type: 'banner' | 'interstitial' | 'rewarded' | 'native';
          position: string;
          unit_id: string;
          enabled?: boolean;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          platform?: 'web' | 'ios' | 'android';
          placement_type?: 'banner' | 'interstitial' | 'rewarded' | 'native';
          position?: string;
          unit_id?: string;
          enabled?: boolean;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ad_frequency_configs: {
        Row: {
          id: string;
          platform: 'web' | 'ios' | 'android';
          interstitial_cooldown_ms: number;
          max_ads_per_session: number;
          feed_ad_interval: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform: 'web' | 'ios' | 'android';
          interstitial_cooldown_ms?: number;
          max_ads_per_session?: number;
          feed_ad_interval?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          platform?: 'web' | 'ios' | 'android';
          interstitial_cooldown_ms?: number;
          max_ads_per_session?: number;
          feed_ad_interval?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      deduct_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_description: string;
          p_reference_id?: string;
          p_reference_type?: string;
        };
        Returns: {
          success: boolean;
          new_balance: number;
          message: string;
        }[];
      };
      refund_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_description: string;
          p_reference_id?: string;
        };
        Returns: number;
      };
      should_show_ads: {
        Args: {
          p_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
