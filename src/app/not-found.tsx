import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#080c14', color: '#fff', fontFamily: 'var(--font-body), sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '4rem', fontFamily: 'var(--font-display), Syne, sans-serif', marginBottom: '1rem' }}>404</h1>
        <p style={{ fontSize: '1.25rem', color: '#9ca3af', marginBottom: '2rem' }}>Página no encontrada</p>
        <Link href="/" style={{ color: '#2dd4bf', textDecoration: 'underline' }}>Volver al inicio</Link>
      </div>
    </div>
  )
}
