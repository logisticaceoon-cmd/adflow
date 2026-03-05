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

export default function FacebookAssetsSection({ hasFbToken, initialData }: Props) {
  const [adAccounts, setAdAccounts]     = useState<MetaAsset[]>([])
  const [pages, setPages]               = useState<MetaAsset[]>([])
  const [pixels, setPixels]             = useState<MetaAsset[]>([])
  const [igAccounts, setIgAccounts]     = useState<MetaIG[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [assetsError, setAssetsError]   = useState('')

  const [form, setForm] = useState({
    selected_ad_account_id:   initialData?.selected_ad_account_id   || '',
    selected_ad_account_name: initialData?.selected_ad_account_name || '',
    pixel_id:                 initialData?.pixel_id                 || '',
    pixel_name:               initialData?.pixel_name               || '',
    fb_page_id:               initialData?.fb_page_id               || '',
    fb_page_name:             initialData?.fb_page_name             || '',
    instagram_account_id:     initialData?.instagram_account_id     || '',
    instagram_account_name:   initialData?.instagram_account_name   || '',
  })

  // Cargar ad accounts y páginas al montar si hay token
  useEffect(() => {
    if (!hasFbToken) return
    fetchBaseAssets()
  }, [hasFbToken])

  async function fetchBaseAssets() {
    setLoadingAssets(true)
    setAssetsError('')
    try {
      const res  = await fetch('/api/facebook/meta-assets')
      const data = await res.json()
      if (data.error) { setAssetsError(data.error); return }
      setAdAccounts(data.adAccounts || [])
      setPages(data.pages || [])
    } catch {
      setAssetsError('Error al cargar los activos de Meta')
    } finally {
      setLoadingAssets(false)
    }
  }

  async function fetchPixels(adAccountId: string) {
    if (!adAccountId) return
    const res  = await fetch(`/api/facebook/meta-assets?ad_account_id=${adAccountId}`)
    const data = await res.json()
    setPixels(data.pixels || [])
  }

  async function fetchInstagram(pageId: string) {
    if (!pageId) return
    const res  = await fetch(`/api/facebook/meta-assets?page_id=${pageId}`)
    const data = await res.json()
    setIgAccounts(data.instagramAccounts || [])
  }

  function handleAdAccount(id: string) {
    const account = adAccounts.find(a => a.id === id)
    setForm(p => ({ ...p, selected_ad_account_id: id, selected_ad_account_name: account?.name || '', pixel_id: '', pixel_name: '' }))
    setPixels([])
    if (id) fetchPixels(id)
  }

  function handlePage(id: string) {
    const page = pages.find(p => p.id === id)
    setForm(p => ({ ...p, fb_page_id: id, fb_page_name: page?.name || '', instagram_account_id: '', instagram_account_name: '' }))
    setIgAccounts([])
    if (id) fetchInstagram(id)
  }

  function handlePixel(id: string) {
    const pixel = pixels.find(p => p.id === id)
    setForm(p => ({ ...p, pixel_id: id, pixel_name: pixel?.name || '' }))
  }

  function handleInstagram(id: string) {
    const ig = igAccounts.find(a => a.id === id)
    setForm(p => ({ ...p, instagram_account_id: id, instagram_account_name: ig?.username || '' }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('business_profiles').upsert(
      { user_id: user!.id, ...form, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!hasFbToken) {
    return (
      <div className="card p-6 mb-5">
        <h2 className="section-title mb-3">📘 Cuenta publicitaria de Facebook</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Primero conectá tu cuenta de Facebook Ads para seleccionar los activos publicitarios.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-5">
      <h2 className="section-title mb-1">📘 Cuenta publicitaria de Facebook</h2>
      <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
        Seleccioná los activos que se usarán por defecto en tus campañas
      </p>

      {assetsError && (
        <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
          {assetsError}
        </div>
      )}

      {loadingAssets ? (
        <div className="flex items-center gap-2 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Cargando activos de Meta...</span>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Ad Account */}
            <div>
              <label className="label">Ad Account</label>
              <select className="input-field" value={form.selected_ad_account_id} onChange={e => handleAdAccount(e.target.value)}>
                <option value="">— Seleccioná una cuenta —</option>
                {adAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
              </select>
            </div>

            {/* Pixel */}
            <div>
              <label className="label">Pixel de Facebook</label>
              <select className="input-field" value={form.pixel_id}
                onChange={e => handlePixel(e.target.value)}
                disabled={!form.selected_ad_account_id}>
                <option value="">— Seleccioná un pixel —</option>
                {pixels.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
              </select>
              {!form.selected_ad_account_id && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Primero seleccioná una Ad Account</p>
              )}
            </div>

            {/* Página de Facebook */}
            <div>
              <label className="label">Página de Facebook</label>
              <select className="input-field" value={form.fb_page_id} onChange={e => handlePage(e.target.value)}>
                <option value="">— Seleccioná una página —</option>
                {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Instagram */}
            <div>
              <label className="label">Cuenta de Instagram</label>
              <select className="input-field" value={form.instagram_account_id}
                onChange={e => handleInstagram(e.target.value)}
                disabled={!form.fb_page_id}>
                <option value="">— Seleccioná una cuenta —</option>
                {igAccounts.map(a => <option key={a.id} value={a.id}>@{a.username}</option>)}
              </select>
              {!form.fb_page_id && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Primero seleccioná una Página de Facebook</p>
              )}
            </div>
          </div>

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
