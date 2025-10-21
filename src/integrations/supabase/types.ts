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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      client_kpis: {
        Row: {
          cac: number | null
          client_id: string
          created_at: string | null
          id: string
          leads_generated: number | null
          ltv: number | null
          report_date: string
          sales_count: number | null
          summary: string | null
          title: string
        }
        Insert: {
          cac?: number | null
          client_id: string
          created_at?: string | null
          id?: string
          leads_generated?: number | null
          ltv?: number | null
          report_date: string
          sales_count?: number | null
          summary?: string | null
          title: string
        }
        Update: {
          cac?: number | null
          client_id?: string
          created_at?: string | null
          id?: string
          leads_generated?: number | null
          ltv?: number | null
          report_date?: string
          sales_count?: number | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_kpis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_requests: {
        Row: {
          client_id: string
          created_at: string | null
          details: string | null
          id: string
          request_type: string | null
          status: string | null
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          request_type?: string | null
          status?: string | null
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          details?: string | null
          id?: string
          request_type?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_timelines: {
        Row: {
          client_id: string
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_timelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_timelines_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "timeline_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string
          file_type: string | null
          file_url: string
          id: string
          timeline_item_id: string | null
          title: string
          uploaded_at: string
        }
        Insert: {
          client_id: string
          file_type?: string | null
          file_url: string
          id?: string
          timeline_item_id?: string | null
          title: string
          uploaded_at?: string
        }
        Update: {
          client_id?: string
          file_type?: string | null
          file_url?: string
          id?: string
          timeline_item_id?: string | null
          title?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_timeline_item_id_fkey"
            columns: ["timeline_item_id"]
            isOneToOne: false
            referencedRelation: "timeline_items"
            referencedColumns: ["id"]
          },
        ]
      }
      indications: {
        Row: {
          client_id: string
          created_at: string
          id: string
          indicated_email: string | null
          indicated_name: string
          indicated_phone: string | null
          points_awarded: number | null
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          indicated_email?: string | null
          indicated_name: string
          indicated_phone?: string | null
          points_awarded?: number | null
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          indicated_email?: string | null
          indicated_name?: string
          indicated_phone?: string | null
          points_awarded?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "indications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          link_to: string | null
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          link_to?: string | null
          message: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          link_to?: string | null
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      point_history: {
        Row: {
          client_id: string
          created_at: string | null
          id: number
          points_change: number
          reason: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: number
          points_change: number
          reason: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: number
          points_change?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_logo_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          notify_on_comment: boolean | null
          notify_on_progress: boolean | null
          points: number
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          company_logo_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          notify_on_comment?: boolean | null
          notify_on_progress?: boolean | null
          points?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          company_logo_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          notify_on_comment?: boolean | null
          notify_on_progress?: boolean | null
          points?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      timeline_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          timeline_item_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          timeline_item_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          timeline_item_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      timeline_items: {
        Row: {
          client_timeline_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          progress_status:
            | Database["public"]["Enums"]["timeline_progress_status"]
            | null
          status: Database["public"]["Enums"]["timeline_item_status"]
          template_item_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_timeline_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          progress_status?:
            | Database["public"]["Enums"]["timeline_progress_status"]
            | null
          status?: Database["public"]["Enums"]["timeline_item_status"]
          template_item_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_timeline_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          progress_status?:
            | Database["public"]["Enums"]["timeline_progress_status"]
            | null
          status?: Database["public"]["Enums"]["timeline_item_status"]
          template_item_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_items_client_timeline_id_fkey"
            columns: ["client_timeline_id"]
            isOneToOne: false
            referencedRelation: "client_timelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_items_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "timeline_template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_template_items: {
        Row: {
          category: Database["public"]["Enums"]["template_item_category"]
          created_at: string
          description: string | null
          display_order: number
          id: string
          parent_id: string | null
          template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["template_item_category"]
          created_at?: string
          description?: string | null
          display_order: number
          id?: string
          parent_id?: string | null
          template_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["template_item_category"]
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          parent_id?: string | null
          template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_template_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "timeline_template_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "timeline_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_templates: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "ADMIN" | "CLIENTE"
      template_item_category:
        | "FASE"
        | "MES"
        | "FOCO"
        | "ENTREGAVEL"
        | "SESSAO"
        | "CONSULTORIA"
        | "TREINAMENTO"
      timeline_item_status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO"
      timeline_progress_status: "NO_PRAZO" | "ADIANTADO" | "ATRASADO"
      user_role: "ADMIN" | "CLIENTE"
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
      app_role: ["ADMIN", "CLIENTE"],
      template_item_category: [
        "FASE",
        "MES",
        "FOCO",
        "ENTREGAVEL",
        "SESSAO",
        "CONSULTORIA",
        "TREINAMENTO",
      ],
      timeline_item_status: ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"],
      timeline_progress_status: ["NO_PRAZO", "ADIANTADO", "ATRASADO"],
      user_role: ["ADMIN", "CLIENTE"],
    },
  },
} as const
