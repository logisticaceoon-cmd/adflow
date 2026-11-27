'use client'
// src/hooks/useCampaignWizard.ts — Simplified wizard: minimum input, AI does the rest
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AIStrategy, AdCopyItem, CampaignObjective } from '@/types'
import { compressImageFile, CURRENCY_SYMBOLS, APPROX_RATES } from '@/components/campaign/shared'

export type UserGoal = 'sales' | 'leads' | 'traffic'

export interface WizardState {
  // Step 0: Business (skip if already in business_profiles)
  product_description: string
  website_url: string
  goal: UserGoal | ''
  // Step 1: Budget
  daily_budget: number
  duration: 7 | 14 | 30 | 0   // 0 = continuous
  // Media
  mediaFiles: File[]
  mediaPreviews: Array<string | null>
}

export function useCampaignWizard() {
  const router = useRouter()

  // ── Step & UI ─────────────────────────────────────────────────────────────
  const [step,  setStep]  = useState(0)
  const [error, setError] = useState('')

  // ── Business profile preload ──────────────────────────────────────────────
  const [hasBusinessProfile, setHasBusinessProfile] = useState<boolean | null>(null) // null = loading
  const [businessName, setBusinessName] = useState('')

  // ── Loading states ────────────────────────────────────────────────────────
  const [genLoading,    setGenLoading]    = useState(false)
  const [genStep,       setGenStep]       = useState(-1)
  const [savingDraft,   setSavingDraft]   = useState(false)
  const [isPublishing,  setIsPublishing]  = useState(false)
  const [publishError,  setPublishError]  = useState('')
  const [noCreditsModal, setNoCreditsModal] = useState(false)

  // ── Campaign result ───────────────────────────────────────────────────────
  const [aiStrategy,      setAiStrategy]      = useState<AIStrategy | null>(null)
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null)
  const [metaCampaignId,  setMetaCampaignId]  = useState('')
  const [publishedOk,     setPublishedOk]     = useState(false)

  // ── Inline copy edits (Step 4) ────────────────────────────────────────────
  const [editedCopies, setEditedCopies] = useState<Record<string, Partial<AdCopyItem>>>({})

  // ── Currency + profile data ───────────────────────────────────────────────
  const [currency, setCurrency] = useState('USD')
  const [pixelLevel, setPixelLevel] = useState(0)
  const [pixelAnalysis, setPixelAnalysis] = useState<any>(null)

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState<WizardState>({
    product_description: '',
    website_url: '',
    goal: '',
    daily_budget: 15,
    duration: 14,
    mediaFiles: [],
    mediaPreviews: [],
  })

  // ── Image data for AI ─────────────────────────────────────────────────────
  const [imageBase64s,    setImageBase64s]    = useState<string[]>([])
  const [imageMediaTypes, setImageMediaTypes] = useState<string[]>([])

  // ── Derived ───────────────────────────────────────────────────────────────
  const currSymbol = CURRENCY_SYMBOLS[currency] || '$'
  const approxRate = APPROX_RATES[currency] || 1
  const budgetUSD  = currency !== 'USD'
    ? `≈ $${(form.daily_budget / approxRate).toFixed(2)} USD`
    : null

  // ── Load business profile + pixel on mount ────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: biz } = await supabase
          .from('business_profiles')
          .select('business_name, website_url, currency, default_daily_budget, country, whatsapp_number, pixel_id, industry, communication_tone')
          .eq('user_id', user.id)
          .maybeSingle()

        if (biz?.business_name && biz?.website_url) {
          setHasBusinessProfile(true)
          setBusinessName(biz.business_name)
          // Pre-fill from profile — default goal to 'sales' since step 0 is skipped
          setForm(prev => ({
            ...prev,
            product_description: biz.business_name || '',
            website_url: biz.website_url || '',
            goal: prev.goal || 'sales',
            daily_budget: biz.default_daily_budget || prev.daily_budget,
          }))
        } else {
          setHasBusinessProfile(false)
        }

        if (biz?.currency) setCurrency(biz.currency)

        // Pixel analysis
        if (biz?.pixel_id) {
          try {
            const pixelRes  = await fetch('/api/pixel/analyze')
            const pixelJson = await pixelRes.json()
            if (pixelJson?.analysis) {
              setPixelLevel(pixelJson.analysis.level || 0)
              setPixelAnalysis(pixelJson.analysis)
            }
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }
    load()
  }, [])

  // ── Media processing ──────────────────────────────────────────────────────
  const processFiles = useCallback(async (files: File[]) => {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime']
    const valid = files.filter(f => allowed.includes(f.type))
    if (!valid.length) return

    const combined = [...form.mediaFiles, ...valid].slice(0, 10)
    const newPreviews = [...form.mediaPreviews]

    setForm(prev => ({ ...prev, mediaFiles: combined }))

    for (let idx = 0; idx < combined.length; idx++) {
      const file = combined[idx]
      if (file.type.startsWith('video/')) {
        newPreviews[idx] = null
      } else {
        newPreviews[idx] = URL.createObjectURL(file)
        try {
          let { base64, mediaType } = await compressImageFile(file)
          if (mediaType === 'image/jpg') mediaType = 'image/jpeg'
          if (['image/jpeg','image/png','image/gif','image/webp'].includes(mediaType)) {
            setImageBase64s(prev    => { const n = [...prev]; n[idx] = base64;    return n })
            setImageMediaTypes(prev => { const n = [...prev]; n[idx] = mediaType; return n })
          }
        } catch { /* ignore */ }
      }
    }

    setForm(prev => ({ ...prev, mediaPreviews: newPreviews }))
  }, [form.mediaFiles, form.mediaPreviews])

  function removeMedia(idx: number) {
    if (form.mediaPreviews[idx]) URL.revokeObjectURL(form.mediaPreviews[idx]!)
    setForm(prev => ({
      ...prev,
      mediaFiles:    prev.mediaFiles.filter((_, i) => i !== idx),
      mediaPreviews: prev.mediaPreviews.filter((_, i) => i !== idx),
    }))
    setImageBase64s(prev    => prev.filter((_, i) => i !== idx))
    setImageMediaTypes(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Step navigation ───────────────────────────────────────────────────────
  function nextFromBusiness() {
    if (!form.product_description.trim()) { setError('Contanos qué vendés o qué hace tu negocio.'); return }
    if (!form.goal) { setError('Elegí un objetivo para tu campaña.'); return }
    setError(''); setStep(1)
  }

  function nextFromBudget() {
    if (!form.daily_budget || form.daily_budget < 1) { setError('Ingresá un presupuesto diario válido.'); return }
    setError(''); setStep(2)
  }

  function nextFromMedia() {
    setError(''); generateWithAI()
  }

  // ── Copy edits helpers ────────────────────────────────────────────────────
  function patchAd(setIdx: number, adIdx: number, field: keyof AdCopyItem, value: string) {
    setEditedCopies(prev => {
      const key = `${setIdx}-${adIdx}`
      return { ...prev, [key]: { ...(prev[key] || {}), [field]: value } }
    })
  }

  function applyEditsToStrategy(): AIStrategy {
    if (!aiStrategy) return aiStrategy!
    const s = JSON.parse(JSON.stringify(aiStrategy))
    s.campaign?.ad_sets?.forEach((adSet: any, si: number) => {
      adSet.ads?.forEach((ad: any, ai: number) => {
        Object.assign(ad, editedCopies[`${si}-${ai}`] || {})
      })
    })
    return s
  }

  // ── Map goal to AI fields ─────────────────────────────────────────────────
  function goalToFields(goal: UserGoal | '') {
    const map: Record<UserGoal, { mainObjective: string; businessType: string; advertisingStatus: string }> = {
      sales:   { mainObjective: 'sales',     businessType: 'ecommerce',   advertisingStatus: 'improving' },
      leads:   { mainObjective: 'leads',     businessType: 'b2b',         advertisingStatus: 'improving' },
      traffic: { mainObjective: 'awareness', businessType: 'infoproduct', advertisingStatus: 'first_time' },
    }
    // Default to 'sales' if goal not set (e.g. business profile pre-filled, step 0 skipped)
    return map[goal as UserGoal] || map.sales
  }

  // ── Generate with AI ──────────────────────────────────────────────────────
  async function generateWithAI() {
    setError(''); setGenLoading(true); setStep(3); setGenStep(0)
    const t1 = setTimeout(() => setGenStep(1), 3000)
    const t2 = setTimeout(() => setGenStep(2), 7000)
    const t3 = setTimeout(() => setGenStep(3), 12000)

    try {
      const goalFields = goalToFields(form.goal as UserGoal)
      const validBase64s  = imageBase64s.filter(Boolean)
      const validMedTypes = imageMediaTypes.filter(Boolean)
      const firstVideoName = form.mediaFiles.find(f => f.type.startsWith('video/'))?.name

      // Load business profile data for AI context
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      let bizData: any = null
      if (user) {
        const { data } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        bizData = data
      }

      const res = await fetch('/api/ai/generate-copies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_description: form.product_description,
          daily_budget:        form.daily_budget,
          target_country:      bizData?.country || 'Argentina',
          currency:            currency,
          destination_url:     form.website_url || bizData?.website_url || undefined,
          whatsapp_number:     bizData?.whatsapp_number || undefined,
          // AI-inferred fields from goal
          main_objective:      goalFields.mainObjective,
          business_type:       bizData?.industry || goalFields.businessType,
          advertising_status:  goalFields.advertisingStatus,
          // Media
          image_base64s:       validBase64s.length  ? validBase64s  : undefined,
          image_media_types:   validMedTypes.length ? validMedTypes : undefined,
          video_name:          firstVideoName,
          // Pixel data
          pixel_level:         pixelLevel,
          pixel_data:          pixelAnalysis ? {
            level:                  pixelAnalysis.level,
            levelName:              pixelAnalysis.levelName,
            canRetargetViewContent: pixelAnalysis.canRetargetViewContent,
            canRetargetAddToCart:   pixelAnalysis.canRetargetAddToCart,
            canRetargetPurchase:    pixelAnalysis.canRetargetPurchase,
            canCreateLookalike:     pixelAnalysis.canCreateLookalike,
            events:                 pixelAnalysis.events,
          } : null,
        }),
      })
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)

      const rawText = await res.text()
      let data: any
      try {
        data = JSON.parse(rawText)
      } catch {
        const preview = rawText.slice(0, 120).replace(/\n/g, ' ')
        throw new Error(res.status === 413
          ? 'Las imágenes son demasiado grandes. Reducí el tamaño o usá menos imágenes.'
          : `Error del servidor (${res.status}): ${preview}`)
      }

      if (!res.ok && data?.code === 'NO_CREDITS') {
        setNoCreditsModal(true)
        setGenLoading(false); setStep(2); setGenStep(-1)
        return
      }

      if (!res.ok) throw new Error(data?.error || `Error ${res.status} al generar la estrategia`)

      setGenStep(4)
      setTimeout(() => {
        setAiStrategy(data.copies)
        setEditedCopies({})
        setGenStep(-1); setGenLoading(false); setStep(4)
        router.refresh()
        if (data.credits_remaining === 0) setNoCreditsModal(true)
      }, 800)
    } catch (err: any) {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
      setError(err.message || 'Error desconocido al conectar con la IA')
      setGenLoading(false); setStep(2); setGenStep(-1)
    }
  }

  // ── Save campaign to DB ───────────────────────────────────────────────────
  async function saveCampaignToDB(): Promise<string | null> {
    if (!aiStrategy) return null
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sesión expirada.'); return null }

    const effective     = applyEditsToStrategy()
    const campaignName  = effective.campaign?.name || form.product_description.slice(0, 50)
    const metaObjective = (effective.campaign?.objective || 'OUTCOME_AWARENESS') as CampaignObjective
    const targeting     = effective.targeting

    const { data: campaign, error: err } = await supabase
      .from('campaigns')
      .insert({
        user_id:               user.id,
        name:                  campaignName,
        objective:             metaObjective,
        daily_budget:          form.daily_budget,
        product_description:   form.product_description,
        status:                'draft',
        ai_copies:             effective,
        target_country:        targeting?.geo || 'AR',
        target_age_min:        targeting?.age_min || null,
        target_age_max:        targeting?.age_max || null,
        target_gender:         targeting?.gender  || null,
        target_interests:      targeting?.interests || null,
        recommended_placement: effective.recommended_placements?.join(', ') || null,
        recommended_schedule:  effective.recommended_schedule || null,
        strategy_type:         effective.strategy_type || 'TOFU',
        campaign_structure:    effective.campaign || null,
        estimated_results:     effective.estimated_results || null,
        destination_url:       form.website_url || null,
      })
      .select().single()

    if (err || !campaign) {
      setError(`Error al guardar: ${err?.message || 'Intentá de nuevo.'}`); return null
    }

    // Upload creatives
    for (const file of form.mediaFiles) {
      const ext  = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${campaign.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('campaign-creatives').upload(path, file, { upsert: false, contentType: file.type })
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('campaign-creatives').getPublicUrl(path)
        const { data: existing } = await supabase.from('campaigns').select('creative_urls').eq('id', campaign.id).single()
        const urls = [...((existing?.creative_urls as string[]) || []), publicUrl]
        await supabase.from('campaigns').update({ creative_urls: urls }).eq('id', campaign.id)
      }
    }

    // Also save business info if user filled it in Step 0
    if (!hasBusinessProfile && form.product_description) {
      await supabase.from('business_profiles').upsert({
        user_id: user.id,
        business_name: form.product_description,
        website_url: form.website_url,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    }

    setSavedCampaignId(campaign.id)
    return campaign.id
  }

  async function handleSaveDraft() {
    setSavingDraft(true); setError('')
    const id = await saveCampaignToDB()
    setSavingDraft(false)
    if (id) setStep(5)
  }

  async function handlePublishToMeta() {
    setIsPublishing(true); setPublishError('')
    try {
      const campaignId = savedCampaignId || await saveCampaignToDB()
      if (!campaignId) { setIsPublishing(false); return }

      const res = await fetch('/api/facebook/publish-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setPublishError(data.error || 'Error al publicar en Meta Ads')
        setIsPublishing(false); return
      }

      setMetaCampaignId(data.meta_campaign_id || '')
      setPublishedOk(true)
      setStep(5)
    } catch (err: any) {
      setPublishError(err.message || 'Error de conexión')
    } finally {
      setIsPublishing(false)
    }
  }

  function resetWizard() {
    setStep(hasBusinessProfile ? 1 : 0)
    setAiStrategy(null); setSavedCampaignId(null)
    setPublishedOk(false); setMetaCampaignId(''); setPublishError(''); setError('')
    setEditedCopies({})
    setForm(prev => ({
      ...prev,
      mediaFiles: [],
      mediaPreviews: [],
    }))
    setImageBase64s([]); setImageMediaTypes([])
  }

  // ── Set field helper ──────────────────────────────────────────────────────
  function setField<K extends keyof WizardState>(field: K, value: WizardState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // ── Auto-skip Step 0 if business profile exists ───────────────────────────
  const effectiveStep = (hasBusinessProfile && step === 0) ? 1 : step

  return {
    step: effectiveStep, setStep,
    error, setError,
    hasBusinessProfile, businessName,
    genLoading, genStep,
    savingDraft, isPublishing, publishError,
    noCreditsModal, setNoCreditsModal,
    aiStrategy, savedCampaignId, metaCampaignId, publishedOk,
    currency, currSymbol, budgetUSD, pixelLevel,
    form, setField,
    editedCopies,
    processFiles, removeMedia,
    nextFromBusiness, nextFromBudget, nextFromMedia,
    patchAd,
    generateWithAI, handleSaveDraft, handlePublishToMeta,
    resetWizard, router,
  }
}
