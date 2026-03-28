// src/lib/currency.ts
// Utility to format currency amounts using the user's ad account currency

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', ARS: '$', MXN: '$', CLP: '$', COP: '$', PEN: 'S/',
  BRL: 'R$', EUR: '€', GBP: '£', UYU: '$U', PYG: '₲', BOB: 'Bs.',
}

/**
 * Format a monetary value with the given currency code.
 * Falls back to a plain "$" prefix if the currency is unknown.
 */
export function formatCurrency(value: number, currency = 'USD', options?: { decimals?: number }): string {
  const decimals = options?.decimals ?? 0
  const symbol   = CURRENCY_SYMBOLS[currency] ?? currency + ' '
  return `${symbol}${value.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}
