// src/components/intelligence/ClientInsightCard.tsx
// Renders the expert-crafted client message with the appropriate tone.
interface Props {
  subject: string
  body: string
  tone: 'positive' | 'cautious' | 'alert' | 'neutral'
}

const TONE_CONFIG: Record<Props['tone'], { border: string; icon: string; label: string; bg: string }> = {
  positive: { border: 'var(--ds-color-success)', icon: '🟢', label: 'Buena señal',  bg: 'var(--ds-color-success-soft)' },
  cautious: { border: 'var(--ds-color-warning)', icon: '🟡', label: 'Precaución',   bg: 'var(--ds-color-warning-soft)' },
  alert:    { border: 'var(--ds-color-danger)',  icon: '🔴', label: 'Alerta',       bg: 'var(--ds-color-danger-soft)'  },
  neutral:  { border: 'var(--ds-color-primary)', icon: '🔵', label: 'Informativo',  bg: 'var(--ds-color-primary-soft)' },
}

export default function ClientInsightCard({ subject, body, tone }: Props) {
  const cfg = TONE_CONFIG[tone]

  return (
    <div style={{
      position: 'relative',
      padding: 'var(--ds-space-lg)',
      borderRadius: 'var(--ds-card-radius)',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      borderLeft: `3px solid ${cfg.border}`,
      backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      boxShadow: 'var(--ds-shadow-sm)',
    }}>
      {/* Tone badge in the corner */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 99,
        background: cfg.bg, border: `1px solid ${cfg.border}44`,
        fontSize: 10, fontWeight: 600, color: cfg.border,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        <span>{cfg.icon}</span>
        <span>{cfg.label}</span>
      </div>

      <p style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
        textTransform: 'uppercase', color: 'var(--ds-text-label)',
        marginBottom: 10,
      }}>
        Mensaje estratégico
      </p>

      <h3 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 16, fontWeight: 600,
        color: 'var(--ds-text-primary)',
        marginBottom: 12,
        paddingRight: 120, // avoid overlap with badge
        lineHeight: 1.35,
      }}>
        {subject}
      </h3>

      <p style={{
        fontSize: 13,
        color: 'var(--ds-text-secondary)',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}>
        {body}
      </p>
    </div>
  )
}
