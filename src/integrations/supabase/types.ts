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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          slug: string
          title: string
          meta_title: string | null
          meta_description: string | null
          content_html: string
          cover_image_url: string | null
          category: string | null
          published: boolean
          author_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          meta_title?: string | null
          meta_description?: string | null
          content_html?: string
          cover_image_url?: string | null
          category?: string | null
          published?: boolean
          author_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          meta_title?: string | null
          meta_description?: string | null
          content_html?: string
          cover_image_url?: string | null
          category?: string | null
          published?: boolean
          author_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      page_visits: {
        Row: {
          id: number
          path: string
          referrer: string | null
          source: string | null
          user_agent: string | null
          ip: string | null
          visited_at: string
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          gclid: string | null
          fbclid: string | null
        }
        Insert: {
          id?: never
          path: string
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
          ip?: string | null
          visited_at?: string
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          gclid?: string | null
          fbclid?: string | null
        }
        Update: {
          id?: never
          path?: string
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
          ip?: string | null
          visited_at?: string
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          gclid?: string | null
          fbclid?: string | null
        }
        Relationships: []
      }
      conversion_clicks: {
        Row: {
          id: number
          type: string
          path: string
          source: string | null
          user_agent: string | null
          clicked_at: string
          sim_number: string | null
          position: string | null
          device: string | null
          variant: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          gclid: string | null
          fbclid: string | null
          ip: string | null
        }
        Insert: {
          id?: never
          type: string
          path: string
          source?: string | null
          user_agent?: string | null
          clicked_at?: string
          sim_number?: string | null
          position?: string | null
          device?: string | null
          variant?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          gclid?: string | null
          fbclid?: string | null
          ip?: string | null
        }
        Update: {
          id?: never
          type?: string
          path?: string
          source?: string | null
          user_agent?: string | null
          clicked_at?: string
          sim_number?: string | null
          position?: string | null
          device?: string | null
          variant?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          gclid?: string | null
          fbclid?: string | null
          ip?: string | null
        }
        Relationships: []
      }
      // IP nội bộ/máy chủ bị loại khỏi thống kê khách — migration 20260926100000.
      traffic_exclusions: {
        Row: {
          id: number
          ip: string
          reason: "admin" | "staff" | "heavy" | "server" | "manual"
          note: string | null
          valid_from: string | null
          valid_to: string | null
          active: boolean
          auto: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: never
          ip: string
          reason: "admin" | "staff" | "heavy" | "server" | "manual"
          note?: string | null
          valid_from?: string | null
          valid_to?: string | null
          active?: boolean
          auto?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: never
          ip?: string
          reason?: "admin" | "staff" | "heavy" | "server" | "manual"
          note?: string | null
          valid_from?: string | null
          valid_to?: string | null
          active?: boolean
          auto?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      // "Khách thật": cùng cột bảng gốc, đã bỏ nội bộ + bot (is_internal_visit).
      page_visits_khach: {
        Row: {
          id: number | null
          path: string | null
          referrer: string | null
          source: string | null
          user_agent: string | null
          ip: string | null
          visited_at: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          gclid: string | null
          fbclid: string | null
        }
        Relationships: []
      }
      conversion_clicks_khach: {
        Row: {
          id: number | null
          type: string | null
          path: string | null
          source: string | null
          user_agent: string | null
          clicked_at: string | null
          sim_number: string | null
          position: string | null
          device: string | null
          variant: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          gclid: string | null
          fbclid: string | null
          ip: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      daily_page_visits: {
        Args: { p_days?: number; p_all?: boolean }
        Returns: { d: string; n: number }[]
      }
      is_bot_visit: {
        Args: { p_ua: string | null; p_ip: string | null }
        Returns: boolean
      }
      is_internal_visit: {
        Args: { p_ip: string | null; p_ua: string | null; p_at: string }
        Returns: boolean
      }
      refresh_traffic_exclusions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      note_admin_ip: {
        Args: { p_ip: string }
        Returns: undefined
      }
      traffic_exclusions_report: {
        Args: { p_days?: number }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
