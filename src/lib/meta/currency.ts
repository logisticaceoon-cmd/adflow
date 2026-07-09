// src/lib/meta/currency.ts
// Conversión de presupuestos a las "minor units" que espera la Meta Marketing API.
//
// Meta expresa los presupuestos (daily_budget / lifetime_budget) en la subunidad
// de la moneda de la CUENTA PUBLICITARIA. Para monedas con centavos el factor es
// 100 (USD 5.00 → 500). Para monedas SIN decimales el factor es 1 (CLP 5000 → 5000).
//
// Usar el factor 100 en una moneda sin decimales publica presupuestos ×100:
// $50.000 CLP/día se convertían en $5.000.000 CLP/día. Este helper lo evita.

/**
 * Monedas sin decimales para presupuestos de Meta Ads.
 * Incluye la lista ISO 4217 estándar de monedas de cero decimales y las monedas
 * LATAM que Meta gestiona con offset 1 (CLP, COP, PYG, CRC).
 */
export const ZERO_DECIMAL_CURRENCIES = new Set<string>([
  // ISO 4217 zero-decimal
  'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
  // Gestionadas con offset 1 por Meta en la práctica
  'COP', 'CRC',
])

export function isZeroDecimalCurrency(currency?: string | null): boolean {
  return ZERO_DECIMAL_CURRENCIES.has((currency || 'USD').toUpperCase())
}

/** Factor de conversión a subunidades (1 para monedas sin decimales, 100 para el resto). */
export function currencyMinorFactor(currency?: string | null): number {
  return isZeroDecimalCurrency(currency) ? 1 : 100
}

/**
 * Convierte un monto en la unidad mayor de la moneda a las subunidades de Meta.
 * Ej.: toMetaMinorUnits(5, 'USD') → 500 ; toMetaMinorUnits(5000, 'CLP') → 5000.
 */
export function toMetaMinorUnits(amount: number, currency?: string | null): number {
  return Math.round(amount * currencyMinorFactor(currency))
}

/**
 * Presupuesto diario mínimo aceptado por Meta, en subunidades, para la moneda dada
 * (≈ 1 USD equivalente). Evita que Meta rechace presupuestos demasiado bajos.
 */
export function metaMinDailyBudget(currency?: string | null): number {
  const cur = (currency || 'USD').toUpperCase()
  switch (cur) {
    case 'CLP': return 1000
    case 'COP': return 4000
    case 'PYG': return 7000
    case 'CRC': return 600
    case 'KRW': return 1200
    case 'JPY': return 150
    case 'VND': return 25000
    case 'ISK': return 140
    default:    return 100 // monedas con centavos: 100 subunidades = 1.00
  }
}

/**
 * Presupuesto diario listo para enviar a Meta: convierte a subunidades y aplica
 * el mínimo de la moneda. Este es el único punto donde debe calcularse un budget.
 */
export function toMetaDailyBudget(amount: number, currency?: string | null): number {
  return Math.max(metaMinDailyBudget(currency), toMetaMinorUnits(amount, currency))
}
