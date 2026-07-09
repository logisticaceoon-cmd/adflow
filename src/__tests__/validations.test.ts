import { describe, it, expect } from 'vitest'
import {
  generateCopiesSchema,
  publishCampaignSchema,
  scaleBudgetSchema,
  activateCampaignSchema,
  emailSendSchema,
  actionsTrackSchema,
  updateCreditsSchema,
  validate,
} from '@/lib/validations'

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000'

// ── generateCopiesSchema ──────────────────────────────────────────────────────
describe('generateCopiesSchema', () => {
  it('accepts a minimal valid payload (only required field)', () => {
    const result = generateCopiesSchema.safeParse({ product_description: 'Test product' })
    expect(result.success).toBe(true)
  })

  it('rejects missing product_description', () => {
    const result = generateCopiesSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects empty product_description', () => {
    const result = generateCopiesSchema.safeParse({ product_description: '' })
    expect(result.success).toBe(false)
  })

  it('rejects product_description over 2000 chars', () => {
    const result = generateCopiesSchema.safeParse({ product_description: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('accepts a full valid payload', () => {
    const result = generateCopiesSchema.safeParse({
      product_description: 'Zapatillas deportivas',
      strategy_type: 'TOFU',
      objective: 'brand awareness',
      daily_budget: 50,
      target_country: 'Argentina',
      existing_copy: 'Lo mejor del mercado',
      target_audience: 'Jóvenes de 18-35',
      image_base64s: ['base64data'],
      image_media_types: ['image/jpeg'],
      image_base64: 'singlebase64',
      image_media_type: 'image/png',
      video_name: 'mi-video.mp4',
      business_type: 'retail',
      advertising_status: 'nuevo',
      main_objective: 'ventas',
      monthly_budget: 1500,
      current_roas: 3.5,
      currency: 'ARS',
      destination_url: 'https://example.com',
      whatsapp_number: '+5491122334455',
      pixel_level: 2,
      pixel_data: { events: 100 },
      campaign_id: VALID_UUID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid strategy_type enum', () => {
    const result = generateCopiesSchema.safeParse({
      product_description: 'Product',
      strategy_type: 'INVALID',
    })
    expect(result.success).toBe(false)
  })

  it('rejects daily_budget below minimum (1)', () => {
    const result = generateCopiesSchema.safeParse({
      product_description: 'Product',
      daily_budget: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects daily_budget above maximum (100000)', () => {
    const result = generateCopiesSchema.safeParse({
      product_description: 'Product',
      daily_budget: 100001,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid destination_url', () => {
    const result = generateCopiesSchema.safeParse({
      product_description: 'Product',
      destination_url: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty string for destination_url', () => {
    const result = generateCopiesSchema.safeParse({
      product_description: 'Product',
      destination_url: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid campaign_id (not a UUID)', () => {
    const result = generateCopiesSchema.safeParse({
      product_description: 'Product',
      campaign_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('accepts null campaign_id', () => {
    const result = generateCopiesSchema.safeParse({
      product_description: 'Product',
      campaign_id: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects image_base64s with more than 10 items', () => {
    const result = generateCopiesSchema.safeParse({
      product_description: 'Product',
      image_base64s: new Array(11).fill('data'),
    })
    expect(result.success).toBe(false)
  })
})

// ── publishCampaignSchema ─────────────────────────────────────────────────────
describe('publishCampaignSchema', () => {
  it('accepts a valid UUID', () => {
    const result = publishCampaignSchema.safeParse({ campaign_id: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it('rejects missing campaign_id', () => {
    const result = publishCampaignSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID campaign_id', () => {
    const result = publishCampaignSchema.safeParse({ campaign_id: 'abc-123' })
    expect(result.success).toBe(false)
  })
})

// ── scaleBudgetSchema ─────────────────────────────────────────────────────────
describe('scaleBudgetSchema', () => {
  it('accepts campaign_id with pct_change', () => {
    const result = scaleBudgetSchema.safeParse({ campaign_id: VALID_UUID, pct_change: 20 })
    expect(result.success).toBe(true)
  })

  it('accepts campaign_id with new_daily_budget', () => {
    const result = scaleBudgetSchema.safeParse({ campaign_id: VALID_UUID, new_daily_budget: 100 })
    expect(result.success).toBe(true)
  })

  it('accepts campaign_id alone (optional fields)', () => {
    const result = scaleBudgetSchema.safeParse({ campaign_id: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it('rejects pct_change below -99', () => {
    const result = scaleBudgetSchema.safeParse({ campaign_id: VALID_UUID, pct_change: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects pct_change above 1000', () => {
    const result = scaleBudgetSchema.safeParse({ campaign_id: VALID_UUID, pct_change: 1001 })
    expect(result.success).toBe(false)
  })

  it('accepts pct_change at boundary -99', () => {
    const result = scaleBudgetSchema.safeParse({ campaign_id: VALID_UUID, pct_change: -99 })
    expect(result.success).toBe(true)
  })

  it('accepts pct_change at boundary 1000', () => {
    const result = scaleBudgetSchema.safeParse({ campaign_id: VALID_UUID, pct_change: 1000 })
    expect(result.success).toBe(true)
  })

  it('rejects new_daily_budget below 0.01', () => {
    const result = scaleBudgetSchema.safeParse({ campaign_id: VALID_UUID, new_daily_budget: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects new_daily_budget above 10000', () => {
    const result = scaleBudgetSchema.safeParse({ campaign_id: VALID_UUID, new_daily_budget: 10001 })
    expect(result.success).toBe(false)
  })
})

// ── activateCampaignSchema ────────────────────────────────────────────────────
describe('activateCampaignSchema', () => {
  it('accepts activate action', () => {
    const result = activateCampaignSchema.safeParse({ campaign_id: VALID_UUID, action: 'activate' })
    expect(result.success).toBe(true)
  })

  it('accepts pause action', () => {
    const result = activateCampaignSchema.safeParse({ campaign_id: VALID_UUID, action: 'pause' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid action', () => {
    const result = activateCampaignSchema.safeParse({ campaign_id: VALID_UUID, action: 'delete' })
    expect(result.success).toBe(false)
  })

  it('rejects missing action', () => {
    const result = activateCampaignSchema.safeParse({ campaign_id: VALID_UUID })
    expect(result.success).toBe(false)
  })

  it('rejects missing campaign_id', () => {
    const result = activateCampaignSchema.safeParse({ action: 'activate' })
    expect(result.success).toBe(false)
  })
})

// ── emailSendSchema ───────────────────────────────────────────────────────────
describe('emailSendSchema', () => {
  it('accepts a single email recipient', () => {
    const result = emailSendSchema.safeParse({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    })
    expect(result.success).toBe(true)
  })

  it('accepts an array of email recipients', () => {
    const result = emailSendSchema.safeParse({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Hello',
      html: '<p>Hi</p>',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email in to field', () => {
    const result = emailSendSchema.safeParse({
      to: 'not-an-email',
      subject: 'Hello',
      html: '<p>Hi</p>',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty subject', () => {
    const result = emailSendSchema.safeParse({
      to: 'user@example.com',
      subject: '',
      html: '<p>Hi</p>',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty html', () => {
    const result = emailSendSchema.safeParse({
      to: 'user@example.com',
      subject: 'Hello',
      html: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects subject over 500 chars', () => {
    const result = emailSendSchema.safeParse({
      to: 'user@example.com',
      subject: 'x'.repeat(501),
      html: '<p>Hi</p>',
    })
    expect(result.success).toBe(false)
  })

  it('rejects html over 100000 chars', () => {
    const result = emailSendSchema.safeParse({
      to: 'user@example.com',
      subject: 'Hello',
      html: 'x'.repeat(100001),
    })
    expect(result.success).toBe(false)
  })
})

// ── actionsTrackSchema ────────────────────────────────────────────────────────
describe('actionsTrackSchema', () => {
  it('accepts a minimal payload', () => {
    const result = actionsTrackSchema.safeParse({ action_id: 'btn-click' })
    expect(result.success).toBe(true)
  })

  it('accepts a full payload', () => {
    const result = actionsTrackSchema.safeParse({
      action_id: 'btn-click',
      action_label: 'Create campaign',
      target_url: '/dashboard/create',
      source: 'sidebar',
      context_metrics: { impressions: 100, clicks: 5 },
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty action_id', () => {
    const result = actionsTrackSchema.safeParse({ action_id: '' })
    expect(result.success).toBe(false)
  })

  it('rejects action_id over 200 chars', () => {
    const result = actionsTrackSchema.safeParse({ action_id: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('rejects context_metrics with non-number values', () => {
    const result = actionsTrackSchema.safeParse({
      action_id: 'click',
      context_metrics: { count: 'many' },
    })
    expect(result.success).toBe(false)
  })
})

// ── updateCreditsSchema ───────────────────────────────────────────────────────
describe('updateCreditsSchema', () => {
  it('accepts a valid userId', () => {
    const result = updateCreditsSchema.safeParse({ userId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it('accepts userId with credits_total', () => {
    const result = updateCreditsSchema.safeParse({ userId: VALID_UUID, credits_total: 500 })
    expect(result.success).toBe(true)
  })

  it('accepts userId with plan', () => {
    const result = updateCreditsSchema.safeParse({ userId: VALID_UUID, plan: 'pro' })
    expect(result.success).toBe(true)
  })

  it('accepts all valid plan values', () => {
    const plans = ['free', 'starter', 'pro', 'agency'] as const
    for (const plan of plans) {
      const result = updateCreditsSchema.safeParse({ userId: VALID_UUID, plan })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid plan', () => {
    const result = updateCreditsSchema.safeParse({ userId: VALID_UUID, plan: 'enterprise' })
    expect(result.success).toBe(false)
  })

  it('rejects negative credits_total', () => {
    const result = updateCreditsSchema.safeParse({ userId: VALID_UUID, credits_total: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts credits_total of 0 (boundary)', () => {
    const result = updateCreditsSchema.safeParse({ userId: VALID_UUID, credits_total: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID userId', () => {
    const result = updateCreditsSchema.safeParse({ userId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})

// ── validate helper ───────────────────────────────────────────────────────────
describe('validate helper', () => {
  it('returns data on success', () => {
    const result = validate(publishCampaignSchema, { campaign_id: VALID_UUID })
    expect(result.data).toEqual({ campaign_id: VALID_UUID })
    expect(result.error).toBeUndefined()
  })

  it('returns error string on failure', () => {
    const result = validate(publishCampaignSchema, { campaign_id: 'bad' })
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
    expect(result.data).toBeUndefined()
  })

  it('error message includes field path', () => {
    const result = validate(publishCampaignSchema, { campaign_id: 'bad' })
    expect(result.error).toContain('campaign_id')
  })

  it('error message joins multiple issues with comma', () => {
    const result = validate(activateCampaignSchema, {})
    // Both campaign_id and action are missing
    expect(result.error).toContain(',')
  })

  it('works with generateCopiesSchema valid data', () => {
    const result = validate(generateCopiesSchema, { product_description: 'My product' })
    expect(result.data).toBeDefined()
    expect(result.error).toBeUndefined()
  })

  it('works with emailSendSchema valid data', () => {
    const result = validate(emailSendSchema, {
      to: 'test@test.com',
      subject: 'Test',
      html: '<b>Hi</b>',
    })
    expect(result.data).toBeDefined()
    expect(result.error).toBeUndefined()
  })
})
