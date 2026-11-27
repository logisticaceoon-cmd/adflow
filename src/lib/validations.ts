// src/lib/validations.ts
// Zod schemas for API request validation.
import { z } from 'zod'

// ── AI Generate Copies ────────────────────────────────────────────────────
export const generateCopiesSchema = z.object({
  product_description: z.string().min(1).max(2000),
  strategy_type: z.enum(['TOFU', 'MOFU', 'BOFU']).optional(),
  objective: z.string().max(100).optional(),
  daily_budget: z.number().min(1).max(100000).optional(),
  target_country: z.string().max(100).optional(),
  existing_copy: z.string().max(2000).optional(),
  target_audience: z.string().max(1000).optional(),
  image_base64s: z.array(z.string()).max(10).optional(),
  image_media_types: z.array(z.string()).max(10).optional(),
  image_base64: z.string().optional(),
  image_media_type: z.string().optional(),
  video_name: z.string().max(200).optional(),
  business_type: z.string().max(100).optional(),
  advertising_status: z.string().max(100).optional(),
  main_objective: z.string().max(100).optional(),
  monthly_budget: z.number().optional(),
  current_roas: z.number().optional(),
  currency: z.string().max(10).optional(),
  destination_url: z.string().url().max(500).optional().or(z.literal('')),
  whatsapp_number: z.string().max(30).optional(),
  pixel_level: z.number().optional(),
  pixel_data: z.unknown().optional(),
  campaign_id: z.string().uuid().optional().nullable(),
  // New enriched context fields
  campaign_objective: z.enum(['sales_web', 'sales_whatsapp', 'instagram_traffic']).optional(),
  duration: z.number().optional(),
  business_name: z.string().max(200).optional(),
  communication_tone: z.string().max(50).optional(),
  default_whatsapp_cta: z.string().max(500).optional(),
  fb_page_name: z.string().max(200).optional(),
  instagram_account_name: z.string().max(200).optional(),
})

// ── Facebook Publish Campaign ─────────────────────────────────────────────
export const publishCampaignSchema = z.object({
  campaign_id: z.string().uuid(),
})

// ── Facebook Scale Budget ─────────────────────────────────────────────────
export const scaleBudgetSchema = z.object({
  campaign_id: z.string().uuid(),
  pct_change: z.number().min(-99).max(1000).optional(),
  new_daily_budget: z.number().min(0.01).max(10000).optional(),
})

// ── Facebook Activate/Pause ───────────────────────────────────────────────
export const activateCampaignSchema = z.object({
  campaign_id: z.string().uuid(),
  action: z.enum(['activate', 'pause']),
})

// ── Email Send ────────────────────────────────────────────────────────────
export const emailSendSchema = z.object({
  to: z.string().email().or(z.array(z.string().email())),
  subject: z.string().min(1).max(500),
  html: z.string().min(1).max(100000),
})

// ── Actions Track ─────────────────────────────────────────────────────────
export const actionsTrackSchema = z.object({
  action_id: z.string().min(1).max(200),
  action_label: z.string().max(200).optional(),
  target_url: z.string().max(500).optional(),
  source: z.string().max(50).optional(),
  context_metrics: z.record(z.string(), z.number()).optional(),
})

// ── Admin Update Credits ──────────────────────────────────────────────────
export const updateCreditsSchema = z.object({
  userId: z.string().uuid(),
  credits_total: z.number().min(0).optional(),
  plan: z.enum(['free', 'starter', 'pro', 'agency']).optional(),
})

// ── Budget Save ──────────────────────────────────────────────────────────
export const budgetSaveSchema = z.object({
  total_budget: z.number().positive('Presupuesto debe ser mayor a 0'),
  month_year: z.string().regex(/^\d{4}-\d{2}$/, 'Formato debe ser YYYY-MM').optional(),
  currency: z.string().min(2).max(4).optional(),
  phase_budgets: z.record(z.string(), z.number().min(0)).optional(),
  phase_budgets_recommended: z.record(z.string(), z.number().min(0)).optional(),
  phase_results: z.record(z.string(), z.unknown()).optional(),
  avg_ticket: z.number().min(0).nullable().optional(),
  margin_pct: z.number().min(0).max(100).nullable().optional(),
  target_roas: z.number().min(0).nullable().optional(),
})

// ── Automation Rules ──────────────────────────────────────────────────────
export const automationRuleSchema = z.object({
  name: z.string().min(1).max(200),
  entity_type: z.enum(['campaign', 'adset']),
  entity_id: z.string().optional(),
  action_type: z.string().min(1).max(50),
  condition_type: z.string().min(1).max(50),
  condition_value: z.number(),
  condition_window_days: z.number().min(1).max(90).optional(),
  action_value: z.number().optional(),
  enabled: z.boolean().optional(),
})

// Helper: validate and return typed data or error response
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data: T; error?: never } | { data?: never; error: string } {
  const result = schema.safeParse(data)
  if (result.success) return { data: result.data }
  const messages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
  return { error: messages }
}
