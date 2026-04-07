// src/components/ui/SectionHeader.tsx
import Link from 'next/link'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: { label: string; href?: string; onClick?: () => void }
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  const actionEl = action && (
    action.href ? (
      <Link
        href={action.href}
        className="ds-section-action"
        style={{
          fontSize: 13, fontWeight: 600,
          color: 'var(--ds-color-primary)',
          textDecoration: 'none',
        }}
      >
        {action.label}
      </Link>
    ) : (
      <button
        type="button"
        onClick={action.onClick}
        className="ds-section-action"
        style={{
          fontSize: 13, fontWeight: 600,
          color: 'var(--ds-color-primary)',
          background: 'none', border: 'none',
          cursor: 'pointer',
        }}
      >
        {action.label}
      </button>
    )
  )

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 18, fontWeight: 600,
          color: 'var(--ds-text-primary)',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            fontSize: 13,
            color: 'var(--ds-text-secondary)',
            marginTop: 4,
            lineHeight: 1.5,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {actionEl}
    </div>
  )
}
