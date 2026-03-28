// src/app/layout.tsx
import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './styles.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-display', weight: ['400', '600', '700', '800'] })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['300', '400', '500'] })

export const metadata: Metadata = {
  title: 'AdFlow — Anuncios de Facebook con IA',
  description: 'Crea campañas de Facebook Ads profesionales en minutos con Inteligencia Artificial',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${syne.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
