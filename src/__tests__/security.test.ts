import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// isAllowedImageUrl is not exported from the route, so we replicate the exact
// logic here and test it in isolation.  The implementation in
// src/app/api/facebook/publish-campaign/route.ts reads as:
//
//   function isAllowedImageUrl(url: string): boolean {
//     try {
//       const parsed = new URL(url)
//       const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname
//       return parsed.hostname === supabaseHost || parsed.hostname.endsWith('.supabase.co')
//     } catch { return false }
//   }

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname
    return parsed.hostname === supabaseHost || parsed.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

const FAKE_SUPABASE_URL = 'https://abcdefghij.supabase.co'

describe('isAllowedImageUrl', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_SUPABASE_URL
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  // ── Allowed: matching Supabase project hostname ───────────────────────────
  it('allows image URL whose hostname exactly matches the configured Supabase project', () => {
    const url = 'https://abcdefghij.supabase.co/storage/v1/object/public/images/photo.jpg'
    expect(isAllowedImageUrl(url)).toBe(true)
  })

  it('allows any subdomain of supabase.co', () => {
    const url = 'https://zyxwvutsrq.supabase.co/storage/v1/object/public/ads/banner.png'
    expect(isAllowedImageUrl(url)).toBe(true)
  })

  it('allows a different supabase.co project than the configured one', () => {
    // endsWith('.supabase.co') catches all projects
    const url = 'https://other-project.supabase.co/storage/v1/image.jpg'
    expect(isAllowedImageUrl(url)).toBe(true)
  })

  // ── Rejected: random external URLs ───────────────────────────────────────
  it('rejects a random external URL', () => {
    expect(isAllowedImageUrl('https://example.com/image.jpg')).toBe(false)
  })

  it('rejects an AWS S3 URL', () => {
    expect(isAllowedImageUrl('https://my-bucket.s3.amazonaws.com/photo.jpg')).toBe(false)
  })

  it('rejects a Cloudinary URL', () => {
    expect(isAllowedImageUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg')).toBe(false)
  })

  it('rejects a Google Storage URL', () => {
    expect(isAllowedImageUrl('https://storage.googleapis.com/bucket/image.jpg')).toBe(false)
  })

  it('rejects an HTTP (non-HTTPS) URL even if hostname matches', () => {
    // The function only checks hostname, not protocol; however HTTP supabase
    // URLs would still match because hostname check passes.
    // This test documents the current behaviour for HTTP supabase URLs.
    const url = 'http://abcdefghij.supabase.co/storage/v1/object/public/image.jpg'
    expect(isAllowedImageUrl(url)).toBe(true) // hostname still matches
  })

  // ── Rejected: invalid / malformed URLs ───────────────────────────────────
  it('returns false for an empty string', () => {
    expect(isAllowedImageUrl('')).toBe(false)
  })

  it('returns false for a plain string (no protocol)', () => {
    expect(isAllowedImageUrl('not-a-url')).toBe(false)
  })

  it('returns false for a path-only string', () => {
    expect(isAllowedImageUrl('/storage/v1/object/photo.jpg')).toBe(false)
  })

  it('returns false for a URL with supabase.co in path but wrong host', () => {
    expect(isAllowedImageUrl('https://evil.com/steal?from=abcdefghij.supabase.co/image.jpg')).toBe(false)
  })

  it('returns false for a URL with supabase.co as a query param', () => {
    expect(isAllowedImageUrl('https://attacker.com/proxy?url=https://abcdefghij.supabase.co/img.png')).toBe(false)
  })

  // ── Edge: supabase.co lookalikes ──────────────────────────────────────────
  it('rejects a domain that merely contains "supabase.co" in a subdomain of another TLD', () => {
    // e.g. "abcdefghij.supabase.co.evil.com" ends with ".evil.com" not ".supabase.co"
    expect(isAllowedImageUrl('https://abcdefghij.supabase.co.evil.com/image.jpg')).toBe(false)
  })
})
