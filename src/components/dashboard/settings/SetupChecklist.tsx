'use client'

export interface ChecklistItem {
  label: string
  completed: boolean
}

interface Props {
  score: number
  items: ChecklistItem[]
}

export default function SetupChecklist({ score, items }: Props) {
  if (score >= 100) return null

  return (
    <div className="card p-6 mb-6"
         style={{ border: '1px solid rgba(79,110,247,0.3)', background: 'rgba(79,110,247,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">🚀 Completá tu configuración</h2>
        <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{score}%</span>
      </div>
      <div className="h-2 rounded-full mb-5 overflow-hidden" style={{ background: 'var(--surface2)' }}>
        <div className="h-2 rounded-full transition-all duration-500"
             style={{ width: `${score}%`, background: 'linear-gradient(90deg, #4f6ef7, #7c3aed)' }} />
      </div>
      <div className="grid grid-cols-2 gap-y-2 gap-x-6">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="flex-shrink-0 font-bold"
                  style={{ color: item.completed ? 'var(--accent3)' : 'var(--border)' }}>
              {item.completed ? '✓' : '○'}
            </span>
            <span style={{ color: item.completed ? 'var(--text)' : 'var(--muted)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      {score === 0 && (
        <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
          Completar tu perfil permite a la IA generar mejores campañas y usar tus activos de marca automáticamente.
        </p>
      )}
    </div>
  )
}
