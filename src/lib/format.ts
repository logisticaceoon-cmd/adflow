// src/lib/format.ts — shared formatting utilities

/** Human-readable relative time (e.g. "hace 5 min", "hace 2 h", "hace 3 días") */
export function formatRelative(date: string | null | undefined): string {
  if (!date) return 'nunca'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace unos segundos'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}
