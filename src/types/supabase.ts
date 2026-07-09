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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          category: string
          code: string
          condition_type: string
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          order_index: number | null
          rarity: string | null
          threshold: number | null
        }
        Insert: {
          category: string
          code: string
          condition_type: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          order_index?: number | null
          rarity?: string | null
          threshold?: number | null
        }
        Update: {
          category?: string
          code?: string
          condition_type?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          order_index?: number | null
          rarity?: string | null
          threshold?: number | null
        }
        Relationships: []
      }
      adset_metrics_daily: {
        Row: {
          adset_name: string | null
          campaign_id: string
          clicks: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          meta_adset_id: string
          meta_campaign_id: string
          phase: string | null
          purchase_value: number | null
          purchases: number | null
          reach: number | null
          roas: number | null
          spend: number | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          adset_name?: string | null
          campaign_id: string
          clicks?: number | null
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          meta_adset_id: string
          meta_campaign_id: string
          phase?: string | null
          purchase_value?: number | null
          purchases?: number | null
          reach?: number | null
          roas?: number | null
          spend?: number | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          adset_name?: string | null
          campaign_id?: string
          clicks?: number | null
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          meta_adset_id?: string
          meta_campaign_id?: string
          phase?: string | null
          purchase_value?: number | null
          purchases?: number | null
          reach?: number | null
          roas?: number | null
          spend?: number | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adset_metrics_daily_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          context_type: string | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          message: string | null
          messages: Json | null
          module: string | null
          response: string | null
          summary: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          context_type?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          message?: string | null
          messages?: Json | null
          module?: string | null
          response?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          context_type?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          message?: string | null
          messages?: Json | null
          module?: string | null
          response?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      ai_requests: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          endpoint: string
          id: string
          input_tokens: number | null
          model: string
          output_tokens: number | null
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          endpoint?: string
          id?: string
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          endpoint?: string
          id?: string
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audits: {
        Row: {
          action_plan: string | null
          audited: string | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          findings: Json | null
          id: string
          resolved_at: string | null
          severity: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          action_plan?: string | null
          audited?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          findings?: Json | null
          id?: string
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          action_plan?: string | null
          audited?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          findings?: Json | null
          id?: string
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          after_state: Json | null
          approved_at: string | null
          before_state: Json | null
          created_at: string | null
          decision_snapshot: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          error_message: string | null
          executed_at: string | null
          id: string
          rejected_at: string | null
          requires_approval: boolean | null
          result_message: string | null
          rule_id: string
          status: string
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          after_state?: Json | null
          approved_at?: string | null
          before_state?: Json | null
          created_at?: string | null
          decision_snapshot?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          rejected_at?: string | null
          requires_approval?: boolean | null
          result_message?: string | null
          rule_id: string
          status?: string
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          after_state?: Json | null
          approved_at?: string | null
          before_state?: Json | null
          created_at?: string | null
          decision_snapshot?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          rejected_at?: string | null
          requires_approval?: boolean | null
          result_message?: string | null
          rule_id?: string
          status?: string
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          approval_required: boolean | null
          auto_execute: boolean | null
          conditions: Json
          cooldown_hours: number | null
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          is_enabled: boolean | null
          last_triggered_at: string | null
          max_triggers: number | null
          name: string
          priority: number | null
          rule_type: string
          source: string | null
          trigger_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions?: Json
          approval_required?: boolean | null
          auto_execute?: boolean | null
          conditions?: Json
          cooldown_hours?: number | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          is_enabled?: boolean | null
          last_triggered_at?: string | null
          max_triggers?: number | null
          name: string
          priority?: number | null
          rule_type: string
          source?: string | null
          trigger_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json
          approval_required?: boolean | null
          auto_execute?: boolean | null
          conditions?: Json
          cooldown_hours?: number | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          is_enabled?: boolean | null
          last_triggered_at?: string | null
          max_triggers?: number | null
          name?: string
          priority?: number | null
          rule_type?: string
          source?: string | null
          trigger_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing_history: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          period_end: string | null
          period_start: string | null
          status: string | null
          stripe_invoice_id: string | null
          workspace_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          category: string | null
          client_id: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          pinned: boolean | null
          project_id: string | null
          title: string
          updated_at: string | null
          url: string
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          pinned?: boolean | null
          project_id?: string | null
          title: string
          updated_at?: string | null
          url: string
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          pinned?: boolean | null
          project_id?: string | null
          title?: string
          updated_at?: string | null
          url?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          brand_color_primary: string | null
          brand_color_secondary: string | null
          business_name: string | null
          business_portfolio_id: string | null
          business_portfolio_name: string | null
          communication_tone: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          default_daily_budget: number | null
          default_objective: string | null
          default_whatsapp_cta: string | null
          fb_page_id: string | null
          fb_page_name: string | null
          id: string
          industry: string | null
          instagram_account_id: string | null
          instagram_account_name: string | null
          logo_url: string | null
          pixel_id: string | null
          pixel_name: string | null
          selected_ad_account_id: string | null
          selected_ad_account_name: string | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          business_name?: string | null
          business_portfolio_id?: string | null
          business_portfolio_name?: string | null
          communication_tone?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          default_daily_budget?: number | null
          default_objective?: string | null
          default_whatsapp_cta?: string | null
          fb_page_id?: string | null
          fb_page_name?: string | null
          id?: string
          industry?: string | null
          instagram_account_id?: string | null
          instagram_account_name?: string | null
          logo_url?: string | null
          pixel_id?: string | null
          pixel_name?: string | null
          selected_ad_account_id?: string | null
          selected_ad_account_name?: string | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          business_name?: string | null
          business_portfolio_id?: string | null
          business_portfolio_name?: string | null
          communication_tone?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          default_daily_budget?: number | null
          default_objective?: string | null
          default_whatsapp_cta?: string | null
          fb_page_id?: string | null
          fb_page_name?: string | null
          id?: string
          industry?: string | null
          instagram_account_id?: string | null
          instagram_account_name?: string | null
          logo_url?: string | null
          pixel_id?: string | null
          pixel_name?: string | null
          selected_ad_account_id?: string | null
          selected_ad_account_name?: string | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      campaign_actions: {
        Row: {
          action_type: string
          campaign_id: string
          created_at: string | null
          error_message: string | null
          id: string
          meta_campaign_id: string | null
          new_value: Json | null
          previous_value: Json | null
          source: string | null
          status: string
          user_id: string
        }
        Insert: {
          action_type: string
          campaign_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          meta_campaign_id?: string | null
          new_value?: Json | null
          previous_value?: Json | null
          source?: string | null
          status: string
          user_id: string
        }
        Update: {
          action_type?: string
          campaign_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          meta_campaign_id?: string | null
          new_value?: Json | null
          previous_value?: Json | null
          source?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_actions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_metrics_daily: {
        Row: {
          ad_account_id: string
          add_to_cart: number | null
          campaign_id: string
          clicks: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          date: string
          frequency: number | null
          id: string
          impressions: number | null
          initiate_checkout: number | null
          meta_campaign_id: string
          phase: string | null
          purchase_value: number | null
          purchases: number | null
          reach: number | null
          roas: number | null
          spend: number | null
          synced_at: string | null
          user_id: string
          view_content: number | null
        }
        Insert: {
          ad_account_id: string
          add_to_cart?: number | null
          campaign_id: string
          clicks?: number | null
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          date: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          initiate_checkout?: number | null
          meta_campaign_id: string
          phase?: string | null
          purchase_value?: number | null
          purchases?: number | null
          reach?: number | null
          roas?: number | null
          spend?: number | null
          synced_at?: string | null
          user_id: string
          view_content?: number | null
        }
        Update: {
          ad_account_id?: string
          add_to_cart?: number | null
          campaign_id?: string
          clicks?: number | null
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          date?: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          initiate_checkout?: number | null
          meta_campaign_id?: string
          phase?: string | null
          purchase_value?: number | null
          purchases?: number | null
          reach?: number | null
          roas?: number | null
          spend?: number | null
          synced_at?: string | null
          user_id?: string
          view_content?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_daily_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ai_copies: Json | null
          campaign_structure: Json | null
          created_at: string | null
          creative_urls: string[] | null
          daily_budget: number
          destination_url: string | null
          end_date: string | null
          estimated_results: Json | null
          fb_account_id: string | null
          fb_ad_id: string | null
          fb_adset_id: string | null
          fb_campaign_id: string | null
          id: string
          meta_ad_ids: string[] | null
          meta_adset_ids: string[] | null
          meta_campaign_id: string | null
          meta_creative_ids: string[] | null
          meta_status: string | null
          metrics: Json | null
          name: string
          objective: string
          product_description: string | null
          product_url: string | null
          recommended_placement: string | null
          recommended_schedule: string | null
          start_date: string | null
          status: string | null
          strategy_type: string | null
          target_age_max: number | null
          target_age_min: number | null
          target_audience: string | null
          target_country: string | null
          target_gender: string | null
          target_interests: Json | null
          updated_at: string | null
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          ai_copies?: Json | null
          campaign_structure?: Json | null
          created_at?: string | null
          creative_urls?: string[] | null
          daily_budget: number
          destination_url?: string | null
          end_date?: string | null
          estimated_results?: Json | null
          fb_account_id?: string | null
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          id?: string
          meta_ad_ids?: string[] | null
          meta_adset_ids?: string[] | null
          meta_campaign_id?: string | null
          meta_creative_ids?: string[] | null
          meta_status?: string | null
          metrics?: Json | null
          name: string
          objective: string
          product_description?: string | null
          product_url?: string | null
          recommended_placement?: string | null
          recommended_schedule?: string | null
          start_date?: string | null
          status?: string | null
          strategy_type?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_audience?: string | null
          target_country?: string | null
          target_gender?: string | null
          target_interests?: Json | null
          updated_at?: string | null
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          ai_copies?: Json | null
          campaign_structure?: Json | null
          created_at?: string | null
          creative_urls?: string[] | null
          daily_budget?: number
          destination_url?: string | null
          end_date?: string | null
          estimated_results?: Json | null
          fb_account_id?: string | null
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          id?: string
          meta_ad_ids?: string[] | null
          meta_adset_ids?: string[] | null
          meta_campaign_id?: string | null
          meta_creative_ids?: string[] | null
          meta_status?: string | null
          metrics?: Json | null
          name?: string
          objective?: string
          product_description?: string | null
          product_url?: string | null
          recommended_placement?: string | null
          recommended_schedule?: string | null
          start_date?: string | null
          status?: string | null
          strategy_type?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_audience?: string | null
          target_country?: string | null
          target_gender?: string | null
          target_interests?: Json | null
          updated_at?: string | null
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_fb_account_id_fkey"
            columns: ["fb_account_id"]
            isOneToOne: false
            referencedRelation: "fb_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_access: {
        Row: {
          access_token: string | null
          client_id: string | null
          created_at: string | null
          email: string
          id: string
          last_access: string | null
          permissions: Json | null
          workspace_id: string | null
        }
        Insert: {
          access_token?: string | null
          client_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          last_access?: string | null
          permissions?: Json | null
          workspace_id?: string | null
        }
        Update: {
          access_token?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_access?: string | null
          permissions?: Json | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_access_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_access_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          email: string | null
          id: string
          industry: string | null
          logo_url: string | null
          monthly_value: number | null
          name: string
          notes: string | null
          pays_percentage: boolean | null
          percentage_value: number | null
          phone: string | null
          status: string | null
          updated_at: string | null
          website: string | null
          workspace_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          monthly_value?: number | null
          name: string
          notes?: string | null
          pays_percentage?: boolean | null
          percentage_value?: number | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
          workspace_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          monthly_value?: number | null
          name?: string
          notes?: string | null
          pays_percentage?: boolean | null
          percentage_value?: number | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          author_name: string | null
          created_at: string | null
          id: string
          report_id: string | null
          task_id: string | null
          text: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string | null
          id?: string
          report_id?: string | null
          task_id?: string | null
          text: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string | null
          id?: string
          report_id?: string | null
          task_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_monthly_records: {
        Row: {
          commission_amount: number | null
          contract_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          month: number
          monthly_fee: number
          notes: string | null
          status: string | null
          workspace_id: string | null
          year: number
        }
        Insert: {
          commission_amount?: number | null
          contract_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          month: number
          monthly_fee: number
          notes?: string | null
          status?: string | null
          workspace_id?: string | null
          year: number
        }
        Update: {
          commission_amount?: number | null
          contract_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          month?: number
          monthly_fee?: number
          notes?: string | null
          status?: string | null
          workspace_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_monthly_records_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "trafficker_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string | null
          client_name: string | null
          code: string
          created_at: string | null
          currency: string | null
          end_date: string | null
          id: string
          monthly_fee: number | null
          notes: string | null
          service: string | null
          start_date: string | null
          status: string | null
          trafficker_name: string
          workspace_id: string | null
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          code: string
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          monthly_fee?: number | null
          notes?: string | null
          service?: string | null
          start_date?: string | null
          status?: string | null
          trafficker_name: string
          workspace_id?: string | null
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          code?: string
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          monthly_fee?: number | null
          notes?: string | null
          service?: string | null
          start_date?: string | null
          status?: string | null
          trafficker_name?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      creative_analysis: {
        Row: {
          analysis_type: string | null
          analyzed_at: string | null
          campaign_id: string | null
          creative_url: string | null
          id: string
          performance_correlation: Json | null
          scores: Json | null
          suggestions: string[] | null
          user_id: string
        }
        Insert: {
          analysis_type?: string | null
          analyzed_at?: string | null
          campaign_id?: string | null
          creative_url?: string | null
          id?: string
          performance_correlation?: Json | null
          scores?: Json | null
          suggestions?: string[] | null
          user_id: string
        }
        Update: {
          analysis_type?: string | null
          analyzed_at?: string | null
          campaign_id?: string | null
          creative_url?: string | null
          id?: string
          performance_correlation?: Json | null
          scores?: Json | null
          suggestions?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_analysis_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_usage: {
        Row: {
          action: string
          campaign_id: string | null
          created_at: string | null
          credits_used: number | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          campaign_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          campaign_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          ai_analysis: string | null
          created_at: string | null
          email_sent_at: string | null
          email_status: string | null
          id: string
          metrics_snapshot: Json
          recommendations: Json | null
          report_date: string
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          id?: string
          metrics_snapshot?: Json
          recommendations?: Json | null
          report_date: string
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          id?: string
          metrics_snapshot?: Json
          recommendations?: Json | null
          report_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      docs: {
        Row: {
          category: string | null
          client_id: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          project_id: string | null
          title: string
          type: string | null
          updated_at: string | null
          version: number | null
          version_notes: string | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          version?: number | null
          version_notes?: string | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          version?: number | null
          version_notes?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "docs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "docs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "docs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_connections: {
        Row: {
          access_token: string
          ad_account_id: string | null
          ad_account_name: string | null
          created_at: string | null
          facebook_user_id: string | null
          id: string
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          ad_account_id?: string | null
          ad_account_name?: string | null
          created_at?: string | null
          facebook_user_id?: string | null
          id?: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          ad_account_id?: string | null
          ad_account_name?: string | null
          created_at?: string | null
          facebook_user_id?: string | null
          id?: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fb_accounts: {
        Row: {
          access_token: string
          account_name: string | null
          created_at: string | null
          currency: string | null
          fb_ad_account_id: string
          fb_user_id: string
          id: string
          is_active: boolean | null
          timezone: string | null
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_name?: string | null
          created_at?: string | null
          currency?: string | null
          fb_ad_account_id: string
          fb_user_id: string
          id?: string
          is_active?: boolean | null
          timezone?: string | null
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_name?: string | null
          created_at?: string | null
          currency?: string | null
          fb_ad_account_id?: string
          fb_user_id?: string
          id?: string
          is_active?: boolean | null
          timezone?: string | null
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_client_monthly: {
        Row: {
          billed_amount: number | null
          client_id: string | null
          closed_at: string | null
          commission_amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          month: number
          notes: string | null
          status: string | null
          workspace_id: string | null
          year: number
        }
        Insert: {
          billed_amount?: number | null
          client_id?: string | null
          closed_at?: string | null
          commission_amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          month: number
          notes?: string | null
          status?: string | null
          workspace_id?: string | null
          year: number
        }
        Update: {
          billed_amount?: number | null
          client_id?: string | null
          closed_at?: string | null
          commission_amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          month?: number
          notes?: string | null
          status?: string | null
          workspace_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_client_monthly_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "finance_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_clients: {
        Row: {
          accounts_count: number | null
          assigned_to: string | null
          cancelled_amount: number | null
          category_id: string | null
          client_name: string
          commission_amount: number | null
          commission_percent: number | null
          company_name: string | null
          contract_cost: number | null
          contract_pdf_name: string | null
          contract_pdf_url: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          id: string
          observations: string | null
          start_date: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          accounts_count?: number | null
          assigned_to?: string | null
          cancelled_amount?: number | null
          category_id?: string | null
          client_name: string
          commission_amount?: number | null
          commission_percent?: number | null
          company_name?: string | null
          contract_cost?: number | null
          contract_pdf_name?: string | null
          contract_pdf_url?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          observations?: string | null
          start_date?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          accounts_count?: number | null
          assigned_to?: string | null
          cancelled_amount?: number | null
          category_id?: string | null
          client_name?: string
          commission_amount?: number | null
          commission_percent?: number | null
          company_name?: string | null
          contract_cost?: number | null
          contract_pdf_name?: string | null
          contract_pdf_url?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          observations?: string | null
          start_date?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_clients_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forecasts: {
        Row: {
          actual_value: number | null
          confidence_level: number | null
          created_at: string | null
          forecast_type: string
          id: string
          model_inputs: Json | null
          predicted_value: number | null
          target_month: string
          user_id: string
        }
        Insert: {
          actual_value?: number | null
          confidence_level?: number | null
          created_at?: string | null
          forecast_type: string
          id?: string
          model_inputs?: Json | null
          predicted_value?: number | null
          target_month: string
          user_id: string
        }
        Update: {
          actual_value?: number | null
          confidence_level?: number | null
          created_at?: string | null
          forecast_type?: string
          id?: string
          model_inputs?: Json | null
          predicted_value?: number | null
          target_month?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string | null
          created_at: string | null
          expiry_date: number | null
          id: string
          refresh_token: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expiry_date?: number | null
          id?: string
          refresh_token?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expiry_date?: number | null
          id?: string
          refresh_token?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_benchmarks: {
        Row: {
          country: string
          id: string
          industry: string
          metric: string
          period: string | null
          sample_size: number | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          country: string
          id?: string
          industry: string
          metric: string
          period?: string | null
          sample_size?: number | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          country?: string
          id?: string
          industry?: string
          metric?: string
          period?: string | null
          sample_size?: number | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          issue_date: string | null
          items: Json | null
          notes: string | null
          number: string
          paid_at: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          total: number | null
          workspace_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string | null
          items?: Json | null
          notes?: string | null
          number: string
          paid_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          workspace_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string | null
          items?: Json | null
          notes?: string | null
          number?: string
          paid_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string | null
          due_date: string | null
          id: string
          metric_type: string | null
          objective_id: string | null
          start_value: number | null
          status: string | null
          target_value: number
          title: string
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          metric_type?: string | null
          objective_id?: string | null
          start_value?: number | null
          status?: string | null
          target_value: number
          title: string
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          metric_type?: string | null
          objective_id?: string | null
          start_value?: number | null
          status?: string | null
          target_value?: number
          title?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_records: {
        Row: {
          id: string
          kpi_id: string | null
          notes: string | null
          period_end: string | null
          period_start: string | null
          recorded_at: string | null
          value: number
        }
        Insert: {
          id?: string
          kpi_id?: string | null
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          recorded_at?: string | null
          value: number
        }
        Update: {
          id?: string
          kpi_id?: string | null
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          recorded_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_records_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          category: string | null
          client_id: string | null
          color: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          frequency: string | null
          id: string
          name: string
          target_value: number | null
          unit: string | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          frequency?: string | null
          id?: string
          name: string
          target_value?: number | null
          unit?: string | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          frequency?: string | null
          id?: string
          name?: string
          target_value?: number | null
          unit?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      level_history: {
        Row: {
          created_at: string | null
          id: string
          level_name: string
          new_level: number
          old_level: number | null
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level_name: string
          new_level: number
          old_level?: number | null
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level_name?: string
          new_level?: number
          old_level?: number | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          agreed_tasks: Json | null
          attendees: string[] | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          decisions: string | null
          file_urls: string[] | null
          id: string
          next_meeting_date: string | null
          notes: string | null
          summary: string | null
          title: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          agreed_tasks?: Json | null
          attendees?: string[] | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          decisions?: string | null
          file_urls?: string[] | null
          id?: string
          next_meeting_date?: string | null
          notes?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          agreed_tasks?: Json | null
          attendees?: string[] | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          decisions?: string | null
          file_urls?: string[] | null
          id?: string
          next_meeting_date?: string | null
          notes?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_observations: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          milestone_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          milestone_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          milestone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_observations_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      minutes: {
        Row: {
          action_items: Json | null
          agenda: Json | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          decisions: Json | null
          discussion_points: string | null
          id: string
          meeting_date: string | null
          meeting_type: string | null
          participants: string[] | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          action_items?: Json | null
          agenda?: Json | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          decisions?: Json | null
          discussion_points?: string | null
          id?: string
          meeting_date?: string | null
          meeting_type?: string | null
          participants?: string[] | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          action_items?: Json | null
          agenda?: Json | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          decisions?: Json | null
          discussion_points?: string | null
          id?: string
          meeting_date?: string | null
          meeting_type?: string | null
          participants?: string[] | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "minutes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minutes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minutes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_budgets: {
        Row: {
          avg_ticket: number | null
          created_at: string | null
          currency: string | null
          id: string
          margin_pct: number | null
          month_year: string
          phase_budgets: Json | null
          phase_budgets_recommended: Json | null
          phase_results: Json | null
          target_roas: number | null
          total_budget: number
          user_id: string
        }
        Insert: {
          avg_ticket?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          margin_pct?: number | null
          month_year: string
          phase_budgets?: Json | null
          phase_budgets_recommended?: Json | null
          phase_results?: Json | null
          target_roas?: number | null
          total_budget: number
          user_id: string
        }
        Update: {
          avg_ticket?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          margin_pct?: number | null
          month_year?: string
          phase_budgets?: Json | null
          phase_budgets_recommended?: Json | null
          phase_results?: Json | null
          target_roas?: number | null
          total_budget?: number
          user_id?: string
        }
        Relationships: []
      }
      monthly_reports: {
        Row: {
          ai_analysis: string | null
          avg_cpa: number | null
          avg_ctr: number | null
          avg_roas: number | null
          budget_efficiency: number | null
          budget_planned: number | null
          budget_spent: number | null
          campaigns_active: number | null
          campaigns_created: number | null
          created_at: string | null
          email_sent_at: string | null
          email_status: string | null
          growth_rate: number | null
          id: string
          month_year: string
          phase_metrics: Json | null
          pixel_events_snapshot: Json | null
          pixel_level_end: number | null
          pixel_level_start: number | null
          recommendations: Json | null
          total_clicks: number | null
          total_conversions: number | null
          total_impressions: number | null
          total_revenue: number | null
          total_spend: number | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          avg_cpa?: number | null
          avg_ctr?: number | null
          avg_roas?: number | null
          budget_efficiency?: number | null
          budget_planned?: number | null
          budget_spent?: number | null
          campaigns_active?: number | null
          campaigns_created?: number | null
          created_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          growth_rate?: number | null
          id?: string
          month_year: string
          phase_metrics?: Json | null
          pixel_events_snapshot?: Json | null
          pixel_level_end?: number | null
          pixel_level_start?: number | null
          recommendations?: Json | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_impressions?: number | null
          total_revenue?: number | null
          total_spend?: number | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          avg_cpa?: number | null
          avg_ctr?: number | null
          avg_roas?: number | null
          budget_efficiency?: number | null
          budget_planned?: number | null
          budget_spent?: number | null
          campaigns_active?: number | null
          campaigns_created?: number | null
          created_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          growth_rate?: number | null
          id?: string
          month_year?: string
          phase_metrics?: Json | null
          pixel_events_snapshot?: Json | null
          pixel_level_end?: number | null
          pixel_level_start?: number | null
          recommendations?: Json | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_impressions?: number | null
          total_revenue?: number | null
          total_spend?: number | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          metadata: Json | null
          read: boolean | null
          severity: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          severity?: string | null
          title: string
          type: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          severity?: string | null
          title?: string
          type?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      objectives: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          owner_id: string | null
          quarter: string | null
          status: string | null
          title: string
          type: string | null
          workspace_id: string | null
          year: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          owner_id?: string | null
          quarter?: string | null
          status?: string | null
          title: string
          type?: string | null
          workspace_id?: string | null
          year?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          owner_id?: string | null
          quarter?: string | null
          status?: string | null
          title?: string
          type?: string | null
          workspace_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "objectives_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          base_salary: number | null
          bonus: number | null
          created_at: string | null
          currency: string | null
          deductions: number | null
          employee_name: string
          id: string
          net_salary: number | null
          notes: string | null
          pay_date: string | null
          period: string | null
          role: string | null
          status: string | null
          workspace_id: string | null
        }
        Insert: {
          base_salary?: number | null
          bonus?: number | null
          created_at?: string | null
          currency?: string | null
          deductions?: number | null
          employee_name: string
          id?: string
          net_salary?: number | null
          notes?: string | null
          pay_date?: string | null
          period?: string | null
          role?: string | null
          status?: string | null
          workspace_id?: string | null
        }
        Update: {
          base_salary?: number | null
          bonus?: number | null
          created_at?: string | null
          currency?: string | null
          deductions?: number | null
          employee_name?: string
          id?: string
          net_salary?: number | null
          notes?: string | null
          pay_date?: string | null
          period?: string | null
          role?: string | null
          status?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      pixel_analysis: {
        Row: {
          analyzed_at: string | null
          available_audience_types: string[] | null
          available_strategies: string[] | null
          can_create_lookalike: boolean | null
          can_retarget_add_to_cart: boolean | null
          can_retarget_purchase: boolean | null
          can_retarget_view_content: boolean | null
          created_at: string | null
          events_data: Json
          id: string
          level: number
          level_name: string
          pixel_id: string
          purchase_value_30d: number | null
          total_add_to_cart_30d: number | null
          total_page_views_30d: number | null
          total_purchases_180d: number | null
          total_purchases_30d: number | null
          total_view_content_30d: number | null
          user_id: string
        }
        Insert: {
          analyzed_at?: string | null
          available_audience_types?: string[] | null
          available_strategies?: string[] | null
          can_create_lookalike?: boolean | null
          can_retarget_add_to_cart?: boolean | null
          can_retarget_purchase?: boolean | null
          can_retarget_view_content?: boolean | null
          created_at?: string | null
          events_data?: Json
          id?: string
          level?: number
          level_name?: string
          pixel_id: string
          purchase_value_30d?: number | null
          total_add_to_cart_30d?: number | null
          total_page_views_30d?: number | null
          total_purchases_180d?: number | null
          total_purchases_30d?: number | null
          total_view_content_30d?: number | null
          user_id: string
        }
        Update: {
          analyzed_at?: string | null
          available_audience_types?: string[] | null
          available_strategies?: string[] | null
          can_create_lookalike?: boolean | null
          can_retarget_add_to_cart?: boolean | null
          can_retarget_purchase?: boolean | null
          can_retarget_view_content?: boolean | null
          created_at?: string | null
          events_data?: Json
          id?: string
          level?: number
          level_name?: string
          pixel_id?: string
          purchase_value_30d?: number | null
          total_add_to_cart_30d?: number | null
          total_page_views_30d?: number | null
          total_purchases_180d?: number | null
          total_purchases_30d?: number | null
          total_view_content_30d?: number | null
          user_id?: string
        }
        Relationships: []
      }
      professional_types: {
        Row: {
          ai_agent_context: string | null
          color: string | null
          created_at: string | null
          default_client_categories: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
          suggested_kpis: string[] | null
          terminology: Json | null
        }
        Insert: {
          ai_agent_context?: string | null
          color?: string | null
          created_at?: string | null
          default_client_categories?: Json | null
          description?: string | null
          icon?: string | null
          id: string
          name: string
          suggested_kpis?: string[] | null
          terminology?: Json | null
        }
        Update: {
          ai_agent_context?: string | null
          color?: string | null
          created_at?: string | null
          default_client_categories?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          suggested_kpis?: string[] | null
          terminology?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          credits_reset_date: string | null
          credits_total: number | null
          credits_used: number | null
          full_name: string | null
          id: string
          plan: string | null
          report_active: boolean | null
          report_email: string | null
          report_time: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          credits_reset_date?: string | null
          credits_total?: number | null
          credits_used?: number | null
          full_name?: string | null
          id: string
          plan?: string | null
          report_active?: boolean | null
          report_email?: string | null
          report_time?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          credits_reset_date?: string | null
          credits_total?: number | null
          credits_used?: number | null
          full_name?: string | null
          id?: string
          plan?: string | null
          report_active?: boolean | null
          report_email?: string | null
          report_time?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          position: number | null
          project_id: string | null
          title: string
          workspace_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          project_id?: string | null
          title: string
          workspace_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          project_id?: string | null
          title?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          budget_spent: number | null
          client_id: string | null
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          owner_id: string | null
          priority: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          budget?: number | null
          budget_spent?: number | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          owner_id?: string | null
          priority?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          budget?: number | null
          budget_spent?: number | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          priority?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recordings: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          duration: number | null
          id: string
          notes: string | null
          participants: string | null
          platform: string | null
          recorded_at: string | null
          title: string
          updated_at: string | null
          url: string | null
          workspace_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: number | null
          id?: string
          notes?: string | null
          participants?: string | null
          platform?: string | null
          recorded_at?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
          workspace_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: number | null
          id?: string
          notes?: string | null
          participants?: string | null
          platform?: string | null
          recorded_at?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recordings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          client_id: string | null
          content: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          period_end: string | null
          period_start: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          client_id?: string | null
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          client_id?: string | null
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scaling_rule_logs: {
        Row: {
          action_taken: string | null
          campaign_id: string | null
          condition_snapshot: Json | null
          details: Json | null
          id: string
          result: string | null
          rule_id: string
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          campaign_id?: string | null
          condition_snapshot?: Json | null
          details?: Json | null
          id?: string
          result?: string | null
          rule_id: string
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          campaign_id?: string | null
          condition_snapshot?: Json | null
          details?: Json | null
          id?: string
          result?: string | null
          rule_id?: string
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scaling_rule_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scaling_rule_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "scaling_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      scaling_rules: {
        Row: {
          action_type: string
          action_value: number | null
          campaign_id: string | null
          condition_metric: string
          condition_operator: string
          condition_period: string | null
          condition_value: number
          cooldown_hours: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          rule_type: string
          trigger_count: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          action_value?: number | null
          campaign_id?: string | null
          condition_metric: string
          condition_operator: string
          condition_period?: string | null
          condition_value: number
          cooldown_hours?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          rule_type: string
          trigger_count?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          action_value?: number | null
          campaign_id?: string | null
          condition_metric?: string
          condition_operator?: string
          condition_period?: string | null
          condition_value?: number
          cooldown_hours?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          rule_type?: string
          trigger_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scaling_rules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          position: number | null
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number | null
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      strategic_decision_history: {
        Row: {
          action_status: string | null
          clicked_at: string | null
          completed_at: string | null
          context_snapshot: Json | null
          created_at: string | null
          expires_at: string | null
          generated_at: string | null
          id: string
          impact_score: number | null
          post_metrics: Json | null
          pre_metrics: Json | null
          primary_action_id: string
          primary_action_impact: string
          primary_action_priority: string
          primary_action_reason: string | null
          primary_action_title: string
          secondary_action_ids: string[] | null
          user_id: string
        }
        Insert: {
          action_status?: string | null
          clicked_at?: string | null
          completed_at?: string | null
          context_snapshot?: Json | null
          created_at?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          impact_score?: number | null
          post_metrics?: Json | null
          pre_metrics?: Json | null
          primary_action_id: string
          primary_action_impact: string
          primary_action_priority: string
          primary_action_reason?: string | null
          primary_action_title: string
          secondary_action_ids?: string[] | null
          user_id: string
        }
        Update: {
          action_status?: string | null
          clicked_at?: string | null
          completed_at?: string | null
          context_snapshot?: Json | null
          created_at?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          impact_score?: number | null
          post_metrics?: Json | null
          pre_metrics?: Json | null
          primary_action_id?: string
          primary_action_impact?: string
          primary_action_priority?: string
          primary_action_reason?: string | null
          primary_action_title?: string
          secondary_action_ids?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          adsets_synced: number | null
          campaigns_synced: number | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          errors: Json | null
          id: string
          started_at: string | null
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          adsets_synced?: number | null
          campaigns_synced?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          errors?: Json | null
          id?: string
          started_at?: string | null
          status: string
          sync_type: string
          user_id: string
        }
        Update: {
          adsets_synced?: number | null
          campaigns_synced?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          errors?: Json | null
          id?: string
          started_at?: string | null
          status?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          parent_task_id: string | null
          position: number | null
          priority: string | null
          project_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          position?: number | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          position?: number | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      trafficker_contracts: {
        Row: {
          client_name: string
          code: string
          commission_percent: number | null
          contract_pdf_url: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          id: string
          monthly_fee: number
          notes: string | null
          service: string | null
          start_date: string | null
          status: string | null
          trafficker_name: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          client_name?: string
          code: string
          commission_percent?: number | null
          contract_pdf_url?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          monthly_fee?: number
          notes?: string | null
          service?: string | null
          start_date?: string | null
          status?: string | null
          trafficker_name: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          client_name?: string
          code?: string
          commission_percent?: number | null
          contract_pdf_url?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          monthly_fee?: number
          notes?: string | null
          service?: string | null
          start_date?: string | null
          status?: string | null
          trafficker_name?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          client_id: string | null
          created_at: string | null
          currency: string | null
          date: string | null
          description: string | null
          id: string
          invoice_id: string | null
          project_id: string | null
          type: string
          workspace_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          project_id?: string | null
          type: string
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          project_id?: string | null
          type?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          id: string
          notified: boolean | null
          source_context: Json | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          id?: string
          notified?: boolean | null
          source_context?: Json | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          id?: string
          notified?: boolean | null
          source_context?: Json | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_actions_log: {
        Row: {
          action_id: string
          action_label: string | null
          action_type: string
          context_metrics: Json | null
          created_at: string | null
          id: string
          related_entity_id: string | null
          related_entity_type: string | null
          source: string | null
          target_url: string | null
          user_id: string
        }
        Insert: {
          action_id: string
          action_label?: string | null
          action_type: string
          context_metrics?: Json | null
          created_at?: string | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          source?: string | null
          target_url?: string | null
          user_id: string
        }
        Update: {
          action_id?: string
          action_label?: string | null
          action_type?: string
          context_metrics?: Json | null
          created_at?: string | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          source?: string | null
          target_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string | null
          event: string
          id: string
          properties: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event?: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      workspace_ai_config: {
        Row: {
          agent_avatar: string | null
          agent_name: string | null
          agent_personality: string | null
          ai_provider: string | null
          anthropic_api_key: string | null
          created_at: string | null
          id: string
          language: string | null
          openai_api_key: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_avatar?: string | null
          agent_name?: string | null
          agent_personality?: string | null
          ai_provider?: string | null
          anthropic_api_key?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          openai_api_key?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_avatar?: string | null
          agent_name?: string | null
          agent_personality?: string | null
          ai_provider?: string | null
          anthropic_api_key?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          openai_api_key?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_ai_config_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          role: string | null
          token: string | null
          workspace_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          role?: string | null
          token?: string | null
          workspace_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          role?: string | null
          token?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          status: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          status?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          status?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          agency_type: string | null
          created_at: string | null
          currency: string | null
          id: string
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          owner_id: string
          plan: string | null
          plan_expires_at: string | null
          professional_type_custom: string | null
          professional_type_id: string | null
          slug: string | null
          stripe_customer_id: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          agency_type?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          owner_id: string
          plan?: string | null
          plan_expires_at?: string | null
          professional_type_custom?: string | null
          professional_type_id?: string | null
          slug?: string | null
          stripe_customer_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          agency_type?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          owner_id?: string
          plan?: string | null
          plan_expires_at?: string | null
          professional_type_custom?: string | null
          professional_type_id?: string | null
          slug?: string | null
          stripe_customer_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_plan: {
        Args: { p_plan: string; p_user_id: string }
        Returns: undefined
      }
      consume_user_credits: {
        Args: {
          p_action: string
          p_campaign_id?: string
          p_cost?: number
          p_user_id: string
        }
        Returns: {
          credits_remaining: number
          success: boolean
        }[]
      }
      get_user_workspace_id: { Args: { uid: string }; Returns: string }
      increment_credits_used: {
        Args: { p_user_id: string }
        Returns: undefined
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

