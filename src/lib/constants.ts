// src/lib/constants.ts
// Shared constants used across multiple modules.

export const META_GRAPH_URL = 'https://graph.facebook.com/v20.0'

export const COUNTRY_CODE_MAP: Record<string, string> = {
  'argentina': 'AR', 'buenos aires': 'AR',
  'méxico': 'MX', 'mexico': 'MX', 'colombia': 'CO',
  'chile': 'CL', 'perú': 'PE', 'peru': 'PE', 'españa': 'ES', 'spain': 'ES',
  'estados unidos': 'US', 'united states': 'US', 'usa': 'US',
  'brasil': 'BR', 'brazil': 'BR',
  'uruguay': 'UY', 'paraguay': 'PY', 'bolivia': 'BO', 'ecuador': 'EC',
  'venezuela': 'VE', 'costa rica': 'CR', 'panamá': 'PA', 'panama': 'PA',
  'guatemala': 'GT', 'honduras': 'HN', 'el salvador': 'SV',
  'república dominicana': 'DO', 'dominican republic': 'DO', 'puerto rico': 'PR',
  'nicaragua': 'NI', 'cuba': 'CU',
}

export function toCountryCode(name: string): string {
  const normalized = name.toLowerCase().trim()
  if (COUNTRY_CODE_MAP[normalized]) return COUNTRY_CODE_MAP[normalized]
  if (/^[a-z]{2}$/i.test(name.trim())) return name.trim().toUpperCase()
  return normalized.toUpperCase().slice(0, 2)
}
