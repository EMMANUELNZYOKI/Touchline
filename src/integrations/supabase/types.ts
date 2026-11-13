export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      player_evaluations: {
        Row: {
          academy_id: string;
          coach_id: string;
          coach_notes: string | null;
          coach_verdict: string | null;
          created_at: string;
          development_goals: string | null;
          id: string;
          overall_rating: number | null;
          personality_score: number | null;
          personality_skills: Json;
          physical_score: number | null;
          physical_skills: Json;
          player_id: string;
          season: string;
          season_year: number;
          strengths: string | null;
          tactical_score: number | null;
          tactical_skills: Json;
          technical_score: number | null;
          technical_skills: Json;
          updated_at: string;
          weaknesses: string | null;
        };
        Insert: {
          academy_id?: string;
          coach_id: string;
          coach_notes?: string | null;
          coach_verdict?: string | null;
          created_at?: string;
          development_goals?: string | null;
          id?: string;
          overall_rating?: number | null;
          personality_score?: number | null;
          personality_skills?: Json;
          physical_score?: number | null;
          physical_skills?: Json;
          player_id: string;
          season?: string;
          season_year?: number;
          strengths?: string | null;
          tactical_score?: number | null;
          tactical_skills?: Json;
          technical_score?: number | null;
          technical_skills?: Json;
          updated_at?: string;
          weaknesses?: string | null;
        };
        Update: {
          academy_id?: string;
          coach_id?: string;
          coach_notes?: string | null;
          coach_verdict?: string | null;
          created_at?: string;
          development_goals?: string | null;
          id?: string;
          overall_rating?: number | null;
          personality_score?: number | null;
          personality_skills?: Json;
          physical_score?: number | null;
          physical_skills?: Json;
          player_id?: string;
          season?: string;
          season_year?: number;
          strengths?: string | null;
          tactical_score?: number | null;
          tactical_skills?: Json;
          technical_score?: number | null;
          technical_skills?: Json;
          updated_at?: string;
          weaknesses?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "player_evaluations_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      players: {
        Row: {
          academy_id: string;
          coach_id: string | null;
          created_at: string;
          date_of_birth: string | null;
          emergency_contact: string | null;
          first_name: string;
          gender: string | null;
          height: number | null;
          id: string;
          jersey_number: number | null;
          last_name: string;
          medical_notes: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          phone: string | null;
          player_photo: string | null;
          position: string | null;
          preferred_foot: string | null;
          season: string | null;
          secondary_position: string | null;
          team_category: string | null;
          updated_at: string;
          weight: number | null;
        };
        Insert: {
          academy_id?: string;
          coach_id?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          emergency_contact?: string | null;
          first_name: string;
          gender?: string | null;
          height?: number | null;
          id?: string;
          jersey_number?: number | null;
          last_name: string;
          medical_notes?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          phone?: string | null;
          player_photo?: string | null;
          position?: string | null;
          preferred_foot?: string | null;
          season?: string | null;
          secondary_position?: string | null;
          team_category?: string | null;
          updated_at?: string;
          weight?: number | null;
        };
        Update: {
          academy_id?: string;
          coach_id?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          emergency_contact?: string | null;
          first_name?: string;
          gender?: string | null;
          height?: number | null;
          id?: string;
          jersey_number?: number | null;
          last_name?: string;
          medical_notes?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          phone?: string | null;
          player_photo?: string | null;
          position?: string | null;
          preferred_foot?: string | null;
          season?: string | null;
          secondary_position?: string | null;
          team_category?: string | null;
          updated_at?: string;
          weight?: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          phone: string | null;
          role: "super_admin" | "coach";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id: string;
          is_active?: boolean;
          phone?: string | null;
          role: "super_admin" | "coach";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      academies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_path: string | null;
          status: "active" | "suspended";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_path?: string | null;
          status?: "active" | "suspended";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_path?: string | null;
          status?: "active" | "suspended";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      academy_memberships: {
        Row: {
          academy_id: string;
          user_id: string;
          role: "academy_admin" | "academy_manager" | "coach";
          status: "active" | "invited" | "suspended";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          academy_id: string;
          user_id: string;
          role: "academy_admin" | "academy_manager" | "coach";
          status?: "active" | "invited" | "suspended";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          academy_id?: string;
          user_id?: string;
          role?: "academy_admin" | "academy_manager" | "coach";
          status?: "active" | "invited" | "suspended";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { user_id?: string; created_at?: string };
        Relationships: [];
      };
      academy_subscriptions: {
        Row: {
          academy_id: string;
          plan_key: string;
          status: "trialing" | "active" | "past_due" | "canceled" | "paused";
          trial_ends_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          provider: string | null;
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          updated_at: string;
        };
        Insert: {
          academy_id: string;
          plan_key?: string;
          status?: "trialing" | "active" | "past_due" | "canceled" | "paused";
          trial_ends_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          updated_at?: string;
        };
        Update: {
          academy_id?: string;
          plan_key?: string;
          status?: "trialing" | "active" | "past_due" | "canceled" | "paused";
          trial_ends_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          plan_key: string;
          name: string;
          description: string;
          amount: number;
          currency: string;
          player_limit: number | null;
          coach_limit: number | null;
          feature_summary: string[];
          feature_flags: string[];
          flutterwave_plan_id: string | null;
          active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          plan_key: string;
          name: string;
          description: string;
          amount: number;
          currency?: string;
          player_limit?: number | null;
          coach_limit?: number | null;
          feature_summary?: string[];
          feature_flags?: string[];
          flutterwave_plan_id?: string | null;
          active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_key?: string;
          name?: string;
          description?: string;
          amount?: number;
          currency?: string;
          player_limit?: number | null;
          coach_limit?: number | null;
          feature_summary?: string[];
          feature_flags?: string[];
          flutterwave_plan_id?: string | null;
          active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      academy_payments: {
        Row: {
          id: string;
          academy_id: string;
          provider: string;
          tx_ref: string;
          provider_transaction_id: string | null;
          amount: number;
          currency: string;
          plan_key: string;
          status: "pending" | "successful" | "failed" | "cancelled";
          payment_type: string;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academy_id: string;
          provider?: string;
          tx_ref: string;
          provider_transaction_id?: string | null;
          amount: number;
          currency: string;
          plan_key: string;
          status?: "pending" | "successful" | "failed" | "cancelled";
          payment_type?: string;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academy_id?: string;
          provider?: string;
          tx_ref?: string;
          provider_transaction_id?: string | null;
          amount?: number;
          currency?: string;
          plan_key?: string;
          status?: "pending" | "successful" | "failed" | "cancelled";
          payment_type?: string;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_webhook_events: {
        Row: { provider: string; event_id: string; event_type: string | null; received_at: string };
        Insert: {
          provider: string;
          event_id: string;
          event_type?: string | null;
          received_at?: string;
        };
        Update: {
          provider?: string;
          event_id?: string;
          event_type?: string | null;
          received_at?: string;
        };
        Relationships: [];
      };
      admin_activity_logs: {
        Row: {
          id: string;
          actor_id: string;
          academy_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          summary: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          academy_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          summary: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          academy_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          summary?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_evaluated_player_ids: {
        Args: never;
        Returns: { player_id: string }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_super_admin: { Args: never; Returns: boolean };
      is_platform_admin: { Args: never; Returns: boolean };
      has_academy_role: { Args: { p_academy_id: string; p_roles?: string[] }; Returns: boolean };
      shares_active_academy_with: { Args: { p_user_id: string }; Returns: boolean };
      platform_academy_overview: {
        Args: never;
        Returns: {
          academy_id: string;
          academy_name: string;
          slug: string;
          academy_status: string;
          created_at: string;
          plan_key: string;
          subscription_status: string;
          trial_ends_at: string | null;
          current_period_end: string | null;
          player_count: number;
          evaluation_count: number;
          coach_count: number;
          academy_admin_count: number;
        }[];
      };
      set_platform_academy_state: {
        Args: { p_academy_id: string; p_academy_status: string; p_subscription_status: string };
        Returns: undefined;
      };
      create_platform_academy: { Args: { p_name: string; p_slug: string }; Returns: string };
      delete_platform_academy: { Args: { p_academy_id: string }; Returns: string[] };
      complete_academy_onboarding: {
        Args: {
          p_owner_user_id: string;
          p_name: string;
          p_slug: string;
          p_full_name: string;
          p_email: string;
          p_phone: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: "super_admin" | "coach";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "coach"],
    },
  },
} as const;
