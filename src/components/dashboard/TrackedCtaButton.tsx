'use client'
// src/components/dashboard/TrackedCtaButton.tsx
// Small client wrapper for CTA buttons/links that need click tracking.
// Fires POST /api/actions/track before navigating. Navigation is NEVER blocked
// by a tracking failure — the fetch is fire-and-forget.
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

interface Props {
  actionId: string
  actionLabel: string
  href: string
  source?: string
  className?: string
  style?: React.CSSProperties
  children: ReactNode
}

export default function TrackedCtaButton({
  actionId, actionLabel, href, source = 'dashboard_gps',
  className, style, children,
}: Props) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Fire-and-forget — don't block navigation on tracking
    try {
      fetch('/api/actions/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_id: actionId,
          action_label: actionLabel,
          target_url: href,
          source,
        }),
        keepalive: true,
      }).catch(() => { /* ignore */ })
    } catch { /* ignore */ }
    router.push(href)
  }

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  )
}
