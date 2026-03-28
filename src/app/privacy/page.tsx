// src/app/privacy/page.tsx
import Link from 'next/link'
import { Zap, Shield, ArrowLeft } from 'lucide-react'

const section = (title: string, children: React.ReactNode) => (
  <section style={{ marginBottom: 40 }}>
    <h2 style={{
      fontSize: 18, fontWeight: 700, color: '#ffffff',
      marginBottom: 12, paddingBottom: 10,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>{title}</h2>
    <div style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.8 }}>{children}</div>
  </section>
)

export default function PrivacyPage() {
  return (
    <div style={{
      background: 'linear-gradient(155deg, #0a0a0f 0%, #110228 45%, #0d0117 70%, #0a0a0f 100%)',
      minHeight: '100vh', color: '#fff',
    }}>
      {/* Orbs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,30,140,0.15) 0%, transparent 68%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-8%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,27,126,0.12) 0%, transparent 68%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.90)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #ea1b7e, #c5006a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>AdFlow</span>
          </Link>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', textDecoration: 'none' }}
            onMouseEnter={undefined}>
            <ArrowLeft size={14} /> Volver al inicio
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '56px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99, marginBottom: 20,
            background: 'rgba(233,30,140,0.10)', border: '1px solid rgba(233,30,140,0.25)',
          }}>
            <Shield size={13} color="#f9a8d4" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#f9a8d4' }}>
              Política de Privacidad
            </span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.5px' }}>
            Tu privacidad importa
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Fecha efectiva: Enero 2026 · AdFlow — Logisticaceoon
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(28,4,14,0.92) 0%, rgba(18,3,9,0.96) 100%)',
          border: '1px solid rgba(98,196,176,0.22)',
          borderRadius: 20,
          padding: '40px 40px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset, 0 20px 60px rgba(0,0,0,0.50)',
        }}>

          {section('1. Quiénes somos', (
            <p>AdFlow es una plataforma de publicidad digital con inteligencia artificial, operada por <strong style={{ color: '#e0e0f8' }}>Logisticaceoon</strong>. Nos especializamos en la creación y optimización de campañas de Facebook/Instagram Ads. Podés contactarnos en: <a href="mailto:logisticaceoon@gmail.com" style={{ color: '#e91e8c' }}>logisticaceoon@gmail.com</a></p>
          ))}

          {section('2. Qué datos recolectamos', (
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong style={{ color: '#e0e0f8' }}>Datos de cuenta:</strong> nombre, dirección de correo electrónico y contraseña (almacenada de forma cifrada via Supabase Auth).</li>
              <li><strong style={{ color: '#e0e0f8' }}>Datos de perfil de negocio:</strong> nombre de empresa, sitio web, industria, país, número de WhatsApp (opcionales, provistos por vos).</li>
              <li><strong style={{ color: '#e0e0f8' }}>Tokens de acceso de Meta/Facebook:</strong> token OAuth de larga duración (60 días) necesario para publicar y leer métricas de tus campañas en tu cuenta publicitaria. Este token se almacena cifrado en nuestra base de datos.</li>
              <li><strong style={{ color: '#e0e0f8' }}>Datos de campañas:</strong> descripciones de producto, textos generados por IA, presupuestos, resultados y métricas de rendimiento de tus campañas.</li>
              <li><strong style={{ color: '#e0e0f8' }}>Datos de uso:</strong> registros de acceso, acciones en la plataforma, créditos de IA consumidos.</li>
              <li><strong style={{ color: '#e0e0f8' }}>Datos de pago:</strong> procesados por terceros (Stripe/Mercado Pago). No almacenamos datos de tarjetas.</li>
            </ul>
          ))}

          {section('3. Cómo usamos los datos de Meta/Facebook', (
            <>
              <p style={{ marginBottom: 12 }}>Los permisos de Meta que solicitamos se usan exclusivamente para:</p>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong style={{ color: '#e0e0f8' }}>ads_management / ads_read:</strong> crear, pausar y leer el rendimiento de campañas en tu cuenta publicitaria.</li>
                <li><strong style={{ color: '#e0e0f8' }}>business_management:</strong> acceder a portafolios de negocio y cuentas publicitarias asociadas.</li>
                <li><strong style={{ color: '#e0e0f8' }}>pages_show_list / pages_read_engagement:</strong> listar tus páginas de Facebook para asociarlas a los anuncios.</li>
                <li><strong style={{ color: '#e0e0f8' }}>instagram_basic / instagram_manage_insights:</strong> conectar cuentas de Instagram para publicar y ver métricas.</li>
                <li><strong style={{ color: '#e0e0f8' }}>read_insights:</strong> obtener métricas de rendimiento (alcance, clics, conversiones).</li>
              </ul>
              <p style={{ marginTop: 12 }}>Nunca accedemos a datos personales de los seguidores de tus páginas ni a mensajes privados.</p>
            </>
          ))}

          {section('4. Cómo usamos tus datos en general', (
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Operar y mejorar la plataforma AdFlow.</li>
              <li>Generar copies, segmentaciones y estrategias de campaña con IA en tu nombre.</li>
              <li>Enviarte reportes de rendimiento configurados por vos.</li>
              <li>Gestionar tu plan, créditos y facturación.</li>
              <li>Responder consultas de soporte.</li>
            </ul>
          ))}

          {section('5. No vendemos tus datos', (
            <p>
              <strong style={{ color: '#06d6a0' }}>AdFlow no vende, alquila ni comparte tus datos personales ni los de tus campañas con terceros con fines comerciales.</strong>{' '}
              Solo compartimos información con proveedores de infraestructura necesarios para operar el servicio (Supabase para base de datos, Vercel para hosting, Anthropic para procesamiento de IA) bajo contratos de confidencialidad y procesamiento de datos.
            </p>
          ))}

          {section('6. Retención de datos', (
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Los tokens de Facebook se almacenan hasta que desconectás tu cuenta o solicitás la eliminación de datos.</li>
              <li>Los datos de campañas se conservan mientras tu cuenta esté activa.</li>
              <li>Al eliminar tu cuenta, eliminamos todos tus datos en un plazo máximo de 30 días.</li>
              <li>Los registros de auditoría pueden conservarse hasta 90 días por razones de seguridad.</li>
            </ul>
          ))}

          {section('7. Seguridad', (
            <p>
              Implementamos medidas técnicas estándar de la industria: cifrado en tránsito (TLS), almacenamiento seguro de credenciales, Row Level Security (RLS) en base de datos, y tokens OAuth con protección CSRF. Sin embargo, ningún sistema es 100% infalible y no podemos garantizar seguridad absoluta.
            </p>
          ))}

          {section('8. Tus derechos', (
            <>
              <p style={{ marginBottom: 12 }}>Tenés derecho a:</p>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong style={{ color: '#e0e0f8' }}>Acceder</strong> a los datos que tenemos sobre vos.</li>
                <li><strong style={{ color: '#e0e0f8' }}>Rectificar</strong> datos incorrectos desde tu perfil o contactándonos.</li>
                <li><strong style={{ color: '#e0e0f8' }}>Eliminar</strong> tu cuenta y todos tus datos enviando una solicitud a <a href="mailto:logisticaceoon@gmail.com" style={{ color: '#e91e8c' }}>logisticaceoon@gmail.com</a>.</li>
                <li><strong style={{ color: '#e0e0f8' }}>Desconectar Facebook</strong> en cualquier momento desde la configuración de tu cuenta, lo que revoca nuestro acceso a tu cuenta publicitaria.</li>
                <li><strong style={{ color: '#e0e0f8' }}>Revocar permisos de Meta</strong> directamente desde Configuración de Facebook → Aplicaciones y sitios web.</li>
              </ul>
            </>
          ))}

          {section('9. Cookies', (
            <p>
              Usamos cookies técnicas necesarias para el funcionamiento del servicio (autenticación de sesión, protección CSRF en el flujo OAuth de Meta). No usamos cookies de seguimiento ni publicidad de terceros.
            </p>
          ))}

          {section('10. Cambios a esta política', (
            <p>
              Podemos actualizar esta política ocasionalmente. Te notificaremos por email ante cambios materiales. El uso continuado de AdFlow después de la notificación implica aceptación.
            </p>
          ))}

          {section('11. Contacto', (
            <p>
              Para cualquier consulta sobre privacidad o para ejercer tus derechos, escribinos a{' '}
              <a href="mailto:logisticaceoon@gmail.com" style={{ color: '#e91e8c', fontWeight: 600 }}>logisticaceoon@gmail.com</a>.
              Nos comprometemos a responder en un plazo de 72 horas hábiles.
            </p>
          ))}
        </div>

        {/* Bottom links */}
        <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/terms" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
            Términos de Servicio →
          </Link>
          <span style={{ color: '#2a2a4a' }}>·</span>
          <Link href="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}
