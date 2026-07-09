'use client'
// src/components/dashboard/ThemeToggle.tsx
// Interruptor de tema oscuro/claro. Persiste la elección en localStorage y
// aplica data-theme en <html>. El script anti-flash del layout evita parpadeo.
import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'dark'
    setTheme(current)
  }, [])

  function apply(next: Theme) {
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('adflow-theme', next) } catch { /* ignore */ }
  }

  return (
    <div
      role="group"
      aria-label="Tema de color"
      style={{
        display: 'inline-flex',
        background: 'var(--ds-card-bg)',
        border: '1px solid var(--ds-card-border)',
        borderRadius: 99,
        padding: 2,
      }}
    >
      <button
        type="button"
        onClick={() => apply('dark')}
        aria-label="Tema oscuro"
        aria-pressed={theme === 'dark'}
        style={{
          width: 30, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: theme === 'dark' ? 'var(--ds-color-primary)' : 'transparent',
          color: theme === 'dark' ? '#04241f' : 'var(--ds-text-muted)',
          transition: 'var(--ds-transition-fast)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </button>
      <button
        type="button"
        onClick={() => apply('light')}
        aria-label="Tema claro"
        aria-pressed={theme === 'light'}
        style={{
          width: 30, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: theme === 'light' ? 'var(--ds-color-primary)' : 'transparent',
          color: theme === 'light' ? '#ffffff' : 'var(--ds-text-muted)',
          transition: 'var(--ds-transition-fast)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </button>
    </div>
  )
}
