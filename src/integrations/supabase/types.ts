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
      debates: {
        Row: {
          completed_at: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          final_bsi: number | null
          id: string
          persona_id: string
          result: Database["public"]["Enums"]["debate_result"]
          started_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          final_bsi?: number | null
          id?: string
          persona_id: string
          result?: Database["public"]["Enums"]["debate_result"]
          started_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          final_bsi?: number | null
          id?: string
          persona_id?: string
          result?: Database["public"]["Enums"]["debate_result"]
          started_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debates_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_packets: {
        Row: {
          caveats: string[] | null
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          evidence_type: string
          id: string
          key_claim: string
          snippet: string | null
          source: string
          source_url: string | null
          summary: string
          supports: string[] | null
          tags: string[]
          title: string
        }
        Insert: {
          caveats?: string[] | null
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          evidence_type: string
          id?: string
          key_claim: string
          snippet?: string | null
          source: string
          source_url?: string | null
          summary: string
          supports?: string[] | null
          tags?: string[]
          title: string
        }
        Update: {
          caveats?: string[] | null
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          evidence_type?: string
          id?: string
          key_claim?: string
          snippet?: string | null
          source?: string
          source_url?: string | null
          summary?: string
          supports?: string[] | null
          tags?: string[]
          title?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          citations: Json | null
          content: string
          created_at: string
          debate_id: string
          id: string
          role: string
          scores: Json | null
        }
        Insert: {
          citations?: Json | null
          content: string
          created_at?: string
          debate_id: string
          id?: string
          role: string
          scores?: Json | null
        }
        Update: {
          citations?: Json | null
          content?: string
          created_at?: string
          debate_id?: string
          id?: string
          role?: string
          scores?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_debate_id_fkey"
            columns: ["debate_id"]
            isOneToOne: false
            referencedRelation: "debates"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          persona_type: Database["public"]["Enums"]["persona_type"]
          scripts: Json
          tone: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          persona_type: Database["public"]["Enums"]["persona_type"]
          scripts?: Json
          tone: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          persona_type?: Database["public"]["Enums"]["persona_type"]
          scripts?: Json
          tone?: string
        }
        Relationships: []
      }
      rubrics: {
        Row: {
          created_at: string
          id: string
          name: string
          thresholds: Json
          weights: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          thresholds: Json
          weights: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          thresholds?: Json
          weights?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "instructor" | "admin"
      debate_result: "in_progress" | "passed" | "failed"
      difficulty_level: "Easy" | "Moderate" | "Hard" | "Extreme"
      persona_type: "Denier" | "Doubter" | "Naïve" | "Cynic" | "Zealot"
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
      app_role: ["student", "instructor", "admin"],
      debate_result: ["in_progress", "passed", "failed"],
      difficulty_level: ["Easy", "Moderate", "Hard", "Extreme"],
      persona_type: ["Denier", "Doubter", "Naïve", "Cynic", "Zealot"],
    },
  },
} as const
