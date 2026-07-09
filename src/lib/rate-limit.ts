// src/lib/rate-limit.ts
// Per-user rate limiting using Upstash Redis.
// Falls back to no-op if UPSTASH_REDIS_REST_URL is not configured.
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let redis: Redis | null = null
function getRedis(): Redis | null {
  if (redis) return redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return redis
}

// Pre-built limiters for different endpoint tiers
const limiters: Record<string, Ratelimit> = {}

function getLimiter(name: string, requests: number, window: string): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  if (!limiters[name]) {
    limiters[name] = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(requests, window as `${number} ${'s' | 'ms' | 'm' | 'h' | 'd'}`),
      prefix: `rl:${name}`,
    })
  }
  return limiters[name]
}

export type RateLimitResult = { success: true } | { success: false; retryAfter: number }

export async function checkRateLimit(
  userId: string,
  tier: 'ai' | 'meta' | 'email' | 'default' = 'default',
): Promise<RateLimitResult> {
  const configs: Record<string, [number, string]> = {
    ai:      [10, '1 m'],     // 10 AI generations per minute
    meta:    [20, '1 m'],     // 20 Meta API calls per minute
    email:   [5, '1 h'],      // 5 emails per hour
    default: [60, '1 m'],     // 60 requests per minute general
  }
  const [requests, window] = configs[tier]
  const limiter = getLimiter(tier, requests, window)

  // No Redis configured — allow all (development mode)
  if (!limiter) return { success: true }

  const result = await limiter.limit(userId)
  if (result.success) return { success: true }
  return { success: false, retryAfter: Math.ceil((result.reset - Date.now()) / 1000) }
}
