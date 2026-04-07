// src/types/advanced.ts
// Type definitions for Phase 4 modules: autoscaling, forecast, AI strategist,
// creative analysis, industry benchmarks. Engines are stubbed — these types
// define the contract that future implementations must honor.

// ── Auto-scaling ───────────────────────────────────────────────────────────
export type ScalingRuleType       = 'scale_up' | 'scale_down' | 'pause' | 'alert'
export type ScalingConditionMetric = 'roas' | 'cpa' | 'ctr' | 'spend' | 'frequency'
export type ScalingConditionOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
export type ScalingConditionPeriod = 'last_1d' | 'last_3d' | 'last_7d'
export type ScalingActionType      = 'scale_budget_pct' | 'pause_campaign' | 'send_alert' | 'scale_budget_abs'

export interface ScalingRule {
  id: string
  userId: string
  campaignId?: string
  ruleType: ScalingRuleType
  conditionMetric: ScalingConditionMetric
  conditionOperator: ScalingConditionOperator
  conditionValue: number
  conditionPeriod: ScalingConditionPeriod
  actionType: ScalingActionType
  actionValue?: number
  isActive: boolean
  cooldownHours: number
  lastTriggeredAt?: string
  triggerCount?: number
  createdAt?: string
}

export interface ScalingRuleLog {
  id: string
  ruleId: string
  userId: string
  campaignId?: string
  triggeredAt: string
  conditionSnapshot: Record<string, unknown>
  actionTaken: string | null
  result: 'success' | 'failed' | 'skipped_cooldown'
  details: Record<string, unknown>
}

// ── Forecast ───────────────────────────────────────────────────────────────
export type ForecastType =
  | 'monthly_spend'
  | 'monthly_revenue'
  | 'monthly_conversions'
  | 'level_progression'
  | 'roas_trend'

export interface Forecast {
  id?: string
  userId?: string
  forecastType: ForecastType
  targetMonth: string // 'YYYY-MM'
  predictedValue: number
  confidenceLevel: number // 0.00 - 1.00
  modelInputs: Record<string, unknown>
  actualValue?: number
  createdAt?: string
}

// ── AI Strategist conversation ─────────────────────────────────────────────
export type AIConversationContext = 'general' | 'campaign_review' | 'strategy' | 'troubleshooting'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface AIConversation {
  id: string
  userId: string
  title: string
  contextType: AIConversationContext
  messages: AIMessage[]
  summary?: string
  tags: string[]
  isArchived?: boolean
  createdAt?: string
  updatedAt?: string
}

// ── Creative Analysis ──────────────────────────────────────────────────────
export type CreativeAnalysisType = 'image' | 'video' | 'copy'

export interface CreativeScores {
  attention?: number        // 0.00 - 1.00
  clarity?: number
  emotion?: number
  ctaStrength?: number
  brandConsistency?: number
}

export interface CreativeAnalysis {
  id?: string
  userId?: string
  campaignId?: string
  creativeUrl: string
  analysisType: CreativeAnalysisType
  scores: CreativeScores
  suggestions: string[]
  performanceCorrelation?: Record<string, number> // { ctr: 2.5, roas: 3.1, ... }
  analyzedAt?: string
}

// ── Industry Benchmark ─────────────────────────────────────────────────────
export interface IndustryBenchmark {
  id?: string
  industry: string
  country: string
  metric: string      // 'avg_ctr', 'avg_cpc', 'avg_cpm', 'avg_roas', 'avg_cpa'
  value: number
  sampleSize: number
  period: string      // 'Q1_2026', 'Q2_2026'
  updatedAt?: string
}
