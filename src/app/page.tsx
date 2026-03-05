// src/app/page.tsx
// Página de inicio - Landing page pública
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Fondo con gradientes */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 60% 50% at 70% 20%, rgba(79,110,247,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(124,58,237,0.15) 0%, transparent 60%)
          `
        }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-14 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
               style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)' }}>⚡</div>
          <span className="font-display text-xl font-bold">AdFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm">Iniciar sesión</Link>
          <Link href="/register" className="btn-primary text-sm">Empezar gratis →</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-8 font-semibold"
             style={{ background: 'rgba(79,110,247,0.12)', border: '1px solid rgba(79,110,247,0.3)', color: '#8da4f8' }}>
          <span style={{ color: 'var(--accent3)' }}>✦ NUEVO</span> Generación de campañas con IA integrada
        </div>

        <h1 className="font-display font-extrabold leading-none mb-6 max-w-4xl"
            style={{ fontSize: 'clamp(42px, 6vw, 80px)', letterSpacing: '-2px' }}>
          Crea anuncios de{' '}
          <span style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed, #06d6a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Facebook profesionales
          </span>
          {' '}en minutos.
        </h1>

        <p className="text-lg max-w-xl mb-10 leading-relaxed" style={{ color: 'var(--muted)' }}>
          Subí tu contenido, nuestra IA construye la campaña completa: copies, segmentación,
          presupuestos y reportes automáticos diarios.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/register" className="btn-primary" style={{ padding: '13px 30px', fontSize: '15px' }}>
            Crear mi primera campaña →
          </Link>
          <Link href="/login" className="btn-ghost" style={{ padding: '13px 24px', fontSize: '15px' }}>
            Ya tengo cuenta
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 flex gap-16 justify-center flex-wrap pt-10 border-t w-full max-w-2xl"
             style={{ borderColor: 'var(--border)' }}>
          {[
            { num: '+340%', label: 'ROI promedio en clientes' },
            { num: '8 min', label: 'De idea a campaña activa' },
            { num: '24/7', label: 'Monitoreo y alertas IA' },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <div className="font-display font-extrabold text-4xl mb-1"
                   style={{ background: 'linear-gradient(135deg, #4f6ef7, #06d6a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {num}
              </div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
