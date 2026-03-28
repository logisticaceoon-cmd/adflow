// src/components/campaign/shared.ts — Shared types, constants, helpers for campaign creation

import type { StrategyType } from '@/types'

export interface DiagnosisData {
  advertisingStatus: string
  businessType: string
  mainObjective: string
  monthlyBudget: string
  currentRoas: string
}

export const defaultDiagnosis: DiagnosisData = {
  advertisingStatus: '', businessType: '', mainObjective: '', monthlyBudget: '', currentRoas: '',
}

export interface StrategyConfig {
  label: string; subtitle: string; icon: string; color: string
  borderColor: string; bg: string; metaObjectives: string
  message: string; forWho: string; minBudget: number
  results: string[]; structure: string; adSetCount: number
}

export const STRATEGY_CONFIG: Record<StrategyType, StrategyConfig> = {
  TOFU: {
    label: 'Top of Funnel', subtitle: 'Reconocimiento', icon: '📢',
    color: '#62c4b0', borderColor: 'rgba(98,196,176,0.45)',
    bg: 'linear-gradient(145deg, rgba(98,196,176,0.14) 0%, rgba(98,196,176,0.04) 100%)',
    metaObjectives: 'OUTCOME_AWARENESS · OUTCOME_TRAFFIC',
    message: 'Presentarte al mundo, generar alcance masivo',
    forWho: 'Negocios nuevos, productos desconocidos, nueva audiencia fría',
    minBudget: 10, results: ['3,000–8,000 impresiones/día', '200–500 clics/día', 'CPM estimado: $3–8'],
    structure: '1 campaña · 2 conjuntos · 6 anuncios', adSetCount: 2,
  },
  MOFU: {
    label: 'Middle of Funnel', subtitle: 'Consideración', icon: '🎯',
    color: '#62c4b0', borderColor: 'rgba(98,196,176,0.45)',
    bg: 'linear-gradient(145deg, rgba(98,196,176,0.14) 0%, rgba(98,196,176,0.04) 100%)',
    metaObjectives: 'OUTCOME_ENGAGEMENT · OUTCOME_LEADS',
    message: 'Convertir interesados en prospectos calificados',
    forWho: 'Audiencias que ya te conocen, remarketing, engagement previo',
    minBudget: 15, results: ['50–150 leads/día', 'CPL estimado: $1–5', '500–2,000 msj WhatsApp'],
    structure: '1 campaña · 2 conjuntos · 6 anuncios', adSetCount: 2,
  },
  BOFU: {
    label: 'Bottom of Funnel', subtitle: 'Conversión', icon: '💰',
    color: '#f59e0b', borderColor: 'rgba(245,158,11,0.45)',
    bg: 'linear-gradient(145deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.04) 100%)',
    metaObjectives: 'OUTCOME_SALES',
    message: 'Cerrar ventas con audiencia lista para comprar',
    forWho: 'Audiencias calientes, retargeting, clientes que casi compraron',
    minBudget: 20, results: ['5–20 ventas/día (según producto)', 'ROAS estimado: 2x–6x', 'CPA estimado: $3–15'],
    structure: '1 campaña · 3 conjuntos · 9 anuncios', adSetCount: 3,
  },
}

export const ANGLE_LABELS: Record<string, string> = {
  emocional: '💜 Emocional', informativo: '📊 Informativo',
  urgencia: '⚡ Urgencia', social_proof: '⭐ Social Proof',
}

export const ANGLE_ICONS: Record<string, string> = {
  emocional: '💜', informativo: '📊', urgencia: '⚡', social_proof: '⭐',
}

export const GEN_STEPS = [
  '🧠 Analizando negocio y diagnóstico...',
  '🏗️ Diseñando estructura de campaña...',
  '✍️ Generando copies para cada anuncio...',
  '✅ ¡Estrategia completa lista!',
]

export const ADV_STATUS_OPTIONS = [
  { value: 'first_time', icon: '🚀', label: 'Primera vez que hago publicidad' },
  { value: 'improving',  icon: '📈', label: 'Ya invierto y quiero mejores resultados' },
  { value: 'restarting', icon: '🔄', label: 'Invertí antes pero lo pausé' },
  { value: 'scaling',    icon: '⚡', label: 'Escalo una campaña que ya funciona' },
]

export const BUSINESS_TYPE_OPTIONS = [
  { value: 'ecommerce',   icon: '🛍️', label: 'E-commerce / Tienda online' },
  { value: 'infoproduct', icon: '🎓', label: 'Infoproducto / Curso / Servicio digital' },
  { value: 'local',       icon: '🏪', label: 'Negocio local / Servicio presencial' },
  { value: 'b2b',         icon: '🏢', label: 'B2B / Empresa a empresa' },
  { value: 'app',         icon: '📱', label: 'App móvil' },
]

export const OBJECTIVE_OPTIONS = [
  { value: 'sales',     icon: '💰', label: 'Ventas / Facturación inmediata' },
  { value: 'leads',     icon: '👥', label: 'Conseguir leads / Prospectos' },
  { value: 'whatsapp',  icon: '💬', label: 'Mensajes de WhatsApp / Consultas' },
  { value: 'awareness', icon: '👁️', label: 'Que me conozcan / Visibilidad' },
  { value: 'retention', icon: '🔁', label: 'Que vuelvan clientes existentes' },
]

export const BUDGET_OPTIONS = [
  { value: 'low',        label: 'Menos de $100/mes' },
  { value: 'medium',     label: '$100 - $500/mes' },
  { value: 'high',       label: '$500 - $2,000/mes' },
  { value: 'enterprise', label: 'Más de $2,000/mes' },
]

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', ARS: '$', MXN: '$', CLP: '$', COP: '$',
  PEN: 'S/', BRL: 'R$', EUR: '€', GBP: '£', UYU: '$U', PYG: '₲', BOB: 'Bs',
}

export const APPROX_RATES: Record<string, number> = {
  USD: 1, ARS: 1050, COP: 4200, CLP: 970, MXN: 17.5,
  PEN: 3.8, BRL: 5.2, EUR: 0.92, GBP: 0.79, UYU: 41, PYG: 7500, BOB: 6.9,
}

export function inferStrategyFromDiagnosis(d: DiagnosisData): StrategyType {
  if (d.advertisingStatus === 'scaling') return 'BOFU'
  if (d.mainObjective === 'retention') return 'BOFU'
  if (d.businessType === 'ecommerce' && d.mainObjective === 'sales') return 'BOFU'
  if (d.mainObjective === 'leads' || d.mainObjective === 'whatsapp') return 'MOFU'
  if (d.advertisingStatus === 'improving') return 'MOFU'
  return 'TOFU'
}

export function buildDiagnosisReason(d: DiagnosisData, strategy: StrategyType): string {
  const biz    = ({ ecommerce: 'e-commerce', infoproduct: 'infoproducto', local: 'negocio local', b2b: 'empresa B2B', app: 'app móvil' } as Record<string, string>)[d.businessType] || d.businessType
  const status = ({ first_time: 'primera vez en publicidad', improving: 'mejora de resultados', restarting: 'reactivación', scaling: 'escalado' } as Record<string, string>)[d.advertisingStatus] || d.advertisingStatus
  const obj    = ({ sales: 'ventas inmediatas', leads: 'conseguir leads', whatsapp: 'mensajes WhatsApp', awareness: 'visibilidad', retention: 'retención de clientes' } as Record<string, string>)[d.mainObjective] || d.mainObjective
  const reasons: Record<StrategyType, string> = {
    TOFU: 'necesitás construir audiencia primero antes de intentar convertir.',
    MOFU: 'tu objetivo requiere capturar interesados calificados y nutrir la relación.',
    BOFU: 'estás listo para convertir a audiencias calientes en compradores.',
  }
  return `Tenés un ${biz} en fase de ${status} buscando ${obj}. Recomendamos ${strategy} porque ${reasons[strategy]}`
}

export function isValidUrl(url: string): boolean {
  if (!url.trim()) return false
  try { new URL(url); return true } catch { return false }
}

export async function compressImageFile(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1920
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Compression failed')); return }
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const [header, data] = result.split(',')
          const mt = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
          resolve({ base64: data, mediaType: mt })
        }
        reader.readAsDataURL(blob)
      }, 'image/jpeg', 0.80)
    }
    img.onerror = reject
    img.src = url
  })
}
