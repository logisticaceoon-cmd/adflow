// src/app/api/onboarding/status/route.ts
// GET → current user onboarding progress
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateOnboardingStatus } from '@/lib/onboarding-engine'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [fbRes, bizRes, pixelRes, budgetRes, countRes] = await Promise.all([
    supabase.from('facebook_connections').select('access_token').eq('user_id', user.id).maybeSingle(),
    supabase.from('business_profiles').select('selected_ad_account_id, pixel_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('pixel_analysis').select('level').eq('user_id', user.id).maybeSingle(),
    supabase.from('monthly_budgets').select('id').eq('user_id', user.id).limit(1),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const status = calculateOnboardingStatus({
    hasFbConnection: !!fbRes.data?.access_token,
    hasAdAccount: !!bizRes.data?.selected_ad_account_id,
    hasPixel: !!bizRes.data?.pixel_id,
    pixelLevel: pixelRes.data?.level ?? null,
    hasBudget: (budgetRes.data?.length || 0) > 0,
    campaignCount: countRes.count || 0,
  })

  return NextResponse.json(status)
}
