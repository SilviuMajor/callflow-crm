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
      ai_auto_generate_settings: {
        Row: {
          company_research: boolean
          contact_persona: boolean
          created_at: string
          enabled: boolean
          id: string
          script_generation: boolean
          targeted_research: boolean
          updated_at: string
        }
        Insert: {
          company_research?: boolean
          contact_persona?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          script_generation?: boolean
          targeted_research?: boolean
          updated_at?: string
        }
        Update: {
          company_research?: boolean
          contact_persona?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          script_generation?: boolean
          targeted_research?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ai_credits_settings: {
        Row: {
          created_at: string
          id: string
          monthly_limit: number | null
          reset_day: number
          tier_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_limit?: number | null
          reset_day?: number
          tier_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_limit?: number | null
          reset_day?: number
          tier_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_credits_usage: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          credits_used: number
          feature_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          credits_used?: number
          feature_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          credits_used?: number
          feature_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_credits_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_credits_usage_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          created_at: string | null
          default_prompt: string | null
          enabled: boolean | null
          id: string
          model: string | null
          name: string
          prompt: string
          prompt_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_prompt?: string | null
          enabled?: boolean | null
          id?: string
          model?: string | null
          name: string
          prompt: string
          prompt_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_prompt?: string | null
          enabled?: boolean | null
          id?: string
          model?: string | null
          name?: string
          prompt?: string
          prompt_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_scripts: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          is_default: boolean
          model: string | null
          name: string
          template: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          is_default?: boolean
          model?: string | null
          name?: string
          template?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          is_default?: boolean
          model?: string | null
          name?: string
          template?: string
          updated_at?: string
        }
        Relationships: []
      }
      calcom_settings: {
        Row: {
          api_key: string | null
          created_at: string
          enabled: boolean
          event_type_slug: string | null
          field_mappings: Json | null
          id: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          enabled?: boolean
          event_type_slug?: string | null
          field_mappings?: Json | null
          id?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string
          enabled?: boolean
          event_type_slug?: string | null
          field_mappings?: Json | null
          id?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      calendly_settings: {
        Row: {
          calendly_url: string
          created_at: string
          enabled: boolean
          id: string
          personal_access_token: string | null
          updated_at: string
          webhook_signing_key: string | null
        }
        Insert: {
          calendly_url?: string
          created_at?: string
          enabled?: boolean
          id?: string
          personal_access_token?: string | null
          updated_at?: string
          webhook_signing_key?: string | null
        }
        Update: {
          calendly_url?: string
          created_at?: string
          enabled?: boolean
          id?: string
          personal_access_token?: string | null
          updated_at?: string
          webhook_signing_key?: string | null
        }
        Relationships: []
      }
      company_data: {
        Row: {
          ai_custom_research: string | null
          ai_custom_updated_at: string | null
          ai_summary: string | null
          ai_summary_updated_at: string | null
          company_name: string
          created_at: string
          field_values: Json
          id: string
          updated_at: string
        }
        Insert: {
          ai_custom_research?: string | null
          ai_custom_updated_at?: string | null
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          company_name: string
          created_at?: string
          field_values?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          ai_custom_research?: string | null
          ai_custom_updated_at?: string | null
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          company_name?: string
          created_at?: string
          field_values?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_fields: {
        Row: {
          created_at: string
          field_order: number
          id: string
          is_archived: boolean
          key: string
          label: string
          options: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_order?: number
          id?: string
          is_archived?: boolean
          key: string
          label: string
          options?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_order?: number
          id?: string
          is_archived?: boolean
          key?: string
          label?: string
          options?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_card_section_order: {
        Row: {
          created_at: string
          id: string
          section_order: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          section_order?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          section_order?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      contact_history: {
        Row: {
          action_timestamp: string
          action_type: string
          appointment_date: string | null
          callback_date: string | null
          contact_id: string
          created_at: string
          id: string
          note: string | null
          reason: string | null
        }
        Insert: {
          action_timestamp?: string
          action_type: string
          appointment_date?: string | null
          callback_date?: string | null
          contact_id: string
          created_at?: string
          id?: string
          note?: string | null
          reason?: string | null
        }
        Update: {
          action_timestamp?: string
          action_type?: string
          appointment_date?: string | null
          callback_date?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          note?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          ai_persona: string | null
          ai_persona_updated_at: string | null
          ai_script: string | null
          ai_script_id: string | null
          ai_script_updated_at: string | null
          appointment_attended: boolean | null
          appointment_date: string | null
          callback_date: string | null
          company: string
          completed_reason: string | null
          created_at: string
          custom_fields: Json | null
          email: string | null
          first_name: string
          id: string
          job_title: string | null
          last_name: string
          not_interested_reason: string | null
          phone: string
          pot_id: string | null
          qualifying_answers: Json | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          ai_persona?: string | null
          ai_persona_updated_at?: string | null
          ai_script?: string | null
          ai_script_id?: string | null
          ai_script_updated_at?: string | null
          appointment_attended?: boolean | null
          appointment_date?: string | null
          callback_date?: string | null
          company: string
          completed_reason?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          first_name: string
          id?: string
          job_title?: string | null
          last_name: string
          not_interested_reason?: string | null
          phone: string
          pot_id?: string | null
          qualifying_answers?: Json | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          ai_persona?: string | null
          ai_persona_updated_at?: string | null
          ai_script?: string | null
          ai_script_id?: string | null
          ai_script_updated_at?: string | null
          appointment_attended?: boolean | null
          appointment_date?: string | null
          callback_date?: string | null
          company?: string
          completed_reason?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string
          not_interested_reason?: string | null
          phone?: string
          pot_id?: string | null
          qualifying_answers?: Json | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_ai_script_id_fkey"
            columns: ["ai_script_id"]
            isOneToOne: false
            referencedRelation: "ai_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_pot_id_fkey"
            columns: ["pot_id"]
            isOneToOne: false
            referencedRelation: "pots"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_contact_fields: {
        Row: {
          created_at: string
          field_order: number
          id: string
          is_archived: boolean
          key: string
          label: string
          options: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_order?: number
          id?: string
          is_archived?: boolean
          key: string
          label: string
          options?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_order?: number
          id?: string
          is_archived?: boolean
          key?: string
          label?: string
          options?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      outcome_options: {
        Row: {
          created_at: string | null
          id: string
          is_archived: boolean
          label: string
          option_order: number
          outcome_type: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_archived?: boolean
          label: string
          option_order?: number
          outcome_type: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_archived?: boolean
          label?: string
          option_order?: number
          outcome_type?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      pots: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      prompt_refinements: {
        Row: {
          created_at: string
          example_output: string | null
          feedback: string
          id: string
          original_prompt: string
          prompt_type: string
          refined_prompt: string
          refinement_summary: Json
          sample_contact_id: string | null
        }
        Insert: {
          created_at?: string
          example_output?: string | null
          feedback: string
          id?: string
          original_prompt: string
          prompt_type: string
          refined_prompt: string
          refinement_summary?: Json
          sample_contact_id?: string | null
        }
        Update: {
          created_at?: string
          example_output?: string | null
          feedback?: string
          id?: string
          original_prompt?: string
          prompt_type?: string
          refined_prompt?: string
          refinement_summary?: Json
          sample_contact_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_refinements_sample_contact_id_fkey"
            columns: ["sample_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      qualifying_questions: {
        Row: {
          created_at: string
          id: string
          options: string[] | null
          question: string
          question_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          options?: string[] | null
          question: string
          question_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: string[] | null
          question?: string
          question_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      seller_company: {
        Row: {
          company_name: string
          created_at: string
          custom_fields: Json | null
          id: string
          industry: string | null
          pain_points_solved: string | null
          product_offering: string | null
          product_sets: string | null
          target_audience: string | null
          tone_style: string | null
          updated_at: string
          usps: string | null
          website: string | null
        }
        Insert: {
          company_name?: string
          created_at?: string
          custom_fields?: Json | null
          id?: string
          industry?: string | null
          pain_points_solved?: string | null
          product_offering?: string | null
          product_sets?: string | null
          target_audience?: string | null
          tone_style?: string | null
          updated_at?: string
          usps?: string | null
          website?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          custom_fields?: Json | null
          id?: string
          industry?: string | null
          pain_points_solved?: string | null
          product_offering?: string | null
          product_sets?: string | null
          target_audience?: string | null
          tone_style?: string | null
          updated_at?: string
          usps?: string | null
          website?: string | null
        }
        Relationships: []
      }
      seller_custom_fields: {
        Row: {
          created_at: string
          field_order: number
          id: string
          is_archived: boolean
          key: string
          label: string
          options: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_order?: number
          id?: string
          is_archived?: boolean
          key: string
          label: string
          options?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_order?: number
          id?: string
          is_archived?: boolean
          key?: string
          label?: string
          options?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      static_script_settings: {
        Row: {
          created_at: string
          default_expanded: boolean
          enabled: boolean
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_expanded?: boolean
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_expanded?: boolean
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      static_scripts: {
        Row: {
          content: string
          created_at: string
          enabled: boolean
          field_order: number
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          enabled?: boolean
          field_order?: number
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          enabled?: boolean
          field_order?: number
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          url?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
