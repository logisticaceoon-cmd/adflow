import { describe, it, expect, beforeEach } from 'vitest'

// ── checkRateLimit ────────────────────────────────────────────────────────────
// When Redis env vars are absent the module falls back to a no-op that always
// returns { success: true }.  We verify this behaviour without needing a real
// Redis connection.

describe('checkRateLimit (no Redis configured)', () => {
  beforeEach(() => {
    // Ensure Upstash env vars are NOT set
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('returns success:true for "default" tier when Redis is absent', async () => {
    // Import inside test so env vars are already cleared
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('user-123')
    expect(result.success).toBe(true)
  })

  it('returns success:true for "ai" tier', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('user-123', 'ai')
    expect(result.success).toBe(true)
  })

  it('returns success:true for "meta" tier', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('user-456', 'meta')
    expect(result.success).toBe(true)
  })

  it('returns success:true for "email" tier', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('user-789', 'email')
    expect(result.success).toBe(true)
  })

  it('returns success:true for "default" tier (explicit)', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('user-000', 'default')
    expect(result.success).toBe(true)
  })

  it('accepts any string as userId', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('some-arbitrary-user-id-42')
    expect(result.success).toBe(true)
  })
})

// ── RateLimitResult type surface ──────────────────────────────────────────────
describe('RateLimitResult type', () => {
  it('success result has success:true', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('user-1')
    expect(result).toHaveProperty('success', true)
    // When success is true there should be no retryAfter
    expect((result as { retryAfter?: number }).retryAfter).toBeUndefined()
  })
})

// ── Tier configuration accessibility ─────────────────────────────────────────
describe('rate-limit tier configs', () => {
  it('all 4 tiers are callable without throwing', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const tiers = ['ai', 'meta', 'email', 'default'] as const
    for (const tier of tiers) {
      await expect(checkRateLimit('test-user', tier)).resolves.toEqual({ success: true })
    }
  })
})
