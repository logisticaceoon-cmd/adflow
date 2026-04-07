// src/app/api/facebook/duplicate-campaign/route.ts
// Creates a copy of an existing campaign as a draft (no Meta publish).
// The user can then edit it and publish from the detail page.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { campaign_id } = body || {}
  if (!campaign_id) {
    return NextResponse.json({ error: 'campaign_id requerido' }, { status: 400 })
  }

  const { data: original, error: findErr } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaign_id)
    .eq('user_id', user.id)
    .single()

  if (findErr || !original) {
    return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  }

  // Build the new row: copy everything relevant, reset Meta IDs and metrics.
  const newName = `${original.name} (copia)`
  const { data: copy, error: insertErr } = await supabase
    .from('campaigns')
    .insert({
      user_id:               user.id,
      name:                  newName,
      objective:             original.objective,
      daily_budget:          original.daily_budget,
      product_description:   original.product_description,
      target_audience:       original.target_audience,
      status:                'draft',
      ai_copies:             original.ai_copies,
      target_country:        original.target_country,
      target_age_min:        original.target_age_min,
      target_age_max:        original.target_age_max,
      target_gender:         original.target_gender,
      target_interests:      original.target_interests,
      recommended_placement: original.recommended_placement,
      recommended_schedule:  original.recommended_schedule,
      strategy_type:         original.strategy_type,
      campaign_structure:    original.campaign_structure,
      estimated_results:     original.estimated_results,
      destination_url:       original.destination_url,
      whatsapp_number:       original.whatsapp_number,
      creative_urls:         original.creative_urls,
      // Reset Meta-side data
      meta_campaign_id:      null,
      meta_adset_ids:        null,
      meta_ad_ids:           null,
      meta_creative_ids:     null,
      meta_status:           null,
      metrics:               null,
    })
    .select()
    .single()

  if (insertErr || !copy) {
    return NextResponse.json({ error: `Error al duplicar: ${insertErr?.message || 'Unknown'}` }, { status: 500 })
  }

  // Log action
  await supabase.from('campaign_actions').insert({
    user_id: user.id,
    campaign_id,
    meta_campaign_id: original.meta_campaign_id,
    action_type: 'duplicate',
    status: 'success',
    new_value: { new_campaign_id: copy.id, new_name: newName },
  })

  return NextResponse.json({
    success: true,
    new_campaign_id: copy.id,
    new_campaign_name: newName,
  })
}
