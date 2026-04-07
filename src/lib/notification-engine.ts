// src/lib/notification-engine.ts
// Persistent notifications engine. All writes go through createNotification
// so a single failure never breaks the calling flow.
import { createAdminClient } from '@/lib/supabase/server'

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error'

export interface CreateNotificationInput {
  userId: string
  type: string
  title: string
  body?: string
  severity?: NotificationSeverity
  actionUrl?: string
  metadata?: Record<string, unknown>
}

export interface NotificationRow {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  severity: NotificationSeverity
  is_read: boolean
  action_url: string | null
  metadata: Record<string, unknown>
  created_at: string
}

/**
 * Creates a persistent notification. Wrapped in try/catch internally —
 * callers should still wrap their call to be extra safe.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    const db = createAdminClient()
    const { error } = await db.from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body || null,
      severity: input.severity || 'info',
      action_url: input.actionUrl || null,
      metadata: input.metadata || {},
    })
    if (error) console.warn('[notifications] Failed to create:', error.message)
  } catch (err: any) {
    console.warn('[notifications] Exception creating notification:', err?.message || err)
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const db = createAdminClient()
  const { count } = await db
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  return count || 0
}

export async function getNotifications(userId: string, limit: number = 20): Promise<NotificationRow[]> {
  const db = createAdminClient()
  const { data } = await db
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data || []) as NotificationRow[]
}

export async function markAsRead(userId: string, notificationIds: string[]): Promise<void> {
  if (!notificationIds.length) return
  const db = createAdminClient()
  await db
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .in('id', notificationIds)
}

export async function markAllAsRead(userId: string): Promise<void> {
  const db = createAdminClient()
  await db
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
}
