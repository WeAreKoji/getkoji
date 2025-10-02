export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      creator_id_verification: {
        Row: {
          created_at: string | null
          creator_id: string
          date_of_birth: string
          document_back_url: string | null
          document_front_url: string
          document_number: string
          document_type: string
          full_name: string
          id: string
          ip_address: unknown | null
          issuing_country: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          date_of_birth: string
          document_back_url?: string | null
          document_front_url: string
          document_number: string
          document_type: string
          full_name: string
          id?: string
          ip_address?: unknown | null
          issuing_country: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url: string
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          date_of_birth?: string
          document_back_url?: string | null
          document_front_url?: string
          document_number?: string
          document_type?: string
          full_name?: string
          id?: string
          ip_address?: unknown | null
          issuing_country?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      creator_posts: {
        Row: {
          content: string | null
          created_at: string | null
          creator_id: string
          id: string
          media_type: string | null
          media_url: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          moderation_status: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          created_at: string | null
          id: string
          id_verification_date: string | null
          id_verified: boolean | null
          payouts_enabled: boolean | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          subscriber_count: number | null
          subscription_price: number
          total_earnings: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_verification_date?: string | null
          id_verified?: boolean | null
          payouts_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subscriber_count?: number | null
          subscription_price: number
          total_earnings?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          id_verification_date?: string | null
          id_verified?: boolean | null
          payouts_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subscriber_count?: number | null
          subscription_price?: number
          total_earnings?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_referral_commissions: {
        Row: {
          commission_amount: number
          commission_date: string | null
          created_at: string | null
          creator_earnings_amount: number
          creator_referral_id: string
          id: string
          included_in_payout_id: string | null
          invoice_id: string
          platform_revenue_id: string | null
          subscription_id: string | null
        }
        Insert: {
          commission_amount: number
          commission_date?: string | null
          created_at?: string | null
          creator_earnings_amount: number
          creator_referral_id: string
          id?: string
          included_in_payout_id?: string | null
          invoice_id: string
          platform_revenue_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          commission_amount?: number
          commission_date?: string | null
          created_at?: string | null
          creator_earnings_amount?: number
          creator_referral_id?: string
          id?: string
          included_in_payout_id?: string | null
          invoice_id?: string
          platform_revenue_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_referral_commissions_creator_referral_id_fkey"
            columns: ["creator_referral_id"]
            isOneToOne: false
            referencedRelation: "creator_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_referral_commissions_platform_revenue_id_fkey"
            columns: ["platform_revenue_id"]
            isOneToOne: false
            referencedRelation: "platform_revenue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_referral_commissions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_referral_payouts: {
        Row: {
          amount: number
          commission_ids: Json | null
          created_at: string | null
          currency: string
          id: string
          minimum_threshold_met_at: string | null
          payout_method: string | null
          processed_at: string | null
          referrer_id: string
          status: string
          stripe_transfer_id: string | null
        }
        Insert: {
          amount: number
          commission_ids?: Json | null
          created_at?: string | null
          currency?: string
          id?: string
          minimum_threshold_met_at?: string | null
          payout_method?: string | null
          processed_at?: string | null
          referrer_id: string
          status?: string
          stripe_transfer_id?: string | null
        }
        Update: {
          amount?: number
          commission_ids?: Json | null
          created_at?: string | null
          currency?: string
          id?: string
          minimum_threshold_met_at?: string | null
          payout_method?: string | null
          processed_at?: string | null
          referrer_id?: string
          status?: string
          stripe_transfer_id?: string | null
        }
        Relationships: []
      }
      creator_referrals: {
        Row: {
          activated_at: string | null
          commission_duration_months: number
          commission_percentage: number
          created_at: string | null
          expires_at: string | null
          id: string
          last_commission_date: string | null
          referral_code: string
          referred_creator_id: string
          referrer_id: string
          status: string
          total_commission_earned: number | null
          total_earnings_tracked: number | null
        }
        Insert: {
          activated_at?: string | null
          commission_duration_months?: number
          commission_percentage?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_commission_date?: string | null
          referral_code: string
          referred_creator_id: string
          referrer_id: string
          status?: string
          total_commission_earned?: number | null
          total_earnings_tracked?: number | null
        }
        Update: {
          activated_at?: string | null
          commission_duration_months?: number
          commission_percentage?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_commission_date?: string | null
          referral_code?: string
          referred_creator_id?: string
          referrer_id?: string
          status?: string
          total_commission_earned?: number | null
          total_earnings_tracked?: number | null
        }
        Relationships: []
      }
      failed_transfers: {
        Row: {
          amount: number
          created_at: string | null
          creator_id: string
          currency: string
          error_message: string
          id: string
          invoice_id: string
          last_retry_at: string | null
          metadata: Json | null
          resolved_at: string | null
          retry_count: number | null
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          creator_id: string
          currency: string
          error_message: string
          id?: string
          invoice_id: string
          last_retry_at?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          retry_count?: number | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          creator_id?: string
          currency?: string
          error_message?: string
          id?: string
          invoice_id?: string
          last_retry_at?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          retry_count?: number | null
          subscription_id?: string | null
        }
        Relationships: []
      }
      interests: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          matched_at: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          id?: string
          matched_at?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          id?: string
          matched_at?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_scanned: boolean | null
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_scanned?: boolean | null
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_scanned?: boolean | null
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_revenue: {
        Row: {
          created_at: string | null
          creator_earnings: number
          creator_id: string
          gross_amount: number
          id: string
          invoice_id: string
          platform_commission: number
          stripe_fee: number
          subscription_id: string | null
        }
        Insert: {
          created_at?: string | null
          creator_earnings: number
          creator_id: string
          gross_amount: number
          id?: string
          invoice_id: string
          platform_commission: number
          stripe_fee: number
          subscription_id?: string | null
        }
        Update: {
          created_at?: string | null
          creator_earnings?: number
          creator_id?: string
          gross_amount?: number
          id?: string
          invoice_id?: string
          platform_commission?: number
          stripe_fee?: number
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_revenue_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          created_at: string | null
          id: string
          order_index: number
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_index: number
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_index?: number
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          id: string
          profile_id: string
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string
          email: string
          id: string
          intent: Database["public"]["Enums"]["user_intent"]
          privacy_settings: Json | null
          updated_at: string | null
          username: string | null
          username_updated_at: string | null
        }
        Insert: {
          age: number
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name: string
          email: string
          id: string
          intent: Database["public"]["Enums"]["user_intent"]
          privacy_settings?: Json | null
          updated_at?: string | null
          username?: string | null
          username_updated_at?: string | null
        }
        Update: {
          age?: number
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          intent?: Database["public"]["Enums"]["user_intent"]
          privacy_settings?: Json | null
          updated_at?: string | null
          username?: string | null
          username_updated_at?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          referral_type: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          referral_type?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          referral_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_fraud_checks: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          flag_reason: string | null
          flagged: boolean | null
          id: string
          ip_address: string | null
          referral_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          id?: string
          ip_address?: string | null
          referral_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          id?: string
          ip_address?: string | null
          referral_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_fraud_checks_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "creator_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          amount: number
          claimed_at: string | null
          created_at: string | null
          id: string
          referral_id: string | null
          reward_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          referral_id?: string | null
          reward_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          referral_id?: string | null
          reward_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          status?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          creator_id: string
          expires_at: string | null
          id: string
          pause_until: string | null
          previous_price: number | null
          started_at: string | null
          status: string | null
          stripe_subscription_id: string | null
          subscriber_id: string
        }
        Insert: {
          creator_id: string
          expires_at?: string | null
          id?: string
          pause_until?: string | null
          previous_price?: number | null
          started_at?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          subscriber_id: string
        }
        Update: {
          creator_id?: string
          expires_at?: string | null
          id?: string
          pause_until?: string | null
          previous_price?: number | null
          started_at?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          created_at: string | null
          id: string
          is_like: boolean
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_like: boolean
          swiped_id: string
          swiper_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_like?: boolean
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_swiped_id_fkey"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          balance: number
          id: string
          total_earned: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          total_earned?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          total_earned?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          created_at: string | null
          id: string
          interest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
          verified_at: string | null
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
          verified_at?: string | null
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_creator_referral: {
        Args: { referral_id: string }
        Returns: undefined
      }
      add_creator_earnings: {
        Args: { amount: number; creator_user_id: string }
        Returns: undefined
      }
      check_expired_referrals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_username_available: {
        Args: { desired_username: string }
        Returns: boolean
      }
      complete_referral: {
        Args: { referral_uuid: string }
        Returns: undefined
      }
      decrement_subscriber_count: {
        Args: { creator_user_id: string }
        Returns: undefined
      }
      generate_referral_code: {
        Args: { user_username: string }
        Returns: string
      }
      get_discover_profiles: {
        Args: { max_count?: number; user_id: string }
        Returns: {
          age: number
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string
          email: string
          id: string
          intent: Database["public"]["Enums"]["user_intent"]
          privacy_settings: Json | null
          updated_at: string | null
          username: string | null
          username_updated_at: string | null
        }[]
      }
      get_moderation_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          approved_posts: number
          pending_posts: number
          rejected_posts: number
          total_posts: number
        }[]
      }
      get_verification_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          approved_verifications: number
          pending_verifications: number
          rejected_verifications: number
          total_verifications: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_subscriber_count: {
        Args: { creator_user_id: string }
        Returns: undefined
      }
      is_creator_verified: {
        Args: { creator_user_id: string }
        Returns: boolean
      }
      process_referral_payout: {
        Args: { referrer_user_id: string }
        Returns: string
      }
      request_creator_role: {
        Args: { application_text: string }
        Returns: Json
      }
    }
    Enums: {
      user_intent: "support_creators" | "make_friends" | "open_to_dating"
      user_role: "user" | "creator" | "admin"
      verification_status: "pending" | "under_review" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_intent: ["support_creators", "make_friends", "open_to_dating"],
      user_role: ["user", "creator", "admin"],
      verification_status: ["pending", "under_review", "approved", "rejected"],
    },
  },
} as const
