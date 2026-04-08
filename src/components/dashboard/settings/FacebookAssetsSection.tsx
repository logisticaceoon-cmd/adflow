'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BusinessProfile } from '@/types'

interface MetaAsset { id: string; name: string }
interface MetaIG    { id: string; username: string }

interface Props {
  hasFbToken: boolean
  initialData: BusinessProfile | null
}

function Spinner() {
  return <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin flex-shrink-0" />
}

export default function FacebookAssetsSection({ hasFbToken, initialData }: Props) {
  // Listas de opciones
  const [businesses,  setBusinesses]  = useState<MetaAsset[]>([])
  const [adAccounts,  setAdAccounts]  = useState<MetaAsset[]>([])
  const [pages,       setPages]       = useState<MetaAsset[]>([])
  const [pixels,      setPixels]      = useState<MetaAsset[]>([])
  const [igAccounts,  setIgAccounts]  = useState<MetaIG[]>([])

  // Loading por sección independiente
  const [loadingBase,        setLoadingBase]        = useState(false)
  const [loadingAdAccounts,  setLoadingAdAccounts]  = useState(false)
  const [loadingPixels,      setLoadingPixels]      = useState(false)
  const [loadingInstagram,   setLoadingInstagram]   = useState(false)

  // Errores por sección independiente
  const [baseError,  setBaseError]  = useState('')
  const [pixelError, setPixelError] = useState('')
  const [igError,    setIgError]    = useState('')

  // Guardar
  const [saving,          setSaving]          = useState(false)
  const [saved,           setSaved]           = useState(false)
  const [saveError,       setSaveError]       = useState('')
  const [validationError, setValidationError] = useState('')

  const [form, setForm] = useState({
    business_portfolio_id:    initialData?.business_portfolio_id    || '',
    business_portfolio_name:  initialData?.business_portfolio_name  || '',
    selected_ad_account_id:   initialData?.selected_ad_account_id   || '',
    selected_ad_account_name: initialData?.selected_ad_account_name || '',
    pixel_id:                 initialData?.pixel_id                 || '',
    pixel_name:               initialData?.pixel_name               || '',
    fb_page_id:               initialData?.fb_page_id               || '',
    fb_page_name:             initialData?.fb_page_name             || '',
    instagram_account_id:     initialData?.instagram_account_id     || '',
    instagram_account_name:   initialData?.instagram_account_name   || '',
  })

  // Carga inicial: un solo request con todos los params conocidos
  useEffect(() => {
    if (!hasFbToken) return
    const params = new URLSearchParams()
    if (initialData?.business_portfolio_id)  params.set('business_id',    initialData.business_portfolio_id)
    if (initialData?.selected_ad_account_id) params.set('ad_account_id',  initialData.selected_ad_account_id)
    if (initialData?.fb_page_id)             params.set('page_id',        initialData.fb_page_id)
    loadInitialAssets(params.toString())
  }, [hasFbToken]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadInitialAssets(queryString: string) {
    setLoadingBase(true)
    setBaseError('')
    try {
      const res  = await fetch(`/api/facebook/meta-assets${queryString ? '?' + queryString : ''}`)
      const data = await res.json()
      if (data.error) { setBaseError(data.error); return }

      setBusinesses(data.businesses   || [])
      setAdAccounts(data.adAccounts   || [])
      setPages(data.pages             || [])
      if ((data.pixels            || []).length > 0) setPixels(data.pixels)
      if ((data.instagramAccounts || []).length > 0) setIgAccounts(data.instagramAccounts)
    } catch {
      setBaseError('Error al conectar con Meta API. Intentá recargar la página.')
    } finally {
      setLoadingBase(false)
    }
  }

  async function loadAdAccounts(businessId: string) {
    setLoadingAdAccounts(true)
    setBaseError('')
    try {
      const res  = await fetch(`/api/facebook/meta-assets?business_id=${businessId}`)
      const data = await res.json()
      if (data.error) { setBaseError(`Error al cargar cuentas: ${data.error}`); return }
      if (data.adAccountsError) {
        setBaseError(`Meta API: ${data.adAccountsError}`)
        return
      }
      setAdAccounts(data.adAccounts || [])
      if ((data.adAccounts || []).length === 0) {
        setBaseError('Este Business Portfolio no tiene cuentas publicitarias accesibles con tu token.')
      }
    } catch {
      setBaseError('Error al cargar las cuentas publicitarias. Intentá de nuevo.')
    } finally {
      setLoadingAdAccounts(false)
    }
  }

  async function loadPixels(adAccountId: string) {
    setLoadingPixels(true)
    setPixelError('')
    try {
      const res  = await fetch(`/api/facebook/meta-assets?ad_account_id=${adAccountId}`)
      const data = await res.json()
      if (data.error) { setPixelError(`Error al cargar pixels: ${data.error}`); return }
      setPixels(data.pixels || [])
    } catch {
      setPixelError('Error al cargar los pixels. Intentá de nuevo.')
    } finally {
      setLoadingPixels(false)
    }
  }

  async function loadInstagram(pageId: string) {
    setLoadingInstagram(true)
    setIgError('')
    try {
      const res  = await fetch(`/api/facebook/meta-assets?page_id=${pageId}`)
      const data = await res.json()
      if (data.error) { setIgError(`Error al cargar Instagram: ${data.error}`); return }
      const accounts = data.instagramAccounts || []
      setIgAccounts(accounts)
      if (accounts.length === 0) {
        const detail = data.igDebugError ? ` (${data.igDebugError})` : ''
        setIgError(`No se encontró una cuenta de Instagram vinculada a esta Página.${detail}`)
      }
    } catch {
      setIgError('Error al cargar cuentas de Instagram. Intentá de nuevo.')
    } finally {
      setLoadingInstagram(false)
    }
  }

  function handlePortfolio(id: string) {
    const biz = businesses.find(b => b.id === id)
    setForm(p => ({
      ...p,
      business_portfolio_id:    id,
      business_portfolio_name:  biz?.name || '',
      selected_ad_account_id:   '',
      selected_ad_account_name: '',
      pixel_id:   '',
      pixel_name: '',
    }))
    setAdAccounts([])
    setPixels([])
    setBaseError('')
    setValidationError('')
    if (id) loadAdAccounts(id)
  }

  function handleAdAccount(id: string) {
    const account = adAccounts.find(a => a.id === id)
    setForm(p => ({
      ...p,
      selected_ad_account_id:   id,
      selected_ad_account_name: account?.name || '',
      pixel_id:   '',
      pixel_name: '',
    }))
    setPixels([])
    setPixelError('')
    setValidationError('')
    if (id) loadPixels(id)
  }

  function handlePixel(id: string) {
    const pixel = pixels.find(p => p.id === id)
    setForm(p => ({ ...p, pixel_id: id, pixel_name: pixel?.name || '' }))
    setValidationError('')
  }

  function handlePage(id: string) {
    const page = pages.find(p => p.id === id)
    setForm(p => ({
      ...p,
      fb_page_id:   id,
      fb_page_name: page?.name || '',
      instagram_account_id:   '',
      instagram_account_name: '',
    }))
    setIgAccounts([])
    setIgError('')
    setValidationError('')
    if (id) loadInstagram(id)
  }

  function handleInstagram(id: string) {
    const ig = igAccounts.find(a => a.id === id)
    setForm(p => ({ ...p, instagram_account_id: id, instagram_account_name: ig?.username || '' }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')
    setValidationError('')

    if (!form.selected_ad_account_id) {
      setValidationError('Seleccioná una Ad Account antes de guardar.')
      return
    }
    if (!form.fb_page_id) {
      setValidationError('Seleccioná una Página de Facebook antes de guardar.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('business_profiles').upsert(
        { user_id: user!.id, ...form, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      if (error) { setSaveError(`Error al guardar: ${error.message}`); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setSaveError('Error inesperado al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (!hasFbToken) {
    return (
      <div className="card p-6 mb-5">
        <h2 className="section-title mb-3">📘 Cuenta publicitaria de Facebook</h2>
        <p className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
          Primero conectá tu cuenta de Facebook Ads para seleccionar los activos publicitarios.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-5">
      <h2 className="section-title mb-1">📘 Cuenta publicitaria de Facebook</h2>
      <p className="text-xs mb-5" style={{ color: 'var(--ds-text-secondary)' }}>
        Seleccioná los activos que se usarán por defecto en tus campañas
      </p>

      {/* Error de carga base */}
      {baseError && (
        <div className="mb-4 p-3 rounded-lg text-xs flex items-center gap-2"
             style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--ds-color-danger)' }}>
          <span>⚠</span> {baseError}
          <button type="button" className="ml-auto underline" onClick={() => loadInitialAssets('')}>
            Reintentar
          </button>
        </div>
      )}

      {loadingBase ? (
        <div className="flex items-center gap-2 py-6">
          <Spinner />
          <span className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>Cargando activos de Meta...</span>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">

            {/* Business Portfolio */}
            <div className="col-span-2">
              <label className="label">
                <span className="flex items-center gap-1.5">
                  Business Portfolio
                  {loadingAdAccounts && <Spinner />}
                </span>
              </label>
              <select className="input-field" value={form.business_portfolio_id}
                onChange={e => handlePortfolio(e.target.value)}>
                <option value="">— Sin portfolio (cuentas personales) —</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--ds-text-secondary)' }}>
                Opcional. Si tus cuentas están bajo un Business Manager, seleccionalo para filtrar.
              </p>
            </div>

            {/* Ad Account */}
            <div>
              <label className="label">Ad Account *</label>
              <select className="input-field" value={form.selected_ad_account_id}
                disabled={loadingAdAccounts}
                onChange={e => handleAdAccount(e.target.value)}>
                <option value="">
                  {loadingAdAccounts ? 'Cargando cuentas...' : '— Seleccioná una cuenta —'}
                </option>
                {adAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
                ))}
              </select>
            </div>

            {/* Pixel */}
            <div>
              <label className="label">
                <span className="flex items-center gap-1.5">
                  Pixel de Facebook
                  {loadingPixels && <Spinner />}
                </span>
              </label>
              <select className="input-field" value={form.pixel_id}
                onChange={e => handlePixel(e.target.value)}
                disabled={!form.selected_ad_account_id || loadingPixels}>
                <option value="">
                  {loadingPixels ? 'Cargando pixels...' : '— Seleccioná un pixel —'}
                </option>
                {pixels.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
              {pixelError && (
                <p className="text-xs mt-1" style={{ color: 'var(--ds-color-danger)' }}>⚠ {pixelError}</p>
              )}
              {!form.selected_ad_account_id && !pixelError && (
                <p className="text-xs mt-1" style={{ color: 'var(--ds-text-secondary)' }}>Seleccioná una Ad Account primero</p>
              )}
            </div>

            {/* Página de Facebook */}
            <div>
              <label className="label">Página de Facebook *</label>
              <select className="input-field" value={form.fb_page_id}
                onChange={e => handlePage(e.target.value)}>
                <option value="">— Seleccioná una página —</option>
                {pages.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Instagram */}
            <div>
              <label className="label">
                <span className="flex items-center gap-1.5">
                  Cuenta de Instagram
                  {loadingInstagram && <Spinner />}
                </span>
              </label>
              <select className="input-field" value={form.instagram_account_id}
                onChange={e => handleInstagram(e.target.value)}
                disabled={!form.fb_page_id || loadingInstagram}>
                <option value="">
                  {loadingInstagram ? 'Cargando cuentas...' : '— Seleccioná una cuenta —'}
                </option>
                {igAccounts.map(a => (
                  <option key={a.id} value={a.id}>@{a.username}</option>
                ))}
              </select>
              {igError && (
                <p className="text-xs mt-1" style={{ color: 'var(--ds-color-danger)' }}>⚠ {igError}</p>
              )}
              {!form.fb_page_id && !igError && (
                <p className="text-xs mt-1" style={{ color: 'var(--ds-text-secondary)' }}>Seleccioná una Página primero</p>
              )}
            </div>
          </div>

          {/* Errores de validación y guardado */}
          {validationError && (
            <p className="text-xs" style={{ color: 'var(--ds-color-danger)' }}>⚠ {validationError}</p>
          )}
          {saveError && (
            <p className="text-xs" style={{ color: 'var(--ds-color-danger)' }}>⚠ {saveError}</p>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar activos'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
