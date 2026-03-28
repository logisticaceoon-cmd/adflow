// src/lib/credit-costs.ts — single source of truth for IA action costs
// All costs are in credits. 1 credit = 1 IA generation.

export const ACTION_COSTS = {
  generate_copies: 1,   // Full campaign strategy + copies generation
} as const

export type CreditAction = keyof typeof ACTION_COSTS

// Projection helpers: how many campaigns / ads per credit bundle
export const ADS_PER_CAMPAIGN_MIN = 6  // TOFU/MOFU: 2 ad sets × 3 ads
export const ADS_PER_CAMPAIGN_MAX = 9  // BOFU: 3 ad sets × 3 ads
