// src/types/index.ts

export type UserRole = 'user' | 'admin' | 'super_admin'
export type PlanType = 'free' | 'starter' | 'pro' | 'agency'
export type StrategyType = 'TOFU' | 'MOFU' | 'BOFU'

export interface Profile {
  id: string
  full_name: string | null
  company: string | null
  plan: PlanType
  role: UserRole
  report_email: string | null
  report_time: string
  report_active: boolean
  created_at: string
  credits_total: number
  credits_used: number
  credits_reset_date: string | null
}

export interface CreditsInfo {
  plan: PlanType
  total: number
  used: number
  remaining: number
  resetDate: string | null
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

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'error'
export type CampaignObjective =
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_APP_PROMOTION'
  | 'OUTCOME_SALES'
  // legacy
  | 'CONVERSIONS' | 'TRAFFIC' | 'REACH' | 'LEAD_GENERATION'

// ── AI Targeting (shared) ──────────────────────────────────────────────────
export interface AITargeting {
  age_min: number
  age_max: number
  gender: 'all' | 'male' | 'female'
  interests: Array<{ category: string; interest: string }>
  geo: string
}

// ── Legacy AICopies (kept for backward compat with old campaigns) ──────────
export interface AICopies {
  headlines: string[]
  primary_texts: string[]
  primary_text?: string        // legacy
  description: string
  call_to_action: string
  cta_type: string
  targeting: AITargeting
  recommended_placements: string[]
  recommended_schedule: string
  budget_tip: string
  tone: string
  audience_suggestion?: string // legacy
  positioning?: string         // legacy
}

// ── New campaign structure types ───────────────────────────────────────────
export interface EstimatedResults {
  daily_reach: string
  daily_clicks: string
  daily_conversions: string
  estimated_cpm: string
  estimated_cpa: string
  estimated_roas: string
}

export interface AdCopyItem {
  name: string
  headline: string
  primary_text: string
  description: string
  call_to_action: string
  cta_type?: string
  copy_angle: 'emocional' | 'informativo' | 'urgencia' | 'social_proof'
}

export interface AdSetItem {
  name: string
  audience_type?: string
  requires_pixel?: boolean
  pixel_note?: string
  targeting: {
    age_min: number
    age_max: number
    genders: number[]
    geo_locations: { countries: string[] }
    interests: Array<{ id?: string; name: string }>
    advantage_plus?: boolean
    publisher_platforms: string[]
    facebook_positions: string[]
    instagram_positions: string[]
  }
  optimization_goal: string
  billing_event: string
  daily_budget: number  // in cents
  ads: AdCopyItem[]
}

export interface CampaignStructure {
  name: string
  objective: string
  ad_sets: AdSetItem[]
}

// ── AIStrategy: new format returned by generate-copies API ────────────────
export interface AIStrategy {
  // New strategy fields
  strategy_type: StrategyType
  recommended_budget: number
  budget_justification: string
  estimated_results: EstimatedResults
  campaign: CampaignStructure
  // Backward-compat fields (extracted from first ad set for old consumers)
  headlines: string[]
  primary_texts: string[]
  description: string
  call_to_action: string
  cta_type: string
  targeting: AITargeting
  recommended_placements: string[]
  recommended_schedule: string
  budget_tip: string
  tone: string
  // Legacy optional fields (present in old AICopies stored in DB)
  primary_text?: string
  audience_suggestion?: string
  positioning?: string
}

// ── Campaign ──────────────────────────────────────────────────────────────
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
  ai_copies: AIStrategy | AICopies | null
  creative_urls: string[]
  metrics: CampaignMetrics
  // New strategy fields
  strategy_type: StrategyType | null
  campaign_structure: CampaignStructure | null
  estimated_results: EstimatedResults | null
  meta_campaign_id: string | null
  meta_status: string | null
  destination_url: string | null
  whatsapp_number: string | null
  target_country: string | null
  created_at: string
  updated_at: string
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
  business_portfolio_id: string | null
  business_portfolio_name: string | null
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

// ── Form types ─────────────────────────────────────────────────────────────
export interface CreateCampaignForm {
  product_description: string
  strategy_type: StrategyType
  daily_budget: number
  target_country: string
  existing_copy: string
  target_audience: string
  destination_url: string
  whatsapp_number: string
}
