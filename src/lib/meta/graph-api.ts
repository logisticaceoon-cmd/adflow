// src/lib/meta/graph-api.ts
// Low-level Meta Graph API helpers: POST/GET wrappers and image upload utilities.
import { META_GRAPH_URL } from '@/lib/constants'

const GRAPH = META_GRAPH_URL

// ── Graph API helpers ────────────────────────────────────────────────────────

export async function graphPost(
  path: string,
  token: string,
  body: Record<string, unknown>,
): Promise<any> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (data.error) {
    console.error(`[publish-campaign] Meta API error on ${path}:`, JSON.stringify(data.error))
    const parts: string[] = []
    if (data.error.error_user_msg) parts.push(data.error.error_user_msg)
    else if (data.error.message) parts.push(data.error.message)
    if (data.error.error_subcode) parts.push(`(subcode: ${data.error.error_subcode})`)
    if (data.error.fbtrace_id) parts.push(`[trace: ${data.error.fbtrace_id}]`)
    throw new Error(parts.join(' ') || JSON.stringify(data.error))
  }
  return data
}

export async function graphGet(
  path: string,
  token: string,
): Promise<any> {
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

// ── Image upload helpers ─────────────────────────────────────────────────────

export function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname
    return parsed.hostname === supabaseHost || parsed.hostname.endsWith('.supabase.co')
  } catch { return false }
}

export async function uploadImageToMeta(
  adAccountId: string,
  token: string,
  imageUrl: string,
): Promise<string | null> {
  if (!isAllowedImageUrl(imageUrl)) {
    console.warn(`[publish-campaign] Blocked non-allowed image URL: ${imageUrl}`)
    return null
  }
  try {
    const res = await fetch(`${GRAPH}/${adAccountId}/adimages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl, access_token: token }),
    })
    const data = await res.json()
    if (data.error) {
      console.warn(`[publish-campaign] Image upload failed:`, data.error.message)
      return null
    }
    const images = data.images || {}
    const first = Object.values(images)[0] as any
    return first?.hash ?? null
  } catch (err: any) {
    console.warn(`[publish-campaign] Image upload exception:`, err.message)
    return null
  }
}
