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
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id: string;
          is_active?: boolean;
          phone?: string | null;
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
