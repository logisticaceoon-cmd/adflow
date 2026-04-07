// src/app/api/notifications/route.ts
// GET  → latest 20 notifications + unread count
// POST → { action: 'mark_read', ids: [...] } | { action: 'mark_all_read' }
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getNotifications, getUnreadCount, markAsRead, markAllAsRead,
} from '@/lib/notification-engine'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(user.id, 20),
    getUnreadCount(user.id),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  if (body?.action === 'mark_read') {
    const ids: string[] = Array.isArray(body.ids) ? body.ids : []
    await markAsRead(user.id, ids)
    return NextResponse.json({ ok: true, marked: ids.length })
  }

  if (body?.action === 'mark_all_read') {
    await markAllAsRead(user.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
