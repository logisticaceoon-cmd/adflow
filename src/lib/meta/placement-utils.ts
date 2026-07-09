// src/lib/meta/placement-utils.ts
// Meta Ads placement validation constants, sanitizer, CTA mapping, and opt-goal resolver.
export { toCountryCode } from '@/lib/constants'

// ── Valid Meta placement whitelists ──────────────────────────────────────────

export const VALID_PUBLISHER_PLATFORMS = new Set([
  'facebook', 'instagram', 'audience_network', 'messenger',
])

export const VALID_FACEBOOK_POSITIONS = new Set([
  'feed', 'right_hand_column', 'marketplace', 'video_feeds',
  'story', 'search', 'groups_feed', 'profile_feed',
  'facebook_reels', 'instream_video', 'instant_article',
])

export const VALID_INSTAGRAM_POSITIONS = new Set([
  'stream', 'story', 'explore', 'explore_home', 'reels',
  'profile_feed', 'ig_search', 'profile_reels',
])

export const FB_POSITION_RENAMES: Record<string, string> = {
  reels: 'facebook_reels',
  reels_overlay: 'facebook_reels',
  reel: 'facebook_reels',
}

export function sanitizePlacements(t: {
  publisher_platforms?: string[]
  facebook_positions?: string[]
  instagram_positions?: string[]
}): {
  publisher_platforms?: string[]
  facebook_positions?: string[]
  instagram_positions?: string[]
} | null {
  if (!t.publisher_platforms?.length) return null
  const platforms = t.publisher_platforms.filter(p => VALID_PUBLISHER_PLATFORMS.has(p))
  if (!platforms.length) return null
  const result: {
    publisher_platforms?: string[]
    facebook_positions?: string[]
    instagram_positions?: string[]
  } = { publisher_platforms: platforms }
  if (t.facebook_positions?.length) {
    const fbPos = t.facebook_positions
      .map(p => FB_POSITION_RENAMES[p] ?? p)
      .filter(p => VALID_FACEBOOK_POSITIONS.has(p))
    if (fbPos.length) result.facebook_positions = fbPos
  }
  if (t.instagram_positions?.length) {
    const igPos = t.instagram_positions.filter(p => VALID_INSTAGRAM_POSITIONS.has(p))
    if (igPos.length) result.instagram_positions = igPos
  }
  return result
}

// ── CTA label → Meta CTA type ─────────────────────────────────────────────────

export const CTA_MAP: Record<string, string> = {
  'comprar ahora': 'SHOP_NOW', comprar: 'SHOP_NOW', compra: 'SHOP_NOW', 'shop now': 'SHOP_NOW',
  'finalizar compra': 'SHOP_NOW', 'completar compra': 'SHOP_NOW', 'completa tu compra': 'SHOP_NOW',
  'agregar al carrito': 'SHOP_NOW', 'añadir al carrito': 'SHOP_NOW',
  'ver en la tienda': 'SHOP_NOW', 'ir a la tienda': 'SHOP_NOW', 'visitar tienda': 'SHOP_NOW',
  'ver producto': 'SHOP_NOW', 'ver productos': 'SHOP_NOW',
  'proteger ahora': 'SHOP_NOW', 'pedir ahora': 'SHOP_NOW', 'ordenar ahora': 'SHOP_NOW',
  'más información': 'LEARN_MORE', 'mas informacion': 'LEARN_MORE', 'más info': 'LEARN_MORE', 'learn more': 'LEARN_MORE',
  'saber más': 'LEARN_MORE', 'conocer más': 'LEARN_MORE', 'conocé más': 'LEARN_MORE',
  contactar: 'CONTACT_US', contactarnos: 'CONTACT_US', 'contact us': 'CONTACT_US',
  'enviar mensaje': 'MESSAGE_PAGE', mensaje: 'MESSAGE_PAGE',
  whatsapp: 'WHATSAPP_MESSAGE', escribinos: 'WHATSAPP_MESSAGE',
  registrarse: 'SIGN_UP', registrarme: 'SIGN_UP', registrarte: 'SIGN_UP', 'sign up': 'SIGN_UP',
  'obtener oferta': 'GET_OFFER', 'get offer': 'GET_OFFER', 'ver oferta': 'GET_OFFER',
  'ver más': 'SEE_MORE', 'see more': 'SEE_MORE',
  descargar: 'DOWNLOAD', download: 'DOWNLOAD',
  reservar: 'BOOK_TRAVEL', 'reservar ahora': 'BOOK_TRAVEL',
  solicitar: 'APPLY_NOW', 'solicitar ahora': 'APPLY_NOW', aplicar: 'APPLY_NOW',
  suscribirse: 'SUBSCRIBE', suscribirme: 'SUBSCRIBE', subscribe: 'SUBSCRIBE',
}

export function toCTAType(label: string, ctaType?: string, objective?: string): string {
  if (ctaType && /^[A-Z_]+$/.test(ctaType)) return ctaType
  const lower = (label || '').toLowerCase()
  for (const [key, val] of Object.entries(CTA_MAP)) {
    if (lower.includes(key)) return val
  }
  if (objective === 'OUTCOME_SALES' || objective === 'CONVERSIONS') return 'SHOP_NOW'
  if (objective === 'OUTCOME_LEADS' || objective === 'LEAD_GENERATION') return 'SIGN_UP'
  return 'LEARN_MORE'
}

// ── Optimization goal + promoted_object from campaign objective ───────────────

export function resolveOptGoalForObjective(
  campaignObjective: string,
  pixelId: string | null,
): { optimization_goal: string; promoted_object: Record<string, unknown> | null } {
  switch (campaignObjective) {
    case 'OUTCOME_AWARENESS':
    case 'REACH':
      return { optimization_goal: 'REACH', promoted_object: null }
    case 'OUTCOME_TRAFFIC':
    case 'TRAFFIC':
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }
    case 'OUTCOME_ENGAGEMENT':
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }
    case 'OUTCOME_LEADS':
    case 'LEAD_GENERATION':
      if (pixelId) return { optimization_goal: 'LEAD_GENERATION', promoted_object: { pixel_id: pixelId, custom_event_type: 'LEAD' } }
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }
    case 'OUTCOME_SALES':
    case 'CONVERSIONS':
      if (pixelId) return { optimization_goal: 'OFFSITE_CONVERSIONS', promoted_object: { pixel_id: pixelId, custom_event_type: 'PURCHASE' } }
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }
    default:
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }
  }
}
