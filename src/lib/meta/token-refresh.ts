// src/lib/meta/token-refresh.ts
// Attempts to refresh Meta long-lived tokens before they expire.
//
// Meta long-lived tokens last 60 days. They can be refreshed by exchanging
// a still-valid long-lived token for a new one — but ONLY if the current
// token hasn't expired yet. After expiry, the user must re-authenticate.
//
// Strategy: the daily cron calls refreshExpiringTokens(). For each user
// whose token expires in ≤10 days, we attempt an exchange. If it works,
// we update the DB. If it fails (token already expired or revoked), we
// create a notification so the user knows they need to reconnect.

import { createAdminClient } from '@/lib/supabase/server'
import { encryptSecret, decryptSecret } from '@/lib/security/crypto'
import { createNotification } from '@/lib/notification-engine'

const DAYS_BEFORE_EXPIRY_TO_REFRESH = 10

interface RefreshResult {
  userId: string
  status: 'refreshed' | 'failed' | 'expired' | 'skipped'
  message: string
}

/**
 * Refresh a single Meta token by exchanging the current long-lived token
 * for a new one via the Graph API.
 */
async function refreshToken(currentToken: string): Promise<{ token: string; expiresIn: number } | null> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) return null

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&client_id=${appId}&` +
      `client_secret=${appSecret}&fb_exchange_token=${currentToken}`
    )
    const data = await res.json()

    if (data.error) {
      console.warn('[token-refresh] Meta API error:', data.error.message)
      return null
    }

    if (data.access_token) {
      return {
        token: data.access_token,
        expiresIn: data.expires_in || 5184000, // default 60 days
      }
    }

    return null
  } catch (err: any) {
    console.error('[token-refresh] Network error:', err.message)
    return null
  }
}

/**
 * Check all users with tokens expiring soon and attempt to refresh them.
 * Called by the daily cron job.
 */
export async function refreshExpiringTokens(): Promise<RefreshResult[]> {
  const db = createAdminClient()
  const results: RefreshResult[] = []

  // Find connections expiring within the threshold
  const cutoffDate = new Date(Date.now() + DAYS_BEFORE_EXPIRY_TO_REFRESH * 86400000).toISOString()

  const { data: expiringConnections } = await db
    .from('facebook_connections')
    .select('user_id, access_token, token_expires_at')
    .not('access_token', 'is', null)
    .not('token_expires_at', 'is', null)
    .lte('token_expires_at', cutoffDate)

  if (!expiringConnections?.length) {
    return [{ userId: 'none', status: 'skipped', message: 'No tokens expiring soon' }]
  }

  for (const conn of expiringConnections) {
    const userId = conn.user_id
    const expiresAt = new Date(conn.token_expires_at)
    const daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / 86400000)

    // If already expired, we can't refresh — notify user
    if (daysLeft < 0) {
      await createNotification({
        userId,
        type: 'token_expired',
        title: '🔴 Tu conexión con Meta expiró',
        body: 'Reconectá tu cuenta de Facebook en Configuración para seguir operando campañas.',
        severity: 'error',
        actionUrl: '/dashboard/settings',
      })
      results.push({ userId, status: 'expired', message: `Token expired ${Math.abs(daysLeft)} days ago` })
      continue
    }

    // Try to decrypt and refresh
    try {
      const decryptedToken = decryptSecret(conn.access_token)
      const refreshResult = await refreshToken(decryptedToken)

      if (refreshResult) {
        // Save new token
        const newExpiresAt = new Date(Date.now() + refreshResult.expiresIn * 1000).toISOString()
        await db
          .from('facebook_connections')
          .update({
            access_token: encryptSecret(refreshResult.token),
            token_expires_at: newExpiresAt,
          })
          .eq('user_id', userId)

        await createNotification({
          userId,
          type: 'token_refreshed',
          title: '✅ Token de Meta renovado automáticamente',
          body: `Tu conexión se extendió hasta ${new Date(newExpiresAt).toLocaleDateString('es-AR')}.`,
          severity: 'info',
          actionUrl: '/dashboard/settings',
        })

        results.push({ userId, status: 'refreshed', message: `New expiry: ${newExpiresAt}` })
      } else {
        // Refresh failed — notify user to reconnect
        await createNotification({
          userId,
          type: 'token_refresh_failed',
          title: `⚠️ Tu conexión con Meta expira en ${daysLeft} días`,
          body: 'No pudimos renovar el token automáticamente. Reconectá tu cuenta en Configuración.',
          severity: 'warning',
          actionUrl: '/dashboard/settings',
        })
        results.push({ userId, status: 'failed', message: `Refresh failed, ${daysLeft} days left` })
      }
    } catch (err: any) {
      console.error(`[token-refresh] Error for user ${userId}:`, err.message)
      results.push({ userId, status: 'failed', message: err.message })
    }
  }

  return results
}
