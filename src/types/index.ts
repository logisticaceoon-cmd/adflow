// src/types/index.ts
// Tipos TypeScript para toda la aplicación

export interface Profile {
  id: string
  full_name: string | null
  company: string | null
  plan: 'free' | 'pro' | 'agency'
  report_email: string | null
  report_time: string
  report_active: boolean
  created_at: string
}

export interface FbAccount {
  id: string
  user_id: string
  fb_user_id: string
  fb_ad_account_id: string
  account_name: string | null
  currency: string
  timezone: string
  is_active: boolean
  created_at: string
}

export interface Campaign {
  id: string
  user_id: string
  fb_account_id: string | null
  fb_campaign_id: string | null
  name: string
  objective: CampaignObjective
  daily_budget: number
  start_date: string | null
  end_date: string | null
  status: CampaignStatus
  product_description: string | null
  product_url: string | null
  target_audience: string | null
  ai_copies: AICopies | null
  creative_urls: string[]
  metrics: CampaignMetrics
  created_at: string
  updated_at: string
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'error'
export type CampaignObjective = 'CONVERSIONS' | 'TRAFFIC' | 'REACH' | 'LEAD_GENERATION'

export interface AICopies {
  headlines: string[]         // 3 variantes de título
  primary_text: string        // Texto principal del anuncio
  description: string         // Descripción larga
  call_to_action: string      // Texto del botón
  cta_type: string            // SHOP_NOW, LEARN_MORE, SIGN_UP, etc.
  audience_suggestion: string // Sugerencia de audiencia en texto
  positioning: string         // Análisis del posicionamiento
  tone: string                // Tono del mensaje
}

export interface CampaignMetrics {
  spend?: number
  impressions?: number
  clicks?: number
  ctr?: number
  cpm?: number
  cpc?: number
  conversions?: number
  roas?: number
  cpa?: number
  reach?: number
  frequency?: number
  updated_at?: string
}

export interface DailyReport {
  id: string
  user_id: string
  report_date: string
  metrics_snapshot: Record<string, CampaignMetrics>
  ai_analysis: string | null
  recommendations: Recommendation[]
  email_sent_at: string | null
  email_status: 'pending' | 'sent' | 'error'
  created_at: string
}

export interface Recommendation {
  campaign_id: string
  campaign_name: string
  type: 'scale_up' | 'scale_down' | 'pause' | 'refresh_creative' | 'maintain' | 'duplicate'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: {
    label: string
    new_budget?: number
  }
}

export interface BusinessProfile {
  id: string
  user_id: string
  selected_ad_account_id: string | null
  selected_ad_account_name: string | null
  pixel_id: string | null
  pixel_name: string | null
  fb_page_id: string | null
  fb_page_name: string | null
  instagram_account_id: string | null
  instagram_account_name: string | null
  business_name: string | null
  website_url: string | null
  whatsapp_number: string | null
  industry: string | null
  country: string | null
  currency: string
  logo_url: string | null
  brand_color_primary: string
  brand_color_secondary: string
  communication_tone: string
  default_daily_budget: number
  default_objective: string
  default_whatsapp_cta: string | null
  created_at: string
  updated_at: string
}

// Para el formulario de creación de campaña
export interface CreateCampaignForm {
  name: string
  objective: CampaignObjective
  daily_budget: number
  product_description: string
  product_url: string
  target_audience: string
  end_date?: string
  fb_account_id?: string
}
