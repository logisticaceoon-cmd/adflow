// src/components/ui/EmptyState.tsx
// Premium empty state with motivational copy + CTA.
import Link from 'next/link'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  variant?: 'default' | 'large' | 'compact'
}

export default function EmptyState({
  icon, title, description, action, secondaryAction, variant = 'default',
}: EmptyStateProps) {
  const isLarge = variant === 'large'
  const isCompact = variant === 'compact'

  const padding = isLarge ? '56px 32px' : isCompact ? '24px 18px' : '40px 24px'
  const iconSize = isLarge ? 56 : isCompact ? 28 : 40
  const titleSize = isLarge ? 22 : isCompact ? 14 : 17

  const renderAction = (a: EmptyStateAction, primary: boolean) => {
    const baseStyle = primary
      ? {
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #e91e8c, #c5006a)',
          color: '#fff', fontSize: 13, fontWeight: 800,
          padding: '11px 22px', borderRadius: 99,
          boxShadow: '0 8px 24px rgba(233,30,140,0.40), 0 0 24px rgba(233,30,140,0.18)',
          textDecoration: 'none', cursor: 'pointer', border: 'none',
        }
      : {
          fontSize: 12, fontWeight: 600, color: 'var(--muted)',
          textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.15)',
          cursor: 'pointer', background: 'none', border: 'none',
        }

    if (a.href) {
      return <Link href={a.href} style={baseStyle as React.CSSProperties}>{a.label}</Link>
    }
    return <button onClick={a.onClick} style={baseStyle as React.CSSProperties}>{a.label}</button>
  }

  return (
    <div style={{
      padding,
      borderRadius: 18,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(233,30,140,0.06), rgba(255,255,255,0.01) 60%)',
      border: '1px dashed rgba(255,255,255,0.10)',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: iconSize,
        marginBottom: isCompact ? 8 : 14,
        filter: 'drop-shadow(0 0 16px rgba(233,30,140,0.25))',
        lineHeight: 1,
      }}>
        {icon}
      </div>
      <h3 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: titleSize, fontWeight: 800, color: '#fff',
        letterSpacing: '-0.01em',
        marginBottom: 6,
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: isCompact ? 12 : 13,
        color: 'var(--muted)',
        lineHeight: 1.5,
        maxWidth: 420,
        margin: '0 auto',
        marginBottom: action || secondaryAction ? (isLarge ? 22 : 16) : 0,
      }}>
        {description}
      </p>
      {action && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {renderAction(action, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  )
}
