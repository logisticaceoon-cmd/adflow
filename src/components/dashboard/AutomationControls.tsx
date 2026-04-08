'use client'
// src/components/dashboard/AutomationControls.tsx
// Small client-only controls for the automation page:
//   • RuleToggle       — enable/disable a rule via PATCH /api/automation/rules
//   • ApproveRejectBtn — approve or reject a pending execution
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

// ── Rule toggle ─────────────────────────────────────────────────
export function RuleToggle({
  ruleId, initialEnabled,
}: { ruleId: string; initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    if (saving) return
    const next = !enabled
    setSaving(true)
    setEnabled(next) // optimistic
    try {
      const res = await fetch('/api/automation/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId, is_enabled: next }),
      })
      if (!res.ok) {
        setEnabled(!next) // revert on failure
      } else {
        router.refresh()
      }
    } catch {
      setEnabled(!next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={saving}
      style={{
        width: 40, height: 22, borderRadius: 99, border: 'none',
        background: enabled ? 'var(--ds-color-success)' : 'rgba(255,255,255,0.12)',
        position: 'relative',
        cursor: saving ? 'wait' : 'pointer',
        transition: 'background 200ms',
        padding: 0,
        flexShrink: 0,
      }}
      aria-label={enabled ? 'Desactivar regla' : 'Activar regla'}
    >
      <span style={{
        position: 'absolute',
        top: 2,
        left: enabled ? 20 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.40)',
        transition: 'left 200ms',
      }} />
    </button>
  )
}

// ── Approve / Reject buttons ───────────────────────────────────
export function ApproveRejectBtns({ executionId }: { executionId: string }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const callApi = async (action: 'approve' | 'reject') => {
    setMessage(null)
    const res = await fetch('/api/automation/executions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, execution_id: executionId }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data?.success !== false) {
      setMessage(action === 'approve' ? '✓ Aprobada y ejecutada' : '✓ Rechazada')
      startTransition(() => router.refresh())
    } else {
      setMessage(`⚠️ ${data?.message || 'Error'}`)
    }
  }

  if (message) {
    return (
      <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', fontWeight: 600 }}>
        {message}
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => callApi('approve')}
        disabled={isPending}
        className="btn-success"
        style={{ fontSize: 11, padding: '7px 14px' }}
      >
        Aprobar
      </button>
      <button
        onClick={() => callApi('reject')}
        disabled={isPending}
        style={{
          fontSize: 11, fontWeight: 600,
          padding: '7px 14px', borderRadius: 99,
          background: 'transparent',
          color: 'var(--ds-text-secondary)',
          border: '1px solid var(--ds-card-border)',
          cursor: 'pointer',
        }}
      >
        Rechazar
      </button>
    </div>
  )
}
