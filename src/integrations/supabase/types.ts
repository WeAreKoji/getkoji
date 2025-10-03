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
      account_lockouts: {
        Row: {
          failed_attempts: number
          id: string
          last_failed_attempt: string | null
          locked_at: string | null
          metadata: Json | null
          reason: string
          unlock_at: string
          unlock_method: string | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          failed_attempts?: number
          id?: string
          last_failed_attempt?: string | null
          locked_at?: string | null
          metadata?: Json | null
          reason: string
          unlock_at: string
          unlock_method?: string | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          failed_attempts?: number
          id?: string
          last_failed_attempt?: string | null
          locked_at?: string | null
          metadata?: Json | null
          reason?: string
          unlock_at?: string
          unlock_method?: string | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_acceptances: {
        Row: {
          accepted_at: string | null
          document_type: string
          document_version: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          document_type: string
          document_version: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          document_type?: string
          document_version?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_flags: {
        Row: {
          ai_analysis: Json | null
          auto_action: string | null
          confidence_score: number
          content_id: string
          content_type: string
          created_at: string | null
          flag_type: string
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          ai_analysis?: Json | null
          auto_action?: string | null
          confidence_score: number
          content_id: string
          content_type: string
          created_at?: string | null
          flag_type: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          ai_analysis?: Json | null
          auto_action?: string | null
          confidence_score?: number
          content_id?: string
          content_type?: string
          created_at?: string | null
          flag_type?: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          action_taken: string | null
          content_id: string
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          priority: string
          report_category: string
          reporter_id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          action_taken?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          priority?: string
          report_category: string
          reporter_id: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          action_taken?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          priority?: string
          report_category?: string
          reporter_id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
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
          last_document_access: string | null
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
          last_document_access?: string | null
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
          last_document_access?: string | null
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
          scheduled_publish_at: string | null
          status: string | null
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
          scheduled_publish_at?: string | null
          status?: string | null
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
          scheduled_publish_at?: string | null
          status?: string | null
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
          card_style: Json | null
          cover_image_url: string | null
          created_at: string | null
          id: string
          id_verification_date: string | null
          id_verified: boolean | null
          payouts_enabled: boolean | null
          showcase_bio: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          subscriber_count: number | null
          subscription_price: number
          tagline: string | null
          total_earnings: number | null
          user_id: string
          welcome_video_url: string | null
        }
        Insert: {
          card_style?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          id_verification_date?: string | null
          id_verified?: boolean | null
          payouts_enabled?: boolean | null
          showcase_bio?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subscriber_count?: number | null
          subscription_price: number
          tagline?: string | null
          total_earnings?: number | null
          user_id: string
          welcome_video_url?: string | null
        }
        Update: {
          card_style?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          id_verification_date?: string | null
          id_verified?: boolean | null
          payouts_enabled?: boolean | null
          showcase_bio?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subscriber_count?: number | null
          subscription_price?: number
          tagline?: string | null
          total_earnings?: number | null
          user_id?: string
          welcome_video_url?: string | null
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
      discovery_preferences: {
        Row: {
          created_at: string | null
          id: string
          interested_in: string[] | null
          interested_in_gender: string[] | null
          max_age: number | null
          max_distance_km: number | null
          min_age: number | null
          show_creators_only: boolean | null
          show_non_creators: boolean | null
          show_verified_only: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interested_in?: string[] | null
          interested_in_gender?: string[] | null
          max_age?: number | null
          max_distance_km?: number | null
          min_age?: number | null
          show_creators_only?: boolean | null
          show_non_creators?: boolean | null
          show_verified_only?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interested_in?: string[] | null
          interested_in_gender?: string[] | null
          max_age?: number | null
          max_distance_km?: number | null
          min_age?: number | null
          show_creators_only?: boolean | null
          show_non_creators?: boolean | null
          show_verified_only?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          amount: number
          created_at: string | null
          creator_id: string
          evidence: Json | null
          id: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string | null
          stripe_dispute_id: string | null
          subscriber_id: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          creator_id: string
          evidence?: Json | null
          id?: string
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          stripe_dispute_id?: string | null
          subscriber_id: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          creator_id?: string
          evidence?: Json | null
          id?: string
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          stripe_dispute_id?: string | null
          subscriber_id?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_ip_whitelist: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          ip_address: unknown
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
        }
        Relationships: []
      }
      document_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string | null
          document_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          verification_id: string
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string | null
          document_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          verification_id: string
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string | null
          document_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_logs_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "creator_id_verification"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_permissions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          permission_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permission_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permission_type?: string
          user_id?: string
        }
        Relationships: []
      }
      document_access_tokens: {
        Row: {
          created_at: string | null
          created_by: string
          document_type: string
          expires_at: string
          id: string
          ip_address: unknown | null
          token: string
          used_at: string | null
          user_agent: string | null
          verification_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          document_type: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          token: string
          used_at?: string | null
          user_agent?: string | null
          verification_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          document_type?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          token?: string
          used_at?: string | null
          user_agent?: string | null
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_tokens_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "creator_id_verification"
            referencedColumns: ["id"]
          },
        ]
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
      moderation_actions: {
        Row: {
          action_type: string
          content_id: string
          content_type: string
          created_at: string | null
          details: Json | null
          id: string
          moderator_id: string
          reason: string
          related_flag_id: string | null
          related_report_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          content_id: string
          content_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          moderator_id: string
          reason: string
          related_flag_id?: string | null
          related_report_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          content_id?: string
          content_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          moderator_id?: string
          reason?: string
          related_flag_id?: string | null
          related_report_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_related_flag_id_fkey"
            columns: ["related_flag_id"]
            isOneToOne: false
            referencedRelation: "content_flags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_related_report_id_fkey"
            columns: ["related_report_id"]
            isOneToOne: false
            referencedRelation: "content_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_notes: {
        Row: {
          created_at: string | null
          id: string
          moderator_id: string
          note: string
          post_id: string | null
          verification_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          moderator_id: string
          note: string
          post_id?: string | null
          verification_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          moderator_id?: string
          note?: string
          post_id?: string | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_notes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_notes_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "creator_id_verification"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_failed_transfer: boolean | null
          email_new_subscriber: boolean | null
          email_post_moderation: boolean | null
          email_subscription_renewal: boolean | null
          email_verification_update: boolean | null
          id: string
          in_app_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_failed_transfer?: boolean | null
          email_new_subscriber?: boolean | null
          email_post_moderation?: boolean | null
          email_subscription_renewal?: boolean | null
          email_verification_update?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_failed_transfer?: boolean | null
          email_new_subscriber?: boolean | null
          email_post_moderation?: boolean | null
          email_subscription_renewal?: boolean | null
          email_verification_update?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          billing_details: Json | null
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          stripe_payment_method_id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_details?: Json | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          stripe_payment_method_id: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_details?: Json | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          stripe_payment_method_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          creator_id: string | null
          currency: string
          failure_reason: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          status: string
          stripe_charge_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          transaction_type: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          creator_id?: string | null
          currency?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          status: string
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          transaction_type: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          creator_id?: string | null
          currency?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          status?: string
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
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
      profile_access_logs: {
        Row: {
          access_type: string
          accessed_by: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_access_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_likes: {
        Row: {
          created_at: string | null
          id: string
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          liked_id?: string
          liker_id?: string
        }
        Relationships: []
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
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          intent: Database["public"]["Enums"]["user_intent"]
          interested_in_gender: string[] | null
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
          gender?: Database["public"]["Enums"]["gender"] | null
          id: string
          intent: Database["public"]["Enums"]["user_intent"]
          interested_in_gender?: string[] | null
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
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          intent?: Database["public"]["Enums"]["user_intent"]
          interested_in_gender?: string[] | null
          privacy_settings?: Json | null
          updated_at?: string | null
          username?: string | null
          username_updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          attempts: number
          created_at: string | null
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          attempts?: number
          created_at?: string | null
          id?: string
          identifier: string
          window_start: string
        }
        Update: {
          attempts?: number
          created_at?: string | null
          id?: string
          identifier?: string
          window_start?: string
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
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount_requested: number
          created_at: string | null
          currency: string
          id: string
          payment_transaction_id: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string
          status: string
          stripe_refund_id: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_requested: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_transaction_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          status?: string
          stripe_refund_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_requested?: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_transaction_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          status?: string
          stripe_refund_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          created_at: string | null
          device_info: Json | null
          event_type: Database["public"]["Enums"]["security_event_type"]
          id: string
          ip_address: unknown | null
          location_info: Json | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string | null
          device_info?: Json | null
          event_type: Database["public"]["Enums"]["security_event_type"]
          id?: string
          ip_address?: unknown | null
          location_info?: Json | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string | null
          device_info?: Json | null
          event_type?: Database["public"]["Enums"]["security_event_type"]
          id?: string
          ip_address?: unknown | null
          location_info?: Json | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriber_analytics: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          last_payment_at: string | null
          subscriber_id: string
          subscription_id: string | null
          subscription_started_at: string | null
          total_paid: number | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          last_payment_at?: string | null
          subscriber_id: string
          subscription_id?: string | null
          subscription_started_at?: string | null
          total_paid?: number | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          last_payment_at?: string | null
          subscriber_id?: string
          subscription_id?: string | null
          subscription_started_at?: string | null
          total_paid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_analytics_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
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
      user_2fa: {
        Row: {
          backup_codes: string[]
          created_at: string | null
          enabled: boolean
          enabled_at: string | null
          id: string
          secret: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes: string[]
          created_at?: string | null
          enabled?: boolean
          enabled_at?: string | null
          id?: string
          secret: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[]
          created_at?: string | null
          enabled?: boolean
          enabled_at?: string | null
          id?: string
          secret?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: unknown | null
          last_active: string | null
          location_info: Json | null
          revoke_reason: string | null
          revoked: boolean | null
          revoked_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_active?: string | null
          location_info?: Json | null
          revoke_reason?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_active?: string | null
          location_info?: Json | null
          revoke_reason?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_warnings: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          issued_by: string
          metadata: Json | null
          related_content_id: string | null
          related_report_id: string | null
          severity: string
          user_id: string
          warning_type: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          issued_by: string
          metadata?: Json | null
          related_content_id?: string | null
          related_report_id?: string | null
          severity: string
          user_id: string
          warning_type: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          issued_by?: string
          metadata?: Json | null
          related_content_id?: string | null
          related_report_id?: string | null
          severity?: string
          user_id?: string
          warning_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_related_report_id_fkey"
            columns: ["related_report_id"]
            isOneToOne: false
            referencedRelation: "content_reports"
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
      can_access_documents: {
        Args: { user_id: string }
        Returns: boolean
      }
      can_view_email: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      can_view_profile_field: {
        Args: { field_name: string; profile_user_id: string }
        Returns: boolean
      }
      can_view_user_interests: {
        Args: { _profile_user_id: string; _viewer_id: string }
        Returns: boolean
      }
      check_expired_referrals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_unlock_accounts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_username_available: {
        Args: { desired_username: string }
        Returns: boolean
      }
      cleanup_expired_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_security_events: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_referral: {
        Args: { referral_uuid: string }
        Returns: undefined
      }
      create_content_flag: {
        Args: {
          _ai_analysis?: Json
          _auto_action?: string
          _confidence_score: number
          _content_id: string
          _content_type: string
          _flag_type: string
        }
        Returns: string
      }
      create_content_report: {
        Args: {
          _content_id: string
          _content_type: string
          _description?: string
          _ip_address?: unknown
          _report_category: string
          _user_agent?: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          _data?: Json
          _message: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      decrement_subscriber_count: {
        Args: { creator_user_id: string }
        Returns: undefined
      }
      detect_suspicious_document_access: {
        Args: { _user_id: string; _window_minutes?: number }
        Returns: boolean
      }
      generate_document_token: {
        Args: {
          _document_type: string
          _expires_minutes?: number
          _verification_id: string
        }
        Returns: string
      }
      generate_referral_code: {
        Args: { user_username: string }
        Returns: string
      }
      get_creators_with_profiles: {
        Args: {
          p_gender?: string
          p_limit?: number
          p_location?: string
          p_max_age?: number
          p_max_price?: number
          p_min_age?: number
          p_min_price?: number
          p_min_subscribers?: number
          p_offset?: number
          p_search?: string
          p_sort_by?: string
          p_sort_direction?: string
          p_verified_only?: boolean
        }
        Returns: {
          age: number
          avatar_url: string
          bio: string
          city: string
          cover_image_url: string
          creator_created_at: string
          creator_id: string
          display_name: string
          id_verified: boolean
          profile_created_at: string
          showcase_bio: string
          subscriber_count: number
          subscription_price: number
          tagline: string
          total_count: number
          user_id: string
          username: string
          welcome_video_url: string
        }[]
      }
      get_discover_profiles: {
        Args: { max_count?: number; user_id: string }
        Returns: Database["public"]["CompositeTypes"]["discoverable_profile_type"][]
      }
      get_moderation_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          approved_posts: number
          pending_flags: number
          pending_posts: number
          pending_reports: number
          pending_verifications: number
          rejected_posts: number
          total_posts: number
        }[]
      }
      get_payment_stats: {
        Args: { _user_id: string }
        Returns: {
          active_subscriptions: number
          failed_payments: number
          total_refunded: number
          total_spent: number
        }[]
      }
      get_safe_profile: {
        Args: { profile_id: string }
        Returns: {
          age: number
          avatar_url: string
          bio: string
          city: string
          created_at: string
          display_name: string
          email: string
          gender: string
          id: string
          intent: string
          interested_in_gender: string[]
          username: string
        }[]
      }
      get_signed_document_url: {
        Args: { bucket_name: string; expires_in?: number; file_path: string }
        Returns: string
      }
      get_user_email: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_id_by_username: {
        Args: { p_username: string }
        Returns: {
          id: string
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
      has_accepted_compliance: {
        Args: {
          _document_type: string
          _document_version?: string
          _user_id: string
        }
        Returns: boolean
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
      is_account_locked: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_creator_verified: {
        Args: { creator_user_id: string }
        Returns: boolean
      }
      is_ip_whitelisted: {
        Args: { _ip_address: unknown }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          _action: string
          _details?: Json
          _resource_id?: string
          _resource_type: string
        }
        Returns: string
      }
      log_document_access: {
        Args: {
          _access_reason?: string
          _access_type?: string
          _document_type: string
          _ip_address?: unknown
          _user_agent?: string
          _verification_id: string
        }
        Returns: string
      }
      log_payment_transaction: {
        Args: {
          _amount: number
          _creator_id?: string
          _currency?: string
          _ip_address?: unknown
          _metadata?: Json
          _status?: string
          _stripe_charge_id?: string
          _stripe_invoice_id?: string
          _stripe_payment_intent_id?: string
          _subscription_id?: string
          _transaction_type: string
          _user_agent?: string
          _user_id: string
        }
        Returns: string
      }
      log_profile_access: {
        Args: {
          _access_type?: string
          _ip_address?: unknown
          _profile_id: string
          _user_agent?: string
        }
        Returns: string
      }
      log_security_event: {
        Args:
          | {
              _event_type: Database["public"]["Enums"]["security_event_type"]
              _ip_address?: unknown
              _location_info?: Json
              _metadata?: Json
              _severity?: string
              _user_agent?: string
              _user_id: string
            }
          | {
              _event_type: Database["public"]["Enums"]["security_event_type"]
              _ip_address?: unknown
              _metadata?: Json
              _severity?: string
              _user_agent?: string
              _user_id: string
            }
        Returns: string
      }
      process_referral_payout: {
        Args: { referrer_user_id: string }
        Returns: string
      }
      publish_scheduled_posts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      record_failed_login: {
        Args: { _ip_address?: unknown; _user_agent?: string; _user_id: string }
        Returns: undefined
      }
      request_creator_role: {
        Args: { application_text: string }
        Returns: Json
      }
      revoke_expired_document_permissions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_payment_transaction_status: {
        Args: {
          _failure_reason?: string
          _status: string
          _transaction_id: string
        }
        Returns: undefined
      }
      validate_document_access_request: {
        Args: {
          _access_reason?: string
          _ip_address: unknown
          _user_id: string
        }
        Returns: Json
      }
      validate_document_token: {
        Args: { _token: string }
        Returns: {
          document_type: string
          is_valid: boolean
          verification_id: string
        }[]
      }
    }
    Enums: {
      gender: "male" | "female" | "non_binary" | "other" | "prefer_not_to_say"
      security_event_type:
        | "login_success"
        | "login_failure"
        | "password_change"
        | "email_change"
        | "2fa_enabled"
        | "2fa_disabled"
        | "new_device_login"
        | "suspicious_location"
        | "multiple_failed_attempts"
        | "account_locked"
        | "account_unlocked"
      user_intent: "support_creators" | "make_friends" | "open_to_dating"
      user_role: "user" | "creator" | "admin"
      verification_status: "pending" | "under_review" | "approved" | "rejected"
    }
    CompositeTypes: {
      discoverable_profile_type: {
        id: string | null
        display_name: string | null
        username: string | null
        age: number | null
        city: string | null
        bio: string | null
        avatar_url: string | null
        intent: string | null
        privacy_settings: Json | null
        created_at: string | null
        updated_at: string | null
      }
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
      gender: ["male", "female", "non_binary", "other", "prefer_not_to_say"],
      security_event_type: [
        "login_success",
        "login_failure",
        "password_change",
        "email_change",
        "2fa_enabled",
        "2fa_disabled",
        "new_device_login",
        "suspicious_location",
        "multiple_failed_attempts",
        "account_locked",
        "account_unlocked",
      ],
      user_intent: ["support_creators", "make_friends", "open_to_dating"],
      user_role: ["user", "creator", "admin"],
      verification_status: ["pending", "under_review", "approved", "rejected"],
    },
  },
} as const
