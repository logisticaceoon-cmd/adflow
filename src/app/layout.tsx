// src/app/layout.tsx
import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './styles.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', weight: ['400', '500', '600', '700'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'AdFlow — Anuncios de Facebook con IA',
  description: 'Crea campañas de Facebook Ads profesionales en minutos con Inteligencia Artificial',
}

// Script anti-flash: fija data-theme antes del primer paint (default: oscuro).
const themeInitScript = `
(function(){try{
  var t = localStorage.getItem('adflow-theme');
  if(!t){t='dark';}
  document.documentElement.setAttribute('data-theme', t);
}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
