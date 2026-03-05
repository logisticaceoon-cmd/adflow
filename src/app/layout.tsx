// src/app/layout.tsx
import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: 'AdFlow — Anuncios de Facebook con IA',
  description: 'Crea campañas de Facebook Ads profesionales en minutos con Inteligencia Artificial',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
