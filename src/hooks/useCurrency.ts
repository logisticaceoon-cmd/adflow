'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type CurrencyCode = 'USD' | 'ARS' | 'MXN' | 'COP' | 'CLP' | 'PEN' | 'EUR' | 'BRL' | 'UYU' | 'PYG' | 'BOB' | 'VES' | 'CRC' | 'PAB'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  ARS: '$',
  MXN: '$',
  COP: '$',
  CLP: '$',
  PEN: 'S/',
  EUR: '€',
  BRL: 'R$',
  UYU: '$U',
  PYG: '₲',
  BOB: 'Bs.',
  VES: 'Bs.S',
  CRC: '₡',
  PAB: 'B/.',
}

const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  ARS: 'es-AR',
  MXN: 'es-MX',
  COP: 'es-CO',
  CLP: 'es-CL',
  PEN: 'es-PE',
  EUR: 'es-ES',
  BRL: 'pt-BR',
  UYU: 'es-UY',
  PYG: 'es-PY',
  BOB: 'es-BO',
  VES: 'es-VE',
  CRC: 'es-CR',
  PAB: 'es-PA',
}

export interface CurrencyUtils {
  currency: string
  symbol: string
  format: (amount: number, options?: { decimals?: number; showCode?: boolean }) => string
  loading: boolean
}

export function useCurrency(): CurrencyUtils {
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('business_profiles')
        .select('currency')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.currency) setCurrency(data.currency)
          setLoading(false)
        })
    })
  }, [])

  const symbol = CURRENCY_SYMBOLS[currency] ?? '$'
  const locale = CURRENCY_LOCALES[currency] ?? 'en-US'

  function format(amount: number, options?: { decimals?: number; showCode?: boolean }): string {
    const decimals = options?.decimals ?? (currency === 'ARS' || currency === 'CLP' || currency === 'PYG' ? 0 : 2)
    try {
      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount)
      return options?.showCode ? `${formatted} ${currency}` : formatted
    } catch {
      return `${symbol}${amount.toFixed(decimals)}`
    }
  }

  return { currency, symbol, format, loading }
}
