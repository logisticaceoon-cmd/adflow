'use client'
// src/app/admin/settings/page.tsx
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, RefreshCw, Shield, DollarSign, Layers, AlertTriangle, Zap } from 'lucide-react'

type Settings = {
  plan_prices:   { free: number; pro: number; agency: number }
  maintenance_mode: boolean
  campaign_limits: { free: number; pro: number; agency: number }
  plan_credits:  { free: number; pro: number; agency: number }
}

const DEFAULT: Settings = {
  plan_prices:      { free: 0,   pro: 49,  agency: 149  },
  maintenance_mode: false,
  campaign_limits:  { free: 3,   pro: 20,  agency: 100  },
  plan_credits:     { free: 100, pro: 400, agency: 1000 },
}

const TEAL    = '#62c4b0'
const TEAL_BG = 'rgba(98,196,176,0.15)'
const TEAL_BD = 'rgba(98,196,176,0.30)'

function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="admin-card rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center gap-2.5"
        style={{ borderColor: 'rgba(98,196,176,0.15)' }}>
        <Icon size={15} style={{ color: TEAL }} strokeWidth={1.75} />
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function NumInput({ label, value, onChange, hint }: {
  label: string; value: number; onChange: (v: number) => void; hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label className="text-sm text-white">{label}</label>
        {hint && <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{hint}</p>}
      </div>
      <input
        type="number"
        value={value}
        min={0}
        onChange={e => onChange(Number(e.target.value))}
        className="w-28 px-3 py-1.5 rounded-lg text-sm text-right font-semibold"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${TEAL_BD}`,
          color: '#e2e8f0',
          outline: 'none',
        }}
      />
    </div>
  )
}

function SaveBtn({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
      style={{ background: TEAL_BG, color: TEAL, border: `1px solid ${TEAL_BD}` }}>
      {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
      {label}
    </button>
  )
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)
  const [newPassword, setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('app_settings').select('key, value')
      if (!data) { setLoading(false); return }
      const merged = { ...DEFAULT }
      for (const row of data) {
        if (row.key === 'plan_prices')      merged.plan_prices      = row.value
        if (row.key === 'maintenance_mode') merged.maintenance_mode  = row.value === true || row.value === 'true'
        if (row.key === 'campaign_limits')  merged.campaign_limits   = row.value
        if (row.key === 'plan_credits')     merged.plan_credits      = row.value
      }
      setSettings(merged)
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function save(key: keyof Settings, value: any) {
    setSaving(key)
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    setSaving(null)
    if (error) showToast(`Error: ${error.message}`, false)
    else showToast('Configuración guardada')
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { showToast('Las contraseñas no coinciden', false); return }
    if (newPassword.length < 8) { showToast('Mínimo 8 caracteres', false); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)
    if (error) showToast(`Error: ${error.message}`, false)
    else { showToast('Contraseña actualizada'); setNewPassword(''); setConfirmPassword('') }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(98,196,176,0.3)', borderTopColor: TEAL }} />
      </div>
    )
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid ${TEAL_BD}`,
    color: '#e2e8f0',
    outline: 'none',
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1 text-white">Configuración</h1>
        <p className="text-sm" style={{ color: '#94a3b8' }}>Gestión global de la plataforma</p>
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{
            background: toast.ok ? 'rgba(45, 212, 168,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.ok ? 'rgba(45, 212, 168,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: toast.ok ? '#2dd4a8' : '#ef4444',
          }}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col gap-5">

        {/* Plan prices */}
        <Section title="Precios de planes" icon={DollarSign}>
          <div className="flex flex-col gap-3 mb-4">
            <NumInput label="Free ($/mes)"    value={settings.plan_prices.free}
              onChange={v => setSettings(s => ({ ...s, plan_prices: { ...s.plan_prices, free: v } }))} />
            <NumInput label="Pro ($/mes)"     value={settings.plan_prices.pro}
              onChange={v => setSettings(s => ({ ...s, plan_prices: { ...s.plan_prices, pro: v } }))} />
            <NumInput label="Agency ($/mes)"  value={settings.plan_prices.agency}
              onChange={v => setSettings(s => ({ ...s, plan_prices: { ...s.plan_prices, agency: v } }))} />
          </div>
          <form onSubmit={e => { e.preventDefault(); save('plan_prices', settings.plan_prices) }}>
            <SaveBtn saving={saving === 'plan_prices'} label="Guardar precios" />
          </form>
        </Section>

        {/* Campaign limits */}
        <Section title="Límite de campañas por plan" icon={Layers}>
          <div className="flex flex-col gap-3 mb-4">
            <NumInput label="Free (max campañas)"   value={settings.campaign_limits.free}
              onChange={v => setSettings(s => ({ ...s, campaign_limits: { ...s.campaign_limits, free: v } }))} />
            <NumInput label="Pro (max campañas)"    value={settings.campaign_limits.pro}
              onChange={v => setSettings(s => ({ ...s, campaign_limits: { ...s.campaign_limits, pro: v } }))} />
            <NumInput label="Agency (max campañas)" value={settings.campaign_limits.agency}
              onChange={v => setSettings(s => ({ ...s, campaign_limits: { ...s.campaign_limits, agency: v } }))} />
          </div>
          <form onSubmit={e => { e.preventDefault(); save('campaign_limits', settings.campaign_limits) }}>
            <SaveBtn saving={saving === 'campaign_limits'} label="Guardar límites" />
          </form>
        </Section>

        {/* AI Credits per plan */}
        <Section title="Créditos de IA por plan" icon={Zap}>
          <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
            1 crédito = 1 generación de copies con IA · Costo real: ~$0.001 por crédito (Claude Haiku)
          </p>
          <div className="flex flex-col gap-3 mb-4">
            <NumInput
              label="Free · 100 créditos/mes"
              value={settings.plan_credits.free}
              onChange={v => setSettings(s => ({ ...s, plan_credits: { ...s.plan_credits, free: v } }))}
              hint="≈ 100 campañas básicas · 33 campañas con 3 variantes"
            />
            <NumInput
              label="Pro · 400 créditos/mes"
              value={settings.plan_credits.pro}
              onChange={v => setSettings(s => ({ ...s, plan_credits: { ...s.plan_credits, pro: v } }))}
              hint="≈ 400 campañas básicas · 133 campañas con 3 variantes"
            />
            <NumInput
              label="Agency · 1000 créditos/mes"
              value={settings.plan_credits.agency}
              onChange={v => setSettings(s => ({ ...s, plan_credits: { ...s.plan_credits, agency: v } }))}
              hint="≈ 1000 campañas básicas · 333 campañas con 3 variantes"
            />
          </div>
          {/* Cost reference */}
          <div className="rounded-xl p-3 mb-4 text-xs"
            style={{ background: 'rgba(98,196,176,0.08)', border: '1px solid rgba(98,196,176,0.20)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={11} style={{ color: TEAL }} />
              <span className="font-semibold" style={{ color: TEAL }}>Referencia de costos Claude Haiku</span>
            </div>
            <div className="flex flex-col gap-0.5" style={{ color: '#94a3b8' }}>
              <span>Free ($0): 100 créditos → ~$0.10/mes en IA</span>
              <span>Pro ($49): 400 créditos → ~$0.40/mes en IA</span>
              <span>Agency ($99): 1000 créditos → ~$1.00/mes en IA</span>
            </div>
          </div>
          <form onSubmit={e => { e.preventDefault(); save('plan_credits', settings.plan_credits) }}>
            <SaveBtn saving={saving === 'plan_credits'} label="Guardar créditos" />
          </form>
        </Section>

        {/* Maintenance mode */}
        <Section title="Modo mantenimiento" icon={AlertTriangle}>
          <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
            Cuando está activo, los usuarios ven una pantalla de mantenimiento en lugar del dashboard.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-5 rounded-full transition-colors cursor-pointer relative"
                style={{ background: settings.maintenance_mode ? '#ef4444' : 'rgba(255,255,255,0.10)' }}
                onClick={() => setSettings(s => ({ ...s, maintenance_mode: !s.maintenance_mode }))}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: settings.maintenance_mode ? '22px' : '2px' }} />
              </div>
              <span className="text-sm font-semibold"
                style={{ color: settings.maintenance_mode ? '#ef4444' : '#94a3b8' }}>
                {settings.maintenance_mode ? 'ACTIVO — plataforma en mantenimiento' : 'Desactivado'}
              </span>
            </div>
            <form onSubmit={e => { e.preventDefault(); save('maintenance_mode', settings.maintenance_mode) }}>
              <SaveBtn saving={saving === 'maintenance_mode'} label="Guardar" />
            </form>
          </div>
        </Section>

        {/* Change password */}
        <Section title="Cambiar contraseña de administrador" icon={Shield}>
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>
                Nueva contraseña
              </label>
              <input type="password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••" className="w-full px-3 py-2 rounded-xl text-sm"
                style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>
                Confirmar contraseña
              </label>
              <input type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••" className="w-full px-3 py-2 rounded-xl text-sm"
                style={inputStyle} />
            </div>
            <button type="submit" disabled={pwLoading || !newPassword}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold w-fit"
              style={{
                background: TEAL_BG, color: TEAL, border: `1px solid ${TEAL_BD}`,
                opacity: (!newPassword || pwLoading) ? 0.5 : 1,
              }}>
              {pwLoading ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
              Actualizar contraseña
            </button>
          </form>
        </Section>

      </div>
    </div>
  )
}
