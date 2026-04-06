'use client'
// src/app/dashboard/create/page.tsx — Orchestrator (state + routing between steps)
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AIStrategy, AdCopyItem, CampaignObjective, CreateCampaignForm, StrategyType } from '@/types'
import {
  DiagnosisData, defaultDiagnosis,
  inferStrategyFromDiagnosis, isValidUrl, compressImageFile,
  CURRENCY_SYMBOLS, APPROX_RATES,
} from '@/components/campaign/shared'
import StepEssential  from '@/components/campaign/StepEssential'
import StepDiagnosis  from '@/components/campaign/StepDiagnosis'
import StepStrategy   from '@/components/campaign/StepStrategy'
import StepContent    from '@/components/campaign/StepContent'
import StepReview     from '@/components/campaign/StepReview'

const STEPS = ['Esencial', 'Diagnóstico', 'Estrategia', 'Contenido', 'Revisión IA', '¡Listo!']

export default function CreateCampaignPage() {
  const router = useRouter()

  // ── Step & UI state ───────────────────────────────────────────────────────
  const [step,    setStep]    = useState(0)
  const [error,   setError]   = useState('')

  // ── Loading states ────────────────────────────────────────────────────────
  const [genLoading,    setGenLoading]    = useState(false)
  const [genStep,       setGenStep]       = useState(-1)
  const [savingDraft,   setSavingDraft]   = useState(false)
  const [isPublishing,   setIsPublishing]   = useState(false)
  const [publishError,   setPublishError]   = useState('')
  const [noCreditsModal, setNoCreditsModal] = useState(false)

  // ── Campaign & publish state ──────────────────────────────────────────────
  const [aiStrategy,       setAiStrategy]       = useState<AIStrategy | null>(null)
  const [savedCampaignId,  setSavedCampaignId]  = useState<string | null>(null)
  const [metaCampaignId,   setMetaCampaignId]   = useState('')
  const [publishedOk,      setPublishedOk]      = useState(false)

  // ── Diagnosis ─────────────────────────────────────────────────────────────
  const [recommended, setRecommended] = useState<StrategyType>('TOFU')
  const [diagnosis,   setDiagnosis]   = useState<DiagnosisData>(defaultDiagnosis)

  // ── Currency + pixel (loaded from business profile) ──────────────────────
  const [currency,  setCurrency]  = useState('USD')
  const [pageName,  setPageName]  = useState('Tu Página')
  const [pixelId,   setPixelId]   = useState<string | null>(null)

  // ── Pixel level + capabilities (loaded from /api/pixel/analyze) ──────────
  const [pixelLevel,          setPixelLevel]          = useState(0)
  const [pixelLevelName,      setPixelLevelName]      = useState('Sin Data')
  const [availableStrategies, setAvailableStrategies] = useState<string[]>(['TOFU'])
  const [pixelAnalysis,       setPixelAnalysis]       = useState<any>(null)

  // ── Media ─────────────────────────────────────────────────────────────────
  const [mediaFiles,       setMediaFiles]       = useState<File[]>([])
  const [mediaPreviews,    setMediaPreviews]    = useState<Array<string | null>>([])
  const [imageBase64s,     setImageBase64s]     = useState<string[]>([])
  const [imageMediaTypes,  setImageMediaTypes]  = useState<string[]>([])

  // ── Inline copy edits (Step 4) ────────────────────────────────────────────
  const [editedCopies, setEditedCopies] = useState<Record<string, Partial<AdCopyItem>>>({})

  // ── Form ──────────────────────────────────────────────────────────────────
  const [form, setFormState] = useState<CreateCampaignForm>({
    product_description: '', strategy_type: 'TOFU',
    daily_budget: 10, target_country: '',
    existing_copy: '', target_audience: '',
    destination_url: '', whatsapp_number: '',
  })

  function setField<K extends keyof CreateCampaignForm>(field: K, value: CreateCampaignForm[K]) {
    setFormState(prev => ({ ...prev, [field]: value }))
  }
  function setDiagField<K extends keyof DiagnosisData>(field: K, value: string) {
    setDiagnosis(prev => ({ ...prev, [field]: value }))
  }

  // ── Load currency + defaults from business profile ────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: biz } = await supabase
          .from('business_profiles')
          .select('currency, fb_page_name, default_daily_budget, country, website_url, whatsapp_number, pixel_id')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!biz) return
        if (biz.currency)     setCurrency(biz.currency)
        if (biz.fb_page_name) setPageName(biz.fb_page_name)
        if (biz.pixel_id)     setPixelId(biz.pixel_id)
        setFormState(prev => ({
          ...prev,
          daily_budget:    biz.default_daily_budget || prev.daily_budget,
          target_country:  prev.target_country || biz.country || '',
          destination_url: prev.destination_url || biz.website_url || '',
          whatsapp_number: prev.whatsapp_number || biz.whatsapp_number || '',
        }))

        // Analyze pixel to determine the user's level + which strategies are available
        if (biz.pixel_id) {
          try {
            const pixelRes  = await fetch('/api/pixel/analyze')
            const pixelJson = await pixelRes.json()
            const a = pixelJson?.analysis
            if (a && typeof a.level === 'number') {
              setPixelLevel(a.level)
              setPixelLevelName(a.levelName || 'Sin Data')
              setAvailableStrategies(a.availableStrategies?.length ? a.availableStrategies : ['TOFU'])
              setPixelAnalysis(a)
            }
          } catch { /* default: nivel 0 = solo TOFU */ }
        }
      } catch { /* ignore */ }
    }
    load()
  }, [])

  const currSymbol = CURRENCY_SYMBOLS[currency] || '$'
  const approxRate = APPROX_RATES[currency] || 1
  const budgetUSD  = currency !== 'USD'
    ? `≈ $${(form.daily_budget / approxRate).toFixed(2)} USD`
    : null

  // ── Media processing ──────────────────────────────────────────────────────
  const processFiles = useCallback(async (files: File[]) => {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime']
    const valid = files.filter(f => allowed.includes(f.type))
    if (!valid.length) return

    const combined = [...mediaFiles, ...valid].slice(0, 10)
    setMediaFiles(combined)

    for (let idx = 0; idx < combined.length; idx++) {
      const file = combined[idx]
      if (file.type.startsWith('video/')) {
        setMediaPreviews(prev => { const n = [...prev]; n[idx] = null; return n })
      } else {
        const previewUrl = URL.createObjectURL(file)
        setMediaPreviews(prev => { const n = [...prev]; n[idx] = previewUrl; return n })
        try {
          let base64: string, mediaType: string
          // Siempre comprimir: base64 raw de una imagen de 1.5MB pesa ~2MB;
          // con múltiples imágenes se supera el límite de 4.5MB de Vercel.
          const c = await compressImageFile(file)
          base64 = c.base64; mediaType = c.mediaType
          if (mediaType === 'image/jpg') mediaType = 'image/jpeg'
          if (['image/jpeg','image/png','image/gif','image/webp'].includes(mediaType)) {
            setImageBase64s(prev    => { const n = [...prev]; n[idx] = base64;     return n })
            setImageMediaTypes(prev => { const n = [...prev]; n[idx] = mediaType;  return n })
          }
        } catch (e) {
          console.error('Error processing image at idx', idx, e)
        }
      }
    }
  }, [mediaFiles, mediaPreviews])

  function removeMedia(idx: number) {
    setMediaFiles(prev      => prev.filter((_, i) => i !== idx))
    setMediaPreviews(prev   => prev.filter((_, i) => i !== idx))
    setImageBase64s(prev    => prev.filter((_, i) => i !== idx))
    setImageMediaTypes(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Step navigation ───────────────────────────────────────────────────────
  function goStep0to1() {
    if (!form.product_description.trim()) { setError('Describí qué vendés.'); return }
    if (!form.target_country.trim())      { setError('Indicá el país o ciudad objetivo.'); return }
    if (!form.daily_budget || form.daily_budget < 1) { setError('Ingresá un presupuesto diario válido.'); return }
    if (form.destination_url && !isValidUrl(form.destination_url)) {
      setError('La URL de destino no es válida. Ej: https://tutienda.com/producto'); return
    }
    setError(''); setStep(1)
  }

  function goStep1to2() {
    if (!diagnosis.advertisingStatus) { setError('Seleccioná tu situación publicitaria actual.'); return }
    if (!diagnosis.businessType)      { setError('Seleccioná el tipo de negocio.'); return }
    if (!diagnosis.mainObjective)     { setError('Seleccioná tu objetivo principal.'); return }
    const needsUrl = diagnosis.businessType === 'ecommerce' || diagnosis.mainObjective === 'sales'
    if (needsUrl && !form.destination_url) {
      setError('Para e-commerce y ventas, la URL de destino es obligatoria. Completá el campo en el paso anterior.'); return
    }
    if (diagnosis.mainObjective === 'whatsapp' && !form.whatsapp_number) {
      setError('Para mensajes de WhatsApp, ingresá tu número con código de país (ej: +549...).'); return
    }
    let rec = inferStrategyFromDiagnosis(diagnosis, pixelLevel)
    // Safety net: never recommend a strategy the pixel can't support
    if (!availableStrategies.includes(rec)) {
      rec = (availableStrategies[availableStrategies.length - 1] as StrategyType) || 'TOFU'
    }
    setRecommended(rec)
    setField('strategy_type', rec)
    setError(''); setStep(2)
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

  // ── Generate with AI ──────────────────────────────────────────────────────
  async function generateWithAI() {
    setError(''); setGenLoading(true); setStep(4); setGenStep(0)
    const t1 = setTimeout(() => setGenStep(1), 2500)
    const t2 = setTimeout(() => setGenStep(2), 6000)
    try {
      const validBase64s  = imageBase64s.filter(Boolean)
      const validMedTypes = imageMediaTypes.filter(Boolean)
      const firstVideoName = mediaFiles.find(f => f.type.startsWith('video/'))?.name

      const res = await fetch('/api/ai/generate-copies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_description: form.product_description,
          strategy_type:       form.strategy_type,
          daily_budget:        form.daily_budget,
          target_country:      form.target_country,
          existing_copy:       form.existing_copy  || undefined,
          target_audience:     form.target_audience || undefined,
          image_base64s:       validBase64s.length  ? validBase64s  : undefined,
          image_media_types:   validMedTypes.length ? validMedTypes : undefined,
          image_base64:        validBase64s[0]  || undefined,
          image_media_type:    validMedTypes[0] || undefined,
          video_name:          firstVideoName,
          business_type:       diagnosis.businessType      || undefined,
          advertising_status:  diagnosis.advertisingStatus || undefined,
          main_objective:      diagnosis.mainObjective     || undefined,
          monthly_budget:      diagnosis.monthlyBudget     || undefined,
          current_roas:        diagnosis.currentRoas       || undefined,
          currency,
          destination_url:     form.destination_url  || undefined,
          whatsapp_number:     form.whatsapp_number  || undefined,
        }),
      })
      clearTimeout(t1); clearTimeout(t2)

      const rawText = await res.text()
      let data: any
      try {
        data = JSON.parse(rawText)
      } catch {
        const preview = rawText.slice(0, 120).replace(/\n/g, ' ')
        throw new Error(res.status === 413
          ? 'Las imágenes son demasiado grandes. Reducí el tamaño o usá menos imágenes (máx 10 por campaña).'
          : `Error del servidor (${res.status}): ${preview}`)
      }

      // No-credits: show upgrade modal instead of generic error
      if (!res.ok && data?.code === 'NO_CREDITS') {
        clearTimeout(t1); clearTimeout(t2)
        setNoCreditsModal(true)
        setGenLoading(false); setStep(3); setGenStep(-1)
        return
      }

      if (!res.ok) throw new Error(data?.error || `Error ${res.status} al generar la estrategia`)

      setGenStep(3)
      setTimeout(() => {
        setAiStrategy(data.copies)
        setEditedCopies({})
        setGenStep(-1); setGenLoading(false)
        // Refresh server components so the sidebar credits widget shows updated numbers
        router.refresh()
        // Show upgrade prompt if this was the last credit
        if (data.credits_remaining === 0) setNoCreditsModal(true)
      }, 700)
    } catch (err: any) {
      clearTimeout(t1); clearTimeout(t2)
      setError(err.message || 'Error desconocido al conectar con la IA')
      setGenLoading(false); setStep(3); setGenStep(-1)
    }
  }

  // ── Save campaign to DB ───────────────────────────────────────────────────
  async function saveCampaignToDB(): Promise<string | null> {
    if (!aiStrategy) return null
    const supabase  = createClient()
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
        target_audience:       form.target_audience || null,
        status:                'draft',
        ai_copies:             effective,
        target_country:        form.target_country,
        target_age_min:        targeting?.age_min || null,
        target_age_max:        targeting?.age_max || null,
        target_gender:         targeting?.gender  || null,
        target_interests:      targeting?.interests || null,
        recommended_placement: effective.recommended_placements?.join(', ') || null,
        recommended_schedule:  effective.recommended_schedule || null,
        strategy_type:         form.strategy_type,
        campaign_structure:    effective.campaign || null,
        estimated_results:     effective.estimated_results || null,
        destination_url:       form.destination_url  || null,
        whatsapp_number:       form.whatsapp_number  || null,
      })
      .select().single()

    if (err || !campaign) {
      setError(`Error al guardar: ${err?.message || 'Intentá de nuevo.'}`); return null
    }

    // Upload creatives
    for (const file of mediaFiles) {
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
    setStep(0); setAiStrategy(null); setSavedCampaignId(null)
    setPublishedOk(false); setMetaCampaignId(''); setPublishError(''); setError('')
    setMediaFiles([]); setMediaPreviews([]); setImageBase64s([]); setImageMediaTypes([])
    setEditedCopies({}); setDiagnosis(defaultDiagnosis)
    setFormState(prev => ({
      product_description: '', strategy_type: 'TOFU',
      daily_budget: prev.daily_budget, target_country: prev.target_country,
      existing_copy: '', target_audience: '',
      destination_url: prev.destination_url, whatsapp_number: prev.whatsapp_number,
    }))
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      <style>{`.drop-zone-active { border-color: rgba(233,30,140,0.60) !important; background: rgba(233,30,140,0.06) !important; }`}</style>

      {/* Header */}
      <div className="mb-8">
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e91e8c', marginBottom: 6 }}>
          Inteligencia artificial · AdFlow
        </p>
        <h1 className="page-title mb-1.5">Crear campaña con IA ✨</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Describí tu negocio y la IA diseña una estrategia completa lista para publicar en Meta
        </p>
        {pixelAnalysis && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 99, marginTop: 10,
            background: pixelLevel >= 5 ? 'rgba(6,214,160,0.10)' : pixelLevel >= 3 ? 'rgba(245,158,11,0.10)' : 'rgba(239,68,68,0.10)',
            border: `1px solid ${pixelLevel >= 5 ? 'rgba(6,214,160,0.30)' : pixelLevel >= 3 ? 'rgba(245,158,11,0.30)' : 'rgba(239,68,68,0.30)'}`,
          }}>
            <span style={{ fontSize: 14 }}>
              {pixelLevel >= 6 ? '🚀' : pixelLevel >= 3 ? '📊' : '🌱'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: pixelLevel >= 5 ? '#06d6a0' : pixelLevel >= 3 ? '#f59e0b' : '#f87171' }}>
              Nivel {pixelLevel}: {pixelLevelName}
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              · {availableStrategies.join(' · ')} disponibles
            </span>
          </div>
        )}
      </div>

      {/* Steps indicator */}
      <div className="flex items-center mb-10">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all" style={{
                background: i < step ? 'linear-gradient(135deg, #62c4b0, #3a9a8a)'
                  : i === step ? 'linear-gradient(135deg, #ea1b7e, #c5006a)'
                    : 'rgba(255,255,255,0.05)',
                border: i > step ? '1px solid rgba(255,255,255,0.10)' : 'none',
                color: i <= step ? '#fff' : 'rgba(255,255,255,0.35)',
                boxShadow: i === step ? '0 0 18px rgba(233,30,140,0.50)' : 'none', fontSize: 11,
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 11, color: i === step ? '#ffffff' : i < step ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)', fontWeight: i === step ? 600 : 400 }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-2 h-px" style={{ background: i < step ? 'linear-gradient(to right, #ea1b7e, #62c4b0)' : 'rgba(255,255,255,0.07)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Global error (shown above steps except 4 which handles internally) */}
      {error && step < 4 && (
        <div className="mb-5 p-3.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Step 0 */}
      {step === 0 && (
        <StepEssential
          form={form} setField={setField}
          currency={currency} currSymbol={currSymbol} budgetUSD={budgetUSD}
          error={error} onNext={goStep0to1}
        />
      )}

      {/* Step 1 */}
      {step === 1 && (
        <StepDiagnosis
          diagnosis={diagnosis} setDiagField={setDiagField}
          form={form} setField={setField}
          error={error} onBack={() => setStep(0)} onNext={goStep1to2}
        />
      )}

      {/* Step 2 */}
      {step === 2 && (
        <StepStrategy
          form={form} setField={setField}
          recommended={recommended} diagnosis={diagnosis}
          error={error}
          availableStrategies={availableStrategies}
          pixelLevelName={pixelLevelName}
          onBack={() => setStep(1)}
          onNext={() => { setError(''); setStep(3) }}
        />
      )}

      {/* Step 3 */}
      {step === 3 && (
        <StepContent
          form={form} setField={setField}
          mediaFiles={mediaFiles} mediaPreviews={mediaPreviews}
          onFilesAdded={processFiles} onRemoveMedia={removeMedia}
          error={error} loading={genLoading}
          onBack={() => setStep(2)} onGenerate={generateWithAI}
        />
      )}

      {/* Step 4 */}
      {step === 4 && (
        <StepReview
          loading={genLoading} genStep={genStep}
          aiStrategy={aiStrategy}
          form={form}
          currency={currency} currSymbol={currSymbol} budgetUSD={budgetUSD}
          pageName={pageName}
          mediaPreviews={mediaPreviews}
          editedCopies={editedCopies} onPatchAd={patchAd}
          isPublishing={isPublishing} publishError={publishError}
          savingDraft={savingDraft}
          pixelId={pixelId}
          onAdjust={() => setStep(3)}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublishToMeta}
        />
      )}

      {/* Step 5 — ¡Listo! */}
      {step === 5 && (
        <div style={{
          borderRadius: 20, padding: 40, textAlign: 'center',
          background: 'linear-gradient(160deg, rgba(18,4,10,0.92) 0%, rgba(12,3,7,0.96) 100%)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}>
          <div style={{
            width: 72, height: 72, margin: '0 auto 20px', borderRadius: '50%',
            background: publishedOk
              ? 'linear-gradient(135deg, rgba(24,119,242,0.15), rgba(24,119,242,0.08))'
              : 'linear-gradient(135deg, rgba(98,196,176,0.15), rgba(98,196,176,0.08))',
            border: `1px solid ${publishedOk ? 'rgba(24,119,242,0.30)' : 'rgba(98,196,176,0.30)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
          }}>
            {publishedOk ? '🚀' : '🎉'}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {publishedOk ? '¡Campaña publicada en Meta!' : '¡Campaña guardada!'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.6, maxWidth: 380, margin: '0 auto 28px' }}>
            {publishedOk
              ? 'Tu campaña fue creada en Meta Ads en estado PAUSADA. Activala desde Ads Manager cuando estés listo para invertir.'
              : 'Tu campaña fue guardada como borrador. Podés publicarla en Meta Ads desde el detalle de campaña.'
            }
          </p>

          <div className="flex flex-col items-center gap-3">
            {publishedOk && metaCampaignId && (
              <a href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${metaCampaignId}`}
                 target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold w-full max-w-xs justify-center transition-opacity hover:opacity-90"
                 style={{ background: 'linear-gradient(135deg, #1877F2, #0d5cc7)', color: '#fff', boxShadow: '0 4px 16px rgba(24,119,242,0.30)' }}>
                <ExternalLink size={14} /> Ver en Ads Manager ↗
              </a>
            )}
            {savedCampaignId && (
              <button onClick={() => router.push(`/dashboard/campaigns/${savedCampaignId}`)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold w-full max-w-xs justify-center transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}>
                Ver detalle de campaña →
              </button>
            )}
            <button onClick={() => router.push('/dashboard/campaigns')}
              className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--muted)' }}>
              Ver todas mis campañas
            </button>
            <button onClick={resetWizard}
              className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--muted)' }}>
              + Crear otra campaña
            </button>
          </div>
        </div>
      )}

      {/* ── No credits modal ──────────────────────────────────────────────── */}
      {noCreditsModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setNoCreditsModal(false) }}
        >
          <div style={{
            background: 'linear-gradient(160deg, #0e0a12 0%, #0a0610 100%)',
            border: '1px solid rgba(239,68,68,0.28)',
            borderRadius: 20, padding: 36, width: '100%', maxWidth: 380,
            textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.72), 0 0 80px rgba(239,68,68,0.06)',
          }}>
            <div style={{ fontSize: 38, marginBottom: 14 }}>⚡</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
              Sin créditos disponibles
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.65, maxWidth: 300, margin: '0 auto 28px' }}>
              Usaste todos tus créditos de IA este mes. Mejorá tu plan para seguir generando estrategias.
            </p>
            <button
              onClick={() => router.push('/dashboard/billing')}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                background: 'linear-gradient(135deg, #ea1b7e, #c5006a)',
                color: '#ffffff', fontSize: 14, fontWeight: 700, border: 'none',
                boxShadow: '0 4px 20px rgba(234,27,126,0.32)',
                marginBottom: 12, display: 'block',
              }}
            >
              Mejorar plan →
            </button>
            <button
              onClick={() => setNoCreditsModal(false)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', padding: 8 }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
