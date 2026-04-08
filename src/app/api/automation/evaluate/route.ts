// src/app/api/automation/evaluate/route.ts
// Manual trigger — evaluates all automation rules for the current user now.
// Handy for testing and for a future "Run automations" button.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluateAutomationRules } from '@/lib/automation-engine'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const result = await evaluateAutomationRules(user.id)
  return NextResponse.json({ result })
}
