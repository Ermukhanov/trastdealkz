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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      deals: {
        Row: {
          amount: number
          category: string | null
          counterparty_wallet: string | null
          created_at: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          description: string | null
          id: string
          nft_mint_address: string | null
          proof_description: string | null
          proof_hash: string | null
          status: Database["public"]["Enums"]["deal_status"]
          title: string
          tx_signature: string | null
          updated_at: string
          user_id: string
          verdict_law_ref: string | null
          verdict_percent: number | null
          verdict_text: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          counterparty_wallet?: string | null
          created_at?: string
          deal_type?: Database["public"]["Enums"]["deal_type"]
          description?: string | null
          id?: string
          nft_mint_address?: string | null
          proof_description?: string | null
          proof_hash?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          title: string
          tx_signature?: string | null
          updated_at?: string
          user_id: string
          verdict_law_ref?: string | null
          verdict_percent?: number | null
          verdict_text?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          counterparty_wallet?: string | null
          created_at?: string
          deal_type?: Database["public"]["Enums"]["deal_type"]
          description?: string | null
          id?: string
          nft_mint_address?: string | null
          proof_description?: string | null
          proof_hash?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          title?: string
          tx_signature?: string | null
          updated_at?: string
          user_id?: string
          verdict_law_ref?: string | null
          verdict_percent?: number | null
          verdict_text?: string | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string
          deal_id: string
          deposit_amount: number
          evidence_urls: string[] | null
          id: string
          initiator_id: string
          jury_count: number
          resolved_at: string | null
          side_a_claim: string
          side_b_claim: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
          verdict: string | null
          verdict_percent: number | null
          verdict_side: Database["public"]["Enums"]["vote_choice"] | null
        }
        Insert: {
          created_at?: string
          deal_id: string
          deposit_amount?: number
          evidence_urls?: string[] | null
          id?: string
          initiator_id: string
          jury_count?: number
          resolved_at?: string | null
          side_a_claim: string
          side_b_claim?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
          verdict?: string | null
          verdict_percent?: number | null
          verdict_side?: Database["public"]["Enums"]["vote_choice"] | null
        }
        Update: {
          created_at?: string
          deal_id?: string
          deposit_amount?: number
          evidence_urls?: string[] | null
          id?: string
          initiator_id?: string
          jury_count?: number
          resolved_at?: string | null
          side_a_claim?: string
          side_b_claim?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
          verdict?: string | null
          verdict_percent?: number | null
          verdict_side?: Database["public"]["Enums"]["vote_choice"] | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      jury_votes: {
        Row: {
          dispute_id: string
          id: string
          is_majority: boolean | null
          juror_id: string
          penalty_amount: number | null
          reasoning: string | null
          reward_amount: number | null
          vote: Database["public"]["Enums"]["vote_choice"]
          voted_at: string
        }
        Insert: {
          dispute_id: string
          id?: string
          is_majority?: boolean | null
          juror_id: string
          penalty_amount?: number | null
          reasoning?: string | null
          reward_amount?: number | null
          vote: Database["public"]["Enums"]["vote_choice"]
          voted_at?: string
        }
        Update: {
          dispute_id?: string
          id?: string
          is_majority?: boolean | null
          juror_id?: string
          penalty_amount?: number | null
          reasoning?: string | null
          reward_amount?: number | null
          vote?: Database["public"]["Enums"]["vote_choice"]
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jury_votes_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          deal_id: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          deal_id: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          deal_id: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          affiliation_score: number
          ai_reasoning: string | null
          contract_clarity_score: number
          created_at: string
          deal_id: string
          details: Json | null
          id: string
          overall_risk: Database["public"]["Enums"]["risk_level"]
          overall_score: number
          price_anomaly_score: number
        }
        Insert: {
          affiliation_score?: number
          ai_reasoning?: string | null
          contract_clarity_score?: number
          created_at?: string
          deal_id: string
          details?: Json | null
          id?: string
          overall_risk?: Database["public"]["Enums"]["risk_level"]
          overall_score?: number
          price_anomaly_score?: number
        }
        Update: {
          affiliation_score?: number
          ai_reasoning?: string | null
          contract_clarity_score?: number
          created_at?: string
          deal_id?: string
          details?: Json | null
          id?: string
          overall_risk?: Database["public"]["Enums"]["risk_level"]
          overall_score?: number
          price_anomaly_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      deal_status: "pending" | "active" | "completed" | "disputed" | "cancelled"
      deal_type: "escrow" | "direct" | "nft"
      dispute_status: "pending" | "voting" | "resolved" | "cancelled"
      risk_level: "low" | "medium" | "high" | "critical"
      vote_choice: "side_a" | "side_b" | "split"
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
      deal_status: ["pending", "active", "completed", "disputed", "cancelled"],
      deal_type: ["escrow", "direct", "nft"],
      dispute_status: ["pending", "voting", "resolved", "cancelled"],
      risk_level: ["low", "medium", "high", "critical"],
      vote_choice: ["side_a", "side_b", "split"],
    },
  },
} as const
