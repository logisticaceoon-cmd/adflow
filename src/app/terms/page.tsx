// src/app/terms/page.tsx
import Link from 'next/link'
import { Zap, FileText, ArrowLeft } from 'lucide-react'

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

export default function TermsPage() {
  return (
    <div style={{
      background: 'linear-gradient(155deg, #0a0a0f 0%, #110228 45%, #0d0117 70%, #0a0a0f 100%)',
      minHeight: '100vh', color: '#fff',
    }}>
      {/* Orbs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(98,196,176,0.12) 0%, transparent 68%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-8%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,30,140,0.12) 0%, transparent 68%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.90)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, var(--ds-color-primary), var(--ds-color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>AdFlow</span>
          </Link>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
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
            background: 'rgba(98,196,176,0.10)', border: '1px solid rgba(98,196,176,0.25)',
          }}>
            <FileText size={13} color="#c4b5fd" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#c4b5fd' }}>
              Términos de Servicio
            </span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.5px' }}>
            Condiciones de uso
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Última actualización: Enero 2026 · AdFlow — Logisticaceoon
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

          {section('1. Descripción del servicio', (
            <p>
              AdFlow es una plataforma SaaS de publicidad digital operada por <strong style={{ color: '#e0e0f8' }}>Logisticaceoon</strong> que utiliza inteligencia artificial para ayudarte a crear, gestionar y optimizar campañas de publicidad en Facebook e Instagram Ads a través de la API de Meta. Al registrarte y usar AdFlow, aceptás estos Términos de Servicio en su totalidad.
            </p>
          ))}

          {section('2. Uso aceptable', (
            <>
              <p style={{ marginBottom: 12 }}>Al usar AdFlow te comprometés a:</p>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Proveer información veraz durante el registro y uso del servicio.</li>
                <li>Usar la plataforma únicamente con cuentas publicitarias de Meta de las que sos titular o tenés autorización expresa para administrar.</li>
                <li>No publicar anuncios que violen las <a href="https://www.facebook.com/policies/ads/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ds-color-primary)' }}>Políticas de publicidad de Meta</a>.</li>
                <li>No intentar revertir, copiar o extraer el código fuente de AdFlow.</li>
                <li>No usar la plataforma para fines ilegales, fraudulentos o que dañen a terceros.</li>
                <li>No compartir tus credenciales de acceso con otros usuarios.</li>
              </ul>
            </>
          ))}

          {section('3. Responsabilidad del usuario sobre las campañas', (
            <p>
              <strong style={{ color: '#f87171' }}>Vos sos el único responsable del contenido, segmentación, presupuesto y publicación de tus campañas publicitarias.</strong>{' '}
              AdFlow actúa como herramienta de asistencia; las sugerencias de la IA son orientativas y no constituyen asesoramiento legal, fiscal ni publicitario profesional. Revisá siempre los anuncios antes de publicarlos y asegurate de cumplir con las políticas de Meta y la legislación aplicable en tu país.
            </p>
          ))}

          {section('4. Planes y pagos', (
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>AdFlow ofrece un plan gratuito con créditos de IA limitados y planes pagos (Starter, Pro, Agencia) con mayores capacidades.</li>
              <li>Los créditos de IA se renuevan mensualmente según tu plan y no son acumulables ni transferibles.</li>
              <li>Los pagos se procesan a través de proveedores externos seguros. No almacenamos datos de tarjetas de crédito.</li>
              <li>Los planes pagos se facturan de forma recurrente (mensual o anual). Podés cancelar en cualquier momento; no se realizan reembolsos prorrateados salvo obligación legal.</li>
              <li>Nos reservamos el derecho de modificar los precios con 30 días de aviso previo por email.</li>
            </ul>
          ))}

          {section('5. Propiedad intelectual', (
            <>
              <p style={{ marginBottom: 10 }}>
                <strong style={{ color: '#e0e0f8' }}>De AdFlow:</strong> El software, diseño, marca y algoritmos de AdFlow son propiedad de Logisticaceoon y están protegidos por leyes de propiedad intelectual. No se te transfiere ningún derecho sobre ellos más allá del uso permitido en estos Términos.
              </p>
              <p>
                <strong style={{ color: '#e0e0f8' }}>De vos:</strong> Los datos de tu negocio, creativos e información de campañas que cargás en AdFlow siguen siendo de tu propiedad. Nos otorgás una licencia limitada para procesarlos con el único fin de prestar el servicio.
              </p>
            </>
          ))}

          {section('6. Limitación de responsabilidad', (
            <>
              <p style={{ marginBottom: 10 }}>
                AdFlow se provee "tal cual" y "según disponibilidad". No garantizamos resultados específicos de tus campañas publicitarias, ni que el servicio estará libre de errores o interrupciones.
              </p>
              <p>
                En la máxima medida permitida por la ley aplicable, Logisticaceoon no será responsable por daños indirectos, incidentales, lucro cesante, pérdida de datos o cualquier otro daño derivado del uso o imposibilidad de uso del servicio. Nuestra responsabilidad máxima total no excederá el monto abonado en los últimos 3 meses de servicio.
              </p>
            </>
          ))}

          {section('7. Disponibilidad del servicio', (
            <p>
              Nos esforzamos por mantener AdFlow disponible 24/7, pero no garantizamos una disponibilidad del 100%. Podemos realizar mantenimientos programados que podrían generar interrupciones breves. No somos responsables por interrupciones causadas por terceros (Meta, Supabase, Vercel, proveedores de internet).
            </p>
          ))}

          {section('8. Terminación de cuenta', (
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Podés cancelar tu cuenta en cualquier momento desde la configuración o escribiéndonos.</li>
              <li>Nos reservamos el derecho de suspender o terminar cuentas que violen estos Términos, con o sin previo aviso dependiendo de la gravedad.</li>
              <li>Al terminar la cuenta, se eliminan los datos según nuestra Política de Privacidad.</li>
              <li>Las obligaciones de pago pendientes sobreviven a la terminación.</li>
            </ul>
          ))}

          {section('9. Modificaciones', (
            <p>
              Podemos actualizar estos Términos. Te notificaremos por email con al menos 15 días de anticipación ante cambios materiales. El uso continuado del servicio después de la fecha efectiva implica aceptación de los nuevos términos.
            </p>
          ))}

          {section('10. Ley aplicable', (
            <p>
              Estos Términos se rigen por las leyes de la República Argentina. Cualquier disputa se someterá a los tribunales ordinarios competentes de la Ciudad Autónoma de Buenos Aires.
            </p>
          ))}

          {section('11. Contacto', (
            <p>
              Para consultas sobre estos Términos, contactanos en{' '}
              <a href="mailto:logisticaceoon@gmail.com" style={{ color: 'var(--ds-color-primary)', fontWeight: 600 }}>logisticaceoon@gmail.com</a>.
            </p>
          ))}
        </div>

        {/* Bottom links */}
        <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/privacy" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
            Política de Privacidad →
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
