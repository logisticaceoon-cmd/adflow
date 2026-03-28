// src/lib/plans.ts — shared plan constants (no server imports, safe for client)
import type { PlanType } from '@/types'

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
  pro:     '#e91e8c',
  agency:  '#f59e0b',
}
