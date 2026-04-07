// src/lib/ai-strategist.ts
// STUB — Phase 4 preparation. Chat strategist with full business context.
// Not wired into any live flow; the /dashboard/strategist page shows a
// "coming soon" screen instead of rendering a chat UI.
import type { AIConversationContext } from '@/types/advanced'

export interface StrategistResponse {
  response: string
  conversationId: string
  actionItems: string[]
}

/**
 * Sends a user message to Claude with full business context and persists
 * the conversation in ai_conversations.
 *
 * Planned flow:
 *  1. Load user context: pixel level, campaigns, metrics, budgets, achievements
 *  2. Load or create ai_conversations row
 *  3. Build system prompt (growth marketing strategist persona + context)
 *  4. Call Claude with full message history
 *  5. Parse response for action items (e.g. "scale campaign X", "pause Y")
 *  6. Convert action items into entries the recommendation-engine can surface
 *  7. Save updated messages array + summary
 */
export async function chatWithStrategist(
  userId: string,
  message: string,
  conversationId?: string,
  _context: AIConversationContext = 'general',
): Promise<StrategistResponse> {
  console.log(`[ai-strategist] Stub: chatWithStrategist(${userId}, "${message.slice(0, 40)}…") — not implemented yet`)
  return {
    response: 'Estratega IA próximamente disponible.',
    conversationId: conversationId || 'new',
    actionItems: [],
  }
}

/**
 * Generates a weekly executive briefing for the user. Would be called from a
 * weekly cron (e.g. every Monday at 7 AM local time).
 */
export async function generateWeeklyBriefing(userId: string): Promise<string> {
  console.log(`[ai-strategist] Stub: generateWeeklyBriefing(${userId}) — not implemented yet`)
  return ''
}

/**
 * Summarizes a conversation using Claude (fills the `summary` column).
 */
export async function summarizeConversation(conversationId: string): Promise<string> {
  console.log(`[ai-strategist] Stub: summarizeConversation(${conversationId}) — not implemented yet`)
  return ''
}
