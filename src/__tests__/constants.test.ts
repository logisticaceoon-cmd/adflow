import { describe, it, expect } from 'vitest'
import { toCountryCode, COUNTRY_CODE_MAP, META_GRAPH_URL } from '@/lib/constants'

// ── META_GRAPH_URL ────────────────────────────────────────────────────────────
describe('META_GRAPH_URL', () => {
  it('is the correct Facebook Graph API base URL', () => {
    expect(META_GRAPH_URL).toBe('https://graph.facebook.com/v20.0')
  })
})

// ── COUNTRY_CODE_MAP ──────────────────────────────────────────────────────────
describe('COUNTRY_CODE_MAP', () => {
  it('contains expected Latin American countries', () => {
    expect(COUNTRY_CODE_MAP['argentina']).toBe('AR')
    expect(COUNTRY_CODE_MAP['colombia']).toBe('CO')
    expect(COUNTRY_CODE_MAP['chile']).toBe('CL')
    expect(COUNTRY_CODE_MAP['uruguay']).toBe('UY')
    expect(COUNTRY_CODE_MAP['paraguay']).toBe('PY')
    expect(COUNTRY_CODE_MAP['bolivia']).toBe('BO')
  })

  it('contains Spanish and English variants for the same country', () => {
    expect(COUNTRY_CODE_MAP['perú']).toBe('PE')
    expect(COUNTRY_CODE_MAP['peru']).toBe('PE')
    expect(COUNTRY_CODE_MAP['españa']).toBe('ES')
    expect(COUNTRY_CODE_MAP['spain']).toBe('ES')
    expect(COUNTRY_CODE_MAP['brasil']).toBe('BR')
    expect(COUNTRY_CODE_MAP['brazil']).toBe('BR')
  })
})

// ── toCountryCode ─────────────────────────────────────────────────────────────
describe('toCountryCode', () => {
  it('maps "argentina" → AR', () => {
    expect(toCountryCode('argentina')).toBe('AR')
  })

  it('maps "méxico" → MX', () => {
    expect(toCountryCode('méxico')).toBe('MX')
  })

  it('maps "mexico" (without accent) → MX', () => {
    expect(toCountryCode('mexico')).toBe('MX')
  })

  it('maps "colombia" → CO', () => {
    expect(toCountryCode('colombia')).toBe('CO')
  })

  it('maps "chile" → CL', () => {
    expect(toCountryCode('chile')).toBe('CL')
  })

  it('maps "perú" → PE', () => {
    expect(toCountryCode('perú')).toBe('PE')
  })

  it('maps "peru" → PE', () => {
    expect(toCountryCode('peru')).toBe('PE')
  })

  it('maps "españa" → ES', () => {
    expect(toCountryCode('españa')).toBe('ES')
  })

  it('maps "spain" → ES', () => {
    expect(toCountryCode('spain')).toBe('ES')
  })

  it('maps "estados unidos" → US', () => {
    expect(toCountryCode('estados unidos')).toBe('US')
  })

  it('maps "united states" → US', () => {
    expect(toCountryCode('united states')).toBe('US')
  })

  it('maps "usa" → US', () => {
    expect(toCountryCode('usa')).toBe('US')
  })

  it('maps "brasil" → BR', () => {
    expect(toCountryCode('brasil')).toBe('BR')
  })

  it('maps "brazil" → BR', () => {
    expect(toCountryCode('brazil')).toBe('BR')
  })

  it('maps "buenos aires" → AR', () => {
    expect(toCountryCode('buenos aires')).toBe('AR')
  })

  it('maps "república dominicana" → DO', () => {
    expect(toCountryCode('república dominicana')).toBe('DO')
  })

  it('maps "dominican republic" → DO', () => {
    expect(toCountryCode('dominican republic')).toBe('DO')
  })

  it('maps "puerto rico" → PR', () => {
    expect(toCountryCode('puerto rico')).toBe('PR')
  })

  // 2-letter code passthrough
  it('returns uppercase for 2-letter code "AR"', () => {
    expect(toCountryCode('AR')).toBe('AR')
  })

  it('returns uppercase for lowercase 2-letter code "ar"', () => {
    expect(toCountryCode('ar')).toBe('AR')
  })

  it('returns uppercase for 2-letter code "US"', () => {
    expect(toCountryCode('US')).toBe('US')
  })

  it('returns uppercase for 2-letter code "mx"', () => {
    expect(toCountryCode('mx')).toBe('MX')
  })

  // Unknown countries — returns first 2 chars uppercased
  it('returns first 2 chars uppercased for unknown country "france"', () => {
    expect(toCountryCode('france')).toBe('FR')
  })

  it('returns first 2 chars uppercased for unknown country "germany"', () => {
    expect(toCountryCode('germany')).toBe('GE')
  })

  it('returns first 2 chars uppercased for unknown country "italy"', () => {
    expect(toCountryCode('italy')).toBe('IT')
  })

  // Input normalization: leading/trailing whitespace
  it('trims leading and trailing spaces', () => {
    expect(toCountryCode('  argentina  ')).toBe('AR')
  })

  it('is case-insensitive for known mappings', () => {
    expect(toCountryCode('Argentina')).toBe('AR')
    expect(toCountryCode('ARGENTINA')).toBe('AR')
    expect(toCountryCode('aRgEnTiNa')).toBe('AR')
  })
})
