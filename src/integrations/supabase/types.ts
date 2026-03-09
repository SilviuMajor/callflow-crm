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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          script_generation?: boolean
          targeted_research?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_auto_generate_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credits_settings: {
        Row: {
          created_at: string
          id: string
          monthly_limit: number | null
          organization_id: string
          reset_day: number
          tier_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_limit?: number | null
          organization_id: string
          reset_day?: number
          tier_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_limit?: number | null
          organization_id?: string
          reset_day?: number
          tier_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_credits_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          credits_used?: number
          feature_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          credits_used?: number
          feature_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
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
          {
            foreignKeyName: "ai_credits_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          prompt?: string
          prompt_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_scripts: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          is_default: boolean
          model: string | null
          name: string
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_scripts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calcom_settings: {
        Row: {
          api_key: string | null
          created_at: string
          enabled: boolean
          event_type_slug: string | null
          field_mappings: Json | null
          id: string
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calcom_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendly_settings: {
        Row: {
          calendly_url: string
          created_at: string
          enabled: boolean
          id: string
          organization_id: string
          personal_access_token: string | null
          updated_at: string
          webhook_signing_key: string | null
        }
        Insert: {
          calendly_url?: string
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id: string
          personal_access_token?: string | null
          updated_at?: string
          webhook_signing_key?: string | null
        }
        Update: {
          calendly_url?: string
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id?: string
          personal_access_token?: string | null
          updated_at?: string
          webhook_signing_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendly_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_fields_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_card_section_order: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          section_expanded_defaults: Json | null
          section_order: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          section_expanded_defaults?: Json | null
          section_order?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          section_expanded_defaults?: Json | null
          section_order?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_card_section_order_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
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
          {
            foreignKeyName: "contact_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          linkedin_url: string | null
          not_interested_reason: string | null
          organization_id: string
          phone: string
          pot_id: string | null
          qualifying_answers: Json | null
          status: string
          twitter_url: string | null
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
          linkedin_url?: string | null
          not_interested_reason?: string | null
          organization_id: string
          phone: string
          pot_id?: string | null
          qualifying_answers?: Json | null
          status?: string
          twitter_url?: string | null
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
          linkedin_url?: string | null
          not_interested_reason?: string | null
          organization_id?: string
          phone?: string
          pot_id?: string | null
          qualifying_answers?: Json | null
          status?: string
          twitter_url?: string | null
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
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_contact_fields_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          enabled: boolean
          field_order: number
          id: string
          name: string
          organization_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          enabled?: boolean
          field_order?: number
          id?: string
          name?: string
          organization_id: string
          subject?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          enabled?: boolean
          field_order?: number
          id?: string
          name?: string
          organization_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          organization_id: string
          uses_remaining: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          uses_remaining?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          uses_remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          daily_call_target: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_call_target?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_call_target?: number
          id?: string
          name?: string
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          outcome_type?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "outcome_options_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pots: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_refinements: {
        Row: {
          created_at: string
          example_output: string | null
          feedback: string
          id: string
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          original_prompt?: string
          prompt_type?: string
          refined_prompt?: string
          refinement_summary?: Json
          sample_contact_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_refinements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string
          question: string
          question_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          options?: string[] | null
          organization_id: string
          question: string
          question_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: string[] | null
          organization_id?: string
          question?: string
          question_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualifying_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_company: {
        Row: {
          company_name: string
          created_at: string
          custom_fields: Json | null
          id: string
          industry: string | null
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          pain_points_solved?: string | null
          product_offering?: string | null
          product_sets?: string | null
          target_audience?: string | null
          tone_style?: string | null
          updated_at?: string
          usps?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_company_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_custom_fields_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      static_script_settings: {
        Row: {
          created_at: string
          default_expanded: boolean
          enabled: boolean
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_expanded?: boolean
          enabled?: boolean
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_expanded?: boolean
          enabled?: boolean
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "static_script_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "static_scripts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      webhook_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          organization_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id: string
          updated_at?: string
          url?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_org: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      validate_invite_code: { Args: { invite_code: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "member"
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
      app_role: ["admin", "member"],
    },
  },
} as const
