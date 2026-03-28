'use client'
import { useState } from 'react'
import { ChevronDown, MessageCircle, Play, Sparkles, Settings, Megaphone, BarChart2 } from 'lucide-react'

const FAQS = [
  {
    q: '¿Cómo conectar mi cuenta de Facebook Ads?',
    a: 'Ir a Configuración → hacé clic en "Conectar Facebook Ads" → autorizá los permisos. Necesitás tener una cuenta publicitaria activa en Facebook Business Manager.',
  },
  {
    q: '¿Cuánto tarda en generar los copies con IA?',
    a: 'Entre 10 y 20 segundos. La IA analiza tu producto, el objetivo de la campaña y genera 3 variantes de headline, texto principal, CTA y una sugerencia de audiencia.',
  },
  {
    q: '¿Qué permisos pide Facebook al conectar?',
    a: 'AdFlow solicita: ads_management (crear/editar campañas), ads_read (leer métricas), business_management (acceder al Business Manager), pages_read_engagement (páginas de Facebook) e instagram_basic (cuenta de Instagram).',
  },
  {
    q: '¿Puedo editar los textos generados por la IA?',
    a: 'Sí. En el Paso 3 de creación de campaña podés editar el texto principal directamente. Los headlines también se pueden seleccionar y usar el que más te guste.',
  },
  {
    q: '¿Cómo funciona el reporte diario?',
    a: 'Cada mañana a las 8:00 AM, AdFlow analiza el rendimiento de tus campañas activas con IA y te envía un email con recomendaciones. Podés configurar el email en Configuración → Perfil.',
  },
  {
    q: '¿Qué tamaño deben tener las imágenes para los anuncios?',
    a: 'Para Feed de Facebook/Instagram: 1080×1080px (cuadrado) o 1200×628px (horizontal). Para Stories/Reels: 1080×1920px (vertical). Formatos: JPG, PNG. Videos: MP4 de hasta 15 segundos para Stories.',
  },
  {
    q: '¿AdFlow publica automáticamente en Facebook?',
    a: 'Todavía no — esta funcionalidad está en desarrollo. Por ahora AdFlow genera todos los copies y textos; vos los copiás y usás en el Administrador de Anuncios de Facebook. Próximamente habrá publicación directa.',
  },
  {
    q: '¿Cómo mejorar el ROAS de mis campañas?',
    a: 'Los factores clave son: creativos de alta calidad, audiencias bien segmentadas, landing page optimizada y presupuesto suficiente (mínimo $10/día para que el algoritmo aprenda). AdFlow te da recomendaciones personalizadas en el reporte diario.',
  },
]

const GUIDE_STEPS = [
  { icon: Settings,   title: 'Paso 1: Configurar tu cuenta', desc: 'Conectá Facebook Ads, completá tu perfil de negocio, subí tu logo y configurá los colores de marca.' },
  { icon: Sparkles,   title: 'Paso 2: Crear tu primera campaña', desc: 'Describí tu producto/servicio con detalle. Cuanto más contexto le des a la IA, mejores serán los copies.' },
  { icon: Megaphone,  title: 'Paso 3: Subir creativos', desc: 'Subí las imágenes y videos de tus productos a la Biblioteca de Creativos para tenerlos organizados.' },
  { icon: BarChart2,  title: 'Paso 4: Monitorear con IA', desc: 'Revisá los reportes diarios que te llegan por email y aplicá las recomendaciones de la IA.' },
]

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="page-title mb-1">Centro de ayuda</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Guías, FAQ y soporte para sacarle el máximo a AdFlow</p>
      </div>

      {/* Video tutorial placeholder */}
      <div className="card mb-6 overflow-hidden">
        <div className="relative flex items-center justify-center cursor-pointer group"
             style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.15), rgba(79,70,229,0.1))', height: 200 }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
               style={{ background: 'rgba(233,30,140,0.3)', border: '2px solid rgba(233,30,140,0.5)' }}>
            <Play size={24} style={{ color: '#f9a8d4' }} fill="#f9a8d4" />
          </div>
          <div className="absolute bottom-4 left-4">
            <p className="text-sm font-semibold">Tutorial: Cómo crear tu primera campaña con IA</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>3 minutos · Próximamente</p>
          </div>
        </div>
      </div>

      {/* Guía de primeros pasos */}
      <div className="card p-6 mb-6">
        <h2 className="section-title mb-5">🗺 Guía de primeros pasos</h2>
        <div className="space-y-4">
          {GUIDE_STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(233,30,140,0.12)', border: '1px solid rgba(233,30,140,0.2)' }}>
                  <Icon size={16} style={{ color: '#f9a8d4' }} strokeWidth={1.75} />
                </div>
                {i < GUIDE_STEPS.length - 1 && (
                  <div className="w-px flex-1 mt-1" style={{ background: 'var(--border)', minHeight: 20 }} />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm font-semibold mb-0.5">{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="section-title">Preguntas frecuentes</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-white/[0.02]"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-sm font-medium pr-4">{faq.q}</span>
                <ChevronDown size={16} strokeWidth={1.75}
                  className="flex-shrink-0 transition-transform"
                  style={{ color: 'var(--muted)', transform: openFaq === i ? 'rotate(180deg)' : 'none' }} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Soporte por WhatsApp */}
      <div className="p-5 rounded-2xl flex items-center justify-between gap-4"
           style={{ background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.2)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
               style={{ background: 'rgba(6,214,160,0.12)' }}>
            <MessageCircle size={22} style={{ color: 'var(--accent3)' }} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold">¿Necesitás ayuda personalizada?</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Escribinos por WhatsApp y te respondemos en menos de 24hs.</p>
          </div>
        </div>
        <a href="https://wa.me/5491155551234" target="_blank" rel="noopener noreferrer"
           className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
           style={{ background: 'rgba(6,214,160,0.15)', color: 'var(--accent3)', border: '1px solid rgba(6,214,160,0.3)' }}>
          Abrir WhatsApp →
        </a>
      </div>
    </div>
  )
}
