// src/lib/forecast-engine.ts
// STUB — Phase 4 preparation. Forecasts require 3+ months of campaign_metrics_daily
// to produce meaningful projections. Not wired into any live flow.
import type { Forecast, ForecastType } from '@/types/advanced'

/**
 * Generates forecasts for the target month based on historical trends.
 * Would be called from a monthly cron (1st day of each month).
 *
 * Planned flow:
 *  1. Read last 3-6 months of campaign_metrics_daily grouped by day
 *  2. Compute simple linear regression or moving average per metric
 *  3. Project spend / revenue / conversions / avg_roas for `targetMonth`
 *  4. Compute confidence level based on data quality (sample size, variance)
 *  5. Upsert into forecasts table (UNIQUE on user_id + forecast_type + target_month)
 */
export async function generateForecast(
  userId: string,
  targetMonth: string,
  _forecastType: ForecastType = 'monthly_spend',
): Promise<Forecast | null> {
  console.log(`[forecast] Stub: generateForecast(${userId}, ${targetMonth}) — not implemented yet`)
  return null
}

/**
 * At month close, updates `actual_value` on forecasts for that month so the
 * model can self-calibrate over time.
 */
export async function compareForecastVsActual(userId: string, month: string): Promise<void> {
  console.log(`[forecast] Stub: compareForecastVsActual(${userId}, ${month}) — not implemented yet`)
}

/**
 * Reads all forecasts for a user/month (for the UI).
 */
export async function getForecasts(userId: string, month?: string): Promise<Forecast[]> {
  console.log(`[forecast] Stub: getForecasts(${userId}, ${month}) — not implemented yet`)
  return []
}
