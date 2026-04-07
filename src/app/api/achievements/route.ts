// src/app/api/achievements/route.ts
// GET  → list of all achievements (locked + unlocked) for current user
// POST → { action: 'mark_notified', achievement_ids: string[] }
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserAchievements, markAchievementsNotified } from '@/lib/achievement-engine'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const achievements = await getUserAchievements(user.id)
  const unlocked = achievements.filter(a => a.unlocked)
  const newUnlocks = unlocked.filter(a => !a.notified)

  return NextResponse.json({
    achievements,
    unlockedCount: unlocked.length,
    totalCount: achievements.length,
    newUnlocks,
  })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (body?.action === 'mark_notified') {
    const ids: string[] = Array.isArray(body.achievement_ids) ? body.achievement_ids : []
    await markAchievementsNotified(user.id, ids)
    return NextResponse.json({ ok: true, marked: ids.length })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
