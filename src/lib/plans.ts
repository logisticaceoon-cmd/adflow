// src/lib/plans.ts — shared plan constants (no server imports, safe for client)
import type { PlanType } from '@/types'

// Fuente ÚNICA de planes válidos. Debe coincidir con el CHECK de profiles.plan
// y con los enums de validación (validations.ts). No hardcodear listas sueltas.
export const VALID_PLANS = ['free', 'starter', 'pro', 'agency'] as const

export function isValidPlan(plan: unknown): plan is PlanType {
  return typeof plan === 'string' && (VALID_PLANS as readonly string[]).includes(plan)
}

export const PLAN_CREDITS: Record<string, number> = {
  free:    10,
  starter: 100,
  pro:     400,
  agency:  1000,
}

export const PLAN_PRICE: Record<string, string> = {
  free:    'Gratis',
  starter: 'USD 19/mes',
  pro:     'USD 49/mes',
  agency:  'USD 99/mes',
}

export const PLAN_LABEL: Record<string, string> = {
  free:    'Free',
  starter: 'Starter',
  pro:     'Pro',
  agency:  'Agencia',
}

export const PLAN_COLOR: Record<string, string> = {
  free:    '#62c4b0',
  starter: '#a78bfa',
  pro:     'var(--ds-color-primary)',
  agency:  '#f59e0b',
}
