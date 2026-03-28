'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Zap, Bot, BarChart3, TrendingUp, Target, RefreshCw,
  MessageSquare, Check, ChevronDown, Star, ArrowRight,
  Play, Menu, X, Clock, DollarSign, Rocket, Sparkles,
  Instagram, Phone, Facebook,
} from 'lucide-react'

// ─── Scroll fade-in hook ──────────────────────────────────────────────────────
function useFadeIn(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

const fi = (v: boolean) =>
  `transition-all duration-700 ease-out ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`

const gradientText: React.CSSProperties = {
  background: 'linear-gradient(135deg, #e91e8c, #c5006a)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

// ─── Orb (oscuro o claro según el color pasado) ───────────────────────────────
interface OrbProps {
  color: string
  size?: number
  top?: string | number
  left?: string | number
  right?: string | number
  bottom?: string | number
  opacity?: number
  blur?: number
}
function Orb({ color, size = 500, top, left, right, bottom, opacity = 0.2, blur = 80 }: OrbProps) {
  return (
    <div
      className="absolute rounded-full pointer-events-none flex-shrink-0"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
        top, left, right, bottom,
        filter: `blur(${blur}px)`,
        opacity,
      }}
    />
  )
}

// ─── Separador entre sección clara y oscura ───────────────────────────────────
function Divider() {
  return (
    <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, #e91e8c 30%, #62c4b0 70%, transparent 100%)', flexShrink: 0 }} />
  )
}

// ─── Orbs para secciones claras ───────────────────────────────────────────────
function LightOrbs({ variant }: { variant: number }) {
  if (variant === 1) return null // Trust bar: fondo blanco puro, sin orbs
  if (variant === 2) return ( // Problema: fucsia izquierda + púrpura derecha
    <>
      <Orb color="#e91e8c" size={520} top="5%" left="-10%" opacity={0.22} blur={65} />
      <Orb color="#62c4b0" size={460} top="5%" right="-10%" opacity={0.18} blur={75} />
    </>
  )
  if (variant === 3) return null // Demo: solo gradiente de fondo, sin orbs
  if (variant === 4) return ( // Testimonios: orb púrpura centrado arriba
    <Orb color="#62c4b0" size={700} top="-20%" left="calc(50% - 350px)" opacity={0.18} blur={90} />
  )
  return null
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ children, color = '#e91e8c', light = false }: { children: React.ReactNode; color?: string; light?: boolean }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
      style={
        light
          ? { background: `${color}14`, border: `1px solid ${color}30`, color }
          : { background: `${color}18`, border: `1px solid ${color}35`, color }
      }
    >
      {children}
    </div>
  )
}

// ─── Card styles ──────────────────────────────────────────────────────────────
// Oscuro (glassmorphism)
const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.1)',
}
const glassHover = {
  enter: (el: HTMLElement) => { el.style.background = 'rgba(255,255,255,0.09)'; el.style.borderColor = 'rgba(255,255,255,0.18)'; el.style.transform = 'translateY(-4px)' },
  leave: (el: HTMLElement) => { el.style.background = 'rgba(255,255,255,0.05)'; el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.transform = 'translateY(0)' },
}

// Claro (blanco con sombra fucsia)
const lightCard: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(233,30,140,0.15)',
  boxShadow: '0 4px 24px rgba(233,30,140,0.07)',
}
const lightCardHover = {
  enter: (el: HTMLElement) => { el.style.boxShadow = '0 12px 40px rgba(233,30,140,0.13)'; el.style.borderColor = 'rgba(233,30,140,0.28)'; el.style.transform = 'translateY(-4px)' },
  leave: (el: HTMLElement) => { el.style.boxShadow = '0 4px 24px rgba(233,30,140,0.07)'; el.style.borderColor = 'rgba(233,30,140,0.15)'; el.style.transform = 'translateY(0)' },
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(18,17,42,0.97)' : 'rgba(18,17,42,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #e91e8c, #c5006a)' }}>
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-display text-xl font-bold text-white">AdFlow</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {[['#features', 'Características'], ['#pricing', 'Precios'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={label} href={href} className="text-sm font-medium transition-colors duration-150"
              style={{ color: '#94a3b8' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 border"
            style={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent', minHeight: 44 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}>
            Iniciar sesión
          </Link>
          <Link href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150"
            style={{ background: 'linear-gradient(135deg, #e91e8c, #c5006a)', boxShadow: '0 0 16px rgba(233,30,140,0.4)', minHeight: 44 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.12)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none' }}>
            Probar gratis
          </Link>
        </div>

        <button className="md:hidden p-2 rounded-lg" style={{ color: '#94a3b8' }}
          onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="md:hidden overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? 280 : 0, background: 'rgba(18,17,42,0.99)', borderTop: open ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
        <div className="px-5 py-4 flex flex-col gap-1">
          {[['#features', 'Características'], ['#pricing', 'Precios'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={label} href={href} className="py-3 text-sm font-medium border-b"
              style={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.06)' }}
              onClick={() => setOpen(false)}>{label}</a>
          ))}
          <div className="flex gap-3 pt-4">
            <Link href="/login" onClick={() => setOpen(false)}
              className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold border"
              style={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)', minHeight: 44 }}>Iniciar sesión</Link>
            <Link href="/login" onClick={() => setOpen(false)}
              className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #e91e8c, #c5006a)', minHeight: 44 }}>Probar gratis</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ─── 1. Hero (OSCURO) ─────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-28 pb-24 overflow-hidden"
      style={{ background: 'linear-gradient(155deg, #0a0a0f 0%, #110228 45%, #0d0117 70%, #0a0a0f 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Orb color="#e91e8c" size={700} top="-15%" right="-8%" opacity={0.18} blur={45} />
        <Orb color="#62c4b0" size={550} bottom="-5%" left="-8%" opacity={0.14} blur={60} />
        <Orb color="#06d6a0" size={300} top="40%" left="42%" opacity={0.07} blur={50} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%,black 30%,transparent 100%)',
        }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full">
        <div className="badge-glow mb-7">
          <Sparkles className="w-3.5 h-3.5" />
          ✨ Potenciado por IA — Claude + Meta API
        </div>

        <h1 className="font-display font-extrabold leading-none mb-6 px-2"
          style={{ fontSize: 'clamp(34px, 6vw, 82px)', letterSpacing: '-2px' }}>
          Crea campañas de{' '}
          <span className="gradient-text-hero">Facebook Ads</span>
          {' '}que convierten,{' '}
          <span style={{ background: 'linear-gradient(135deg,#f9a8d4,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            en minutos
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed px-2" style={{ color: '#94a3b8' }}>
          Describí tu producto, conectá tu cuenta de Meta y dejá que la IA genere copies, segmentaciones y publique por vos.
          Sin agencias, sin costos exorbitantes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-16 px-4">
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all duration-150"
            style={{ background: 'linear-gradient(135deg,#e91e8c,#c5006a)', boxShadow: '0 0 28px rgba(233,30,140,0.4)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 42px rgba(233,30,140,0.65)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 28px rgba(233,30,140,0.4)' }}>
            <Rocket className="w-4 h-4" /> Empezar gratis
          </Link>
          <a href="#demo"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-150"
            style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}>
            <Play className="w-4 h-4 fill-current" /> Ver demo
          </a>
        </div>

        {/* Dashboard mockup */}
        <div className="relative mx-auto max-w-4xl hidden sm:block float-anim">
          <div className="absolute inset-x-16 -bottom-10 h-28 rounded-full blur-3xl" style={{ background: 'linear-gradient(90deg,#e91e8c,#c5006a)', opacity: 0.38 }} />
          <div className="absolute -inset-px rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.50), rgba(98,196,176,0.30), rgba(233,30,140,0.20))', borderRadius: 18, zIndex: -1 }} />
          <div className="relative rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #0e0c1c, #0a0a16)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 60px 120px rgba(0,0,0,0.90), 0 0 100px rgba(233,30,140,0.12), 0 0 60px rgba(98,196,176,0.06)' }}>
            {/* Scan line effect */}
            <div className="scan-line" />
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: 'rgba(8,8,20,0.95)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57', boxShadow: '0 0 6px rgba(255,95,87,0.5)' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e', boxShadow: '0 0 6px rgba(255,189,46,0.4)' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#28c840', boxShadow: '0 0 6px rgba(40,200,64,0.4)' }} />
              <div className="flex-1 mx-4 py-1.5 px-3 rounded-lg text-xs text-center" style={{ background: 'rgba(255,255,255,0.06)', color: '#8892b0', border: '1px solid rgba(255,255,255,0.06)' }}>app.adflow.ai/dashboard</div>
            </div>
            <div className="p-5 grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                {[{ label: 'Dashboard', active: true }, { label: 'Campañas', active: false }, { label: 'Creatividades', active: false }, { label: 'Reportes', active: false }].map(({ label, active }) => (
                  <div key={label} className="px-3 py-2 rounded-lg text-xs" style={{ background: active ? 'rgba(233,30,140,0.15)' : 'transparent', color: active ? '#f9a8d4' : '#8892b0', borderLeft: active ? '3px solid #e91e8c' : '3px solid transparent', boxShadow: active ? '0 0 12px rgba(233,30,140,0.12)' : 'none' }}>
                    {label}
                  </div>
                ))}
              </div>
              <div className="col-span-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[{ label: 'ROAS', value: '4.2x', color: '#06d6a0' }, { label: 'Alcance', value: '48.2K', color: '#62c4b0' }, { label: 'Conversiones', value: '328', color: '#e91e8c' }].map(({ label, value, color }) => (
                    <div key={label} className="p-3 rounded-xl" style={{ background: 'linear-gradient(160deg, rgba(18,14,28,0.90), rgba(10,10,20,0.96))', border: `1px solid ${color}22`, boxShadow: `0 0 20px ${color}12` }}>
                      <div className="text-xs mb-1" style={{ color: '#8892b0' }}>{label}</div>
                      <div className="text-xl font-bold" style={{ color, textShadow: `0 0 12px ${color}80` }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(160deg, rgba(18,14,28,0.90), rgba(10,10,20,0.96))', border: '1px solid rgba(233,30,140,0.12)', height: 88 }}>
                  <div className="flex items-end gap-1.5 h-full pb-1">
                    {[35, 52, 41, 68, 58, 80, 92, 72, 85, 91, 75, 98].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: 'linear-gradient(to top,#e91e8c,#c5006a)', opacity: 0.50 + (i / 12) * 0.50, boxShadow: i >= 10 ? '0 0 6px rgba(233,30,140,0.40)' : 'none' }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {[{ name: 'Campaña Verano 2024', status: 'Activa', statusColor: '#06d6a0', roas: '4.2x' }, { name: 'Retargeting Premium', status: 'Pausada', statusColor: '#f59e0b', roas: '3.1x' }].map(({ name, status, statusColor, roas }) => (
                    <div key={name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                      <div className="text-xs flex-1" style={{ color: '#94a3b8' }}>{name}</div>
                      <div className="text-xs font-semibold" style={{ color: statusColor }}>{status}</div>
                      <div className="text-xs" style={{ color: '#8892b0' }}>ROAS {roas}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile stats */}
        <div className="sm:hidden flex justify-center gap-8 mt-4">
          {[{ num: '4.2x', label: 'ROAS', color: '#06d6a0' }, { num: '8 min', label: 'Primera campaña', color: '#e91e8c' }, { num: '+500', label: 'Empresas', color: '#62c4b0' }].map(({ num, label, color }) => (
            <div key={label} className="text-center">
              <div className="font-display font-extrabold text-2xl" style={{ color }}>{num}</div>
              <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ opacity: 0.35 }}>
        <div className="w-5 h-8 rounded-full border flex justify-center pt-1.5" style={{ borderColor: '#2d2d3e' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#475569' }} />
        </div>
      </div>
    </section>
  )
}

// ─── 2. Trust bar (OSCURO vibrante) ───────────────────────────────────────────
function TrustSection() {
  const { ref, visible } = useFadeIn()
  return (
    <section className="relative overflow-hidden" style={{ background: '#0f0f1f' }}>
      <div className="absolute inset-0 pointer-events-none">
        <Orb color="#e91e8c" size={400} top="-30%" left="-5%" opacity={0.18} blur={80} />
        <Orb color="#62c4b0" size={350} top="-20%" right="-5%" opacity={0.15} blur={80} />
      </div>
      <div ref={ref} className={`relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-14 text-center ${fi(visible)}`}>
        <p className="text-xs font-bold tracking-widest uppercase mb-9" style={{ color: '#8892b0' }}>
          Usado por agencias en más de 10 países · Integrado con
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          <div className="flex items-center gap-2.5 transition-opacity duration-200" style={{ opacity: 0.65 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.65')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-base"
              style={{ background: 'linear-gradient(135deg,#0081fb,#0064d2)', boxShadow: '0 0 12px rgba(0,129,251,0.35)' }}>f</div>
            <span className="font-semibold text-lg text-white">Meta</span>
          </div>
          <div className="flex items-center gap-2.5 transition-opacity duration-200" style={{ opacity: 0.65 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.65')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', boxShadow: '0 0 12px rgba(220,39,67,0.35)' }}>
              <Instagram className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-white">Instagram</span>
          </div>
          <div className="flex items-center gap-2.5 transition-opacity duration-200" style={{ opacity: 0.65 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.65')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#25d366,#128c7e)', boxShadow: '0 0 12px rgba(37,211,102,0.35)' }}>
              <Phone className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-white">WhatsApp</span>
          </div>

          <div className="hidden md:block w-px h-8" style={{ background: 'rgba(233,30,140,0.3)' }} />

          {[{ num: '+340%', label: 'ROI promedio' }, { num: '8 min', label: 'Primera campaña' }, { num: '+500', label: 'Empresas activas' }].map(({ num, label }) => (
            <div key={label} className="text-center">
              <div className="font-bold text-xl" style={gradientText}>{num}</div>
              <div className="text-xs mt-0.5" style={{ color: '#8892b0' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 3a. Problem (OSCURO vibrante) ────────────────────────────────────────────
function ProblemSection() {
  const { ref, visible } = useFadeIn()
  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f0f1f 0%, #1a0a2e 50%, #0f0f1f 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <Orb color="#e91e8c" size={650} top="-5%" left="-10%" opacity={0.35} blur={70} />
        <Orb color="#62c4b0" size={600} bottom="-5%" right="-10%" opacity={0.30} blur={80} />
        <Orb color="#f472b6" size={300} top="50%" left="40%" opacity={0.15} blur={60} />
      </div>

      <div ref={ref} className={`relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-24 pb-16 sm:pt-28 sm:pb-20 ${fi(visible)}`}>
        <div className="text-center mb-14">
          <Badge color="#e91e8c">El problema</Badge>
          <h2 className="font-display font-extrabold text-fluid-3xl mb-5 text-white" style={{ letterSpacing: '-1.5px' }}>
            ¿Cuánto tiempo perdés creando{' '}
            <span style={gradientText}>ads manualmente?</span>
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: '#94a3b8' }}>
            La mayoría de los negocios pierde más de 8 horas semanales en publicidad sin ver resultados consistentes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {[
            { icon: Clock, title: 'Demasiado tiempo', desc: 'Escribís copies durante horas que terminan sin convertir, sin saber por qué.', color: '#e91e8c' },
            { icon: DollarSign, title: 'Costos de agencia', desc: 'Pagás fortunas a agencias que no conocen tu negocio y no rinden cuentas.', color: '#f59e0b' },
            { icon: BarChart3, title: 'Sin visibilidad', desc: 'No sabés qué campañas fallan hasta que ya gastaste todo tu presupuesto.', color: '#62c4b0' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="feature-card p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 hover:scale-110"
                style={{ background: `${color}18`, border: `1px solid ${color}30`, boxShadow: `0 0 20px ${color}20` }}>
                <Icon className="w-6 h-6" style={{ color, filter: `drop-shadow(0 0 4px ${color}80)` }} />
              </div>
              <h3 className="font-bold mb-2 text-white">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8892b0' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 3b. Solution (OSCURO vibrante — azul-púrpura) ───────────────────────────
function SolutionSection() {
  const { ref, visible } = useFadeIn()
  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0f1f 0%, #0d1535 50%, #0f0f1f 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <Orb color="#e91e8c" size={650} top="10%" left="calc(50% - 325px)" opacity={0.30} blur={90} />
        <Orb color="#62c4b0" size={400} bottom="-5%" left="-8%" opacity={0.25} blur={75} />
        <Orb color="#e91e8c" size={350} top="-5%" right="-8%" opacity={0.20} blur={75} />
      </div>

      <div ref={ref} className={`relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-24 sm:pt-20 sm:pb-28 ${fi(visible)}`}>
        {/* Bridge */}
        <div className="flex flex-col items-center gap-3 mb-14">
          <div className="w-px h-12" style={{ background: 'linear-gradient(to bottom,transparent,#e91e8c)' }} />
          <div className="px-6 py-3 rounded-full font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,rgba(233,30,140,0.18),rgba(98,196,176,0.12))', border: '1px solid rgba(233,30,140,0.35)', color: '#f9a8d4' }}>
            ✨ AdFlow lo hace por vos
          </div>
          <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom,#e91e8c,transparent)' }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {[
            { icon: Bot, title: 'IA genera copies', desc: 'Copies persuasivos adaptados a tu marca, optimizados para conversión, en segundos.' },
            { icon: Zap, title: 'Publica automáticamente', desc: 'Conectá tu Meta y la IA publica campañas optimizadas directamente en tu cuenta.' },
            { icon: TrendingUp, title: 'Reportes en tiempo real', desc: 'Dashboards con recomendaciones de IA cada día para maximizar tu ROAS.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 hover:scale-110"
                style={{ background: 'linear-gradient(135deg,#e91e8c,#c5006a)', boxShadow: '0 0 24px rgba(233,30,140,0.40)' }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8892b0' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 4. Features (OSCURO) ─────────────────────────────────────────────────────
function FeaturesSection() {
  const { ref, visible } = useFadeIn()
  const features = [
    { icon: Bot, title: 'IA genera copies profesionales', desc: 'Copies persuasivos adaptados a tu tono de marca en segundos, optimizados para cada formato de Meta.', color: '#e91e8c' },
    { icon: Facebook, title: 'Conecta Facebook Ads directo', desc: 'Integración oficial con Meta Business Manager. Publicá y gestioná campañas sin salir de AdFlow.', color: '#60a5fa' },
    { icon: BarChart3, title: 'Reportes diarios automáticos', desc: 'Recibí cada mañana un resumen con métricas clave y recomendaciones de IA para optimizar tu inversión.', color: '#06d6a0' },
    { icon: Target, title: 'Públicos sugeridos por IA', desc: 'Describí tu producto y la IA crea audiencias precisas: intereses, comportamientos y lookalikes.', color: '#62c4b0' },
    { icon: RefreshCw, title: 'A/B testing automático', desc: 'La IA genera variantes y las prueba automáticamente, escalando el presupuesto hacia lo que convierte.', color: '#f59e0b' },
    { icon: MessageSquare, title: 'CTAs con WhatsApp', desc: 'Conectá tus ads directamente con WhatsApp Business para cerrar ventas en el momento.', color: '#34d399' },
  ]

  return (
    <section id="features" className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f0f1f 0%, #160f2a 50%, #0f0f1f 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <Orb color="#e91e8c" size={700} top="-5%" right="-10%" opacity={0.25} blur={90} />
        <Orb color="#e91e8c" size={500} bottom="0%" left="-8%" opacity={0.20} blur={90} />
        <Orb color="#f472b6" size={300} top="50%" left="40%" opacity={0.15} blur={70} />
      </div>
      <div ref={ref} className={`relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-28 ${fi(visible)}`}>
        <div className="text-center mb-14">
          <Badge color="#62c4b0">Características</Badge>
          <h2 className="font-display font-extrabold text-fluid-3xl mb-5 text-white" style={{ letterSpacing: '-1.5px' }}>
            Todo lo que necesitás para{' '}
            <span style={gradientText}>escalar tus ads</span>
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: '#94a3b8' }}>
            Una plataforma completa para crear, gestionar y optimizar campañas de Facebook Ads con IA.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="feature-card p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-200 hover:scale-110"
                style={{ background: `${color}18`, border: `1px solid ${color}35`, boxShadow: `0 0 22px ${color}25` }}>
                <Icon className="w-6 h-6" style={{ color, filter: `drop-shadow(0 0 5px ${color}90)` }} />
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8892b0' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 5. How it works (OSCURO) ─────────────────────────────────────────────────
function HowItWorksSection() {
  const { ref, visible } = useFadeIn()
  const steps = [
    { num: '01', title: 'Conectá tu Facebook Ads', desc: 'Autenticá tu cuenta de Meta en un clic. AdFlow se conecta con tu Business Manager de forma segura vía OAuth oficial.', icon: Facebook },
    { num: '02', title: 'Describí tu producto', desc: 'Completá un formulario simple: qué vendés, tu público ideal y cuánto querés gastar. La IA hace el resto.', icon: Sparkles },
    { num: '03', title: 'La IA crea y publica', desc: 'En minutos tenés copies profesionales, audiencias definidas y tu campaña activa publicada en Meta Ads.', icon: Rocket },
  ]

  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f0f1f 0%, #1a0830 50%, #0f0f1f 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <Orb color="#62c4b0" size={700} top="5%" left="calc(50% - 350px)" opacity={0.35} blur={90} />
        <Orb color="#e91e8c" size={400} top="0%" left="-8%" opacity={0.22} blur={80} />
        <Orb color="#e91e8c" size={400} bottom="-10%" right="-5%" opacity={0.20} blur={80} />
      </div>
      <div ref={ref} className={`relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-24 sm:py-28 ${fi(visible)}`}>
        <div className="text-center mb-16 sm:mb-20">
          <Badge color="#06d6a0">Cómo funciona</Badge>
          <h2 className="font-display font-extrabold text-fluid-3xl text-white" style={{ letterSpacing: '-1.5px' }}>
            De cero a campaña activa{' '}
            <span style={{ background: 'linear-gradient(135deg,#62c4b0,#e91e8c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              en 3 pasos
            </span>
          </h2>
        </div>
        <div className="relative">
          <div className="absolute hidden md:block h-px top-8"
            style={{ left: '18%', right: '18%', background: 'linear-gradient(90deg,transparent 0%,#e91e8c 30%,#62c4b0 70%,transparent 100%)', opacity: 0.35 }} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
            {steps.map(({ num, title, desc, icon: Icon }, i) => (
              <div key={num} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 z-10 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#e91e8c,#c5006a)', boxShadow: `0 0 ${24 + i * 8}px rgba(233,30,140,${0.35 + i * 0.05})` }}>
                  <span className="font-display font-extrabold text-2xl text-white">{num}</span>
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ ...glass }}>
                  <Icon className="w-5 h-5" style={{ color: '#94a3b8' }} />
                </div>
                <h3 className="font-bold text-xl text-white mb-3">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Franja persuasiva full-width */}
      <div className="relative w-full py-4 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, #c2185b 0%, #e91e8c 35%, #62c4b0 65%, #3a9a8a 100%)',
          boxShadow: '0 0 50px rgba(233,30,140,0.45), 0 0 100px rgba(98,196,176,0.15)',
        }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.07) 1px,transparent 1px)',
          backgroundSize: '32px 32px', opacity: 0.5,
        }} />
        <p className="relative font-bold text-white text-base sm:text-lg md:text-xl tracking-tight px-4">
          ⚡ Aumentá tu facturación en menos de 5 minutos — Empezá gratis hoy
        </p>
      </div>
    </section>
  )
}

// ─── 6. Demo (CLARO con orbs) ─────────────────────────────────────────────────
function DemoSection() {
  const [activeTab, setActiveTab] = useState(0)
  const { ref, visible } = useFadeIn()
  const tabs = ['1. Describís', '2. IA genera', '3. Publicás']

  const content = [
    {
      title: 'Describís tu producto',
      desc: 'Completás un formulario simple: qué vendés, tu público ideal, presupuesto y objetivo de campaña.',
      mock: (
        <div className="space-y-3">
          {[
            { label: '¿Qué vendés?', value: 'Curso online de fotografía para principiantes' },
            { label: 'Público objetivo', value: 'Personas 25-45 años, interesadas en fotografía' },
            { label: 'Presupuesto diario', value: '$20 USD / día' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs mb-1 font-medium" style={{ color: '#94a3b8' }}>{label}</div>
              <div className="p-2.5 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(233,30,140,0.20)', color: '#e2e8f0' }}>{value}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'La IA crea tu campaña',
      desc: 'En segundos, la IA genera copies persuasivos, elige audiencias precisas y configura toda la campaña.',
      mock: (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border-l-2" style={{ background: 'rgba(233,30,140,0.12)', borderColor: '#e91e8c' }}>
            <div className="text-xs mb-1.5 font-semibold" style={{ color: '#f9a8d4' }}>Copy generado por IA</div>
            <p className="text-sm" style={{ color: '#e2e8f0' }}>¿Siempre quisiste tomar fotos profesionales? Aprendé desde casa y sorprendé a todos. +500 alumnos ya lo lograron.</p>
          </div>
          <div className="p-3 rounded-lg border-l-2" style={{ background: 'rgba(98,196,176,0.10)', borderColor: '#62c4b0' }}>
            <div className="text-xs mb-1.5 font-semibold" style={{ color: '#c4b5fd' }}>Audiencia sugerida</div>
            <p className="text-sm" style={{ color: '#e2e8f0' }}>Fotografía, Diseño, Arte · 25-45 años · LATAM</p>
          </div>
          <div className="p-3 rounded-lg border-l-2" style={{ background: 'rgba(6,214,160,0.10)', borderColor: '#06d6a0' }}>
            <div className="text-xs mb-1.5 font-semibold" style={{ color: '#6ee7b7' }}>Variante A/B lista</div>
            <p className="text-sm" style={{ color: '#e2e8f0' }}>2 versiones del copy para testear automáticamente</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Publicás con un clic',
      desc: 'Revisás la campaña generada, aprobás y AdFlow la publica directo en tu cuenta de Meta Ads.',
      mock: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(233,30,140,0.20)' }}>
            <span className="text-sm" style={{ color: '#e2e8f0' }}>Campaña &quot;Curso Fotografía&quot;</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(6,214,160,0.18)', color: '#6ee7b7' }}>Lista ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(233,30,140,0.20)' }}>
            <span className="text-sm" style={{ color: '#e2e8f0' }}>Presupuesto: $20/día</span>
            <span className="text-xs" style={{ color: '#94a3b8' }}>~800 alcance/día</span>
          </div>
          <button className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#e91e8c,#c5006a)', boxShadow: '0 0 20px rgba(233,30,140,0.3)', minHeight: 44 }}>
            <Rocket className="w-4 h-4" /> Publicar campaña ahora
          </button>
        </div>
      ),
    },
  ]

  return (
    <section id="demo" className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0f1f 0%, #150d28 50%, #0f0f1f 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <Orb color="#f472b6" size={600} top="0%" left="-8%" opacity={0.30} blur={85} />
        <Orb color="#62c4b0" size={550} bottom="-5%" right="-8%" opacity={0.25} blur={85} />
        <Orb color="#e91e8c" size={300} top="50%" left="45%" opacity={0.18} blur={65} />
      </div>

      <div ref={ref} className={`relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-24 sm:py-28 ${fi(visible)}`}>
        <div className="text-center mb-12">
          <Badge color="#62c4b0">Demo interactivo</Badge>
          <h2 className="font-display font-extrabold text-fluid-3xl mb-4 text-white" style={{ letterSpacing: '-1.5px' }}>
            Mirá cómo funciona{' '}
            <span style={gradientText}>en vivo</span>
          </h2>
          <p className="text-base sm:text-lg" style={{ color: '#cbd5e1' }}>
            Del formulario a campaña activa en minutos, sin complicaciones.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1.5 rounded-2xl max-w-xs mx-auto"
          style={{ background: 'rgba(233,30,140,0.10)', border: '1px solid rgba(233,30,140,0.25)' }}>
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: activeTab === i ? 'linear-gradient(135deg,#e91e8c,#c5006a)' : 'transparent',
                color: activeTab === i ? '#fff' : '#94a3b8',
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Browser frame */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(233,30,140,0.30)', boxShadow: '0 0 50px rgba(233,30,140,0.15), 0 20px 60px rgba(0,0,0,0.4)' }}>
          {/* Browser bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(233,30,140,0.20)' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
            <div className="flex-1 mx-4 py-1 px-3 rounded text-xs text-center"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#8892b0', border: '1px solid rgba(255,255,255,0.08)' }}>
              app.adflow.ai/create
            </div>
          </div>
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h3 className="font-bold text-xl mb-3 text-white">{content[activeTab].title}</h3>
              <p className="text-sm mb-7 leading-relaxed" style={{ color: '#cbd5e1' }}>{content[activeTab].desc}</p>
              <div className="flex gap-3 flex-wrap">
                {activeTab > 0 && (
                  <button onClick={() => setActiveTab(activeTab - 1)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', minHeight: 44 }}>
                    ← Anterior
                  </button>
                )}
                {activeTab < 2 ? (
                  <button onClick={() => setActiveTab(activeTab + 1)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150"
                    style={{ background: 'linear-gradient(135deg,#e91e8c,#c5006a)', minHeight: 44 }}>
                    Siguiente →
                  </button>
                ) : (
                  <Link href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#e91e8c,#c5006a)', minHeight: 44 }}>
                    Probalo gratis →
                  </Link>
                )}
              </div>
            </div>
            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
              {content[activeTab].mock}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 7. Testimonials (OSCURO azul-oscuro con orbs púrpura/azul) ───────────────
function TestimonialsSection() {
  const { ref, visible } = useFadeIn()
  const testimonials = [
    { name: 'Valentina R.', role: 'Directora de Marketing · Agencia Nube', text: 'Pasamos de gastar 12 horas semanales en ads a menos de 2. Los copies de la IA superan los nuestros. Nuestro ROAS mejoró un 280% en el primer mes.', result: 'ROAS 4.2x', avatar: 'VR', color: '#e91e8c' },
    { name: 'Carlos M.', role: 'Emprendedor · E-commerce de ropa', text: 'Probé muchas herramientas pero ninguna tan completa. En mi primera semana ya tenía campaña activa con resultados reales. Lo recomiendo al 100%.', result: '+180% ventas', avatar: 'CM', color: '#62c4b0' },
    { name: 'Lucía F.', role: 'CEO · Academia Online', text: 'El A/B testing automático es increíble. AdFlow descubrió copies que yo jamás hubiera probado y triplicó mis conversiones sin aumentar el presupuesto.', result: '3x conversiones', avatar: 'LF', color: '#059669' },
  ]

  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f0f1f 0%, #0a1025 50%, #0f0f1f 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <Orb color="#e91e8c" size={650} top="-5%" left="-10%" opacity={0.35} blur={90} />
        <Orb color="#e91e8c" size={500} bottom="0%" right="-8%" opacity={0.20} blur={80} />
        <Orb color="#06b6d4" size={350} top="50%" left="40%" opacity={0.18} blur={70} />
      </div>

      <div ref={ref} className={`relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-28 ${fi(visible)}`}>
        <div className="text-center mb-14">
          <Badge color="#62c4b0">Testimonios</Badge>
          <h2 className="font-display font-extrabold text-fluid-3xl text-white" style={{ letterSpacing: '-1.5px' }}>
            Lo que dicen nuestros{' '}
            <span style={gradientText}>clientes</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map(({ name, role, text, result, avatar, color }) => (
            <div key={name} className="glass-card p-7 flex flex-col">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: '#94a3b8' }}>&quot;{text}&quot;</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${color},${color}99)` }}>
                    {avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">{name}</div>
                    <div className="text-xs" style={{ color: '#8892b0' }}>{role}</div>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ml-2"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}>
                  {result}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 8. Pricing (OSCURO) ─────────────────────────────────────────────────────
function PricingSection() {
  const { ref, visible } = useFadeIn()
  const plans = [
    {
      name: 'Free', price: 0, credits: 10,
      desc: 'Para explorar la plataforma y probar la generación IA antes de escalar.',
      creditLabel: '10 créditos / mes',
      features: [
        '10 generaciones IA completas',
        'Copies + segmentación por campaña',
        'Conexión con Meta Ads',
        'Reportes de rendimiento',
        'Soporte por email',
      ],
      cta: 'Empezar gratis', popular: false, accentColor: '#62c4b0',
    },
    {
      name: 'Starter', price: 19, credits: 100,
      desc: 'Para emprendedores con actividad mensual recurrente de publicidad.',
      creditLabel: '100 créditos / mes',
      features: [
        '100 generaciones IA completas',
        'Copies + segmentación por campaña',
        'Conexión con Meta Ads',
        'Reportes diarios con IA',
        'Soporte prioritario',
      ],
      cta: 'Empezar con Starter', popular: false, accentColor: '#f472b6',
    },
    {
      name: 'Pro', price: 49, credits: 400,
      desc: 'Para negocios en crecimiento con mayor volumen de creación y testeo.',
      creditLabel: '400 créditos / mes',
      features: [
        '400 generaciones IA completas',
        'Copies + segmentación por campaña',
        'Conexión con Meta Ads',
        'Reportes diarios + análisis avanzado',
        'Soporte prioritario',
      ],
      cta: 'Empezar con Pro', popular: true, accentColor: '#e91e8c',
    },
    {
      name: 'Agencia', price: 99, credits: 1000,
      desc: 'Para agencias y equipos que gestionan múltiples marcas y cuentas.',
      creditLabel: '1000 créditos / mes',
      features: [
        '1000 generaciones IA completas',
        'Copies + segmentación por campaña',
        'Gestión multi-cuenta',
        'Reportes diarios con IA',
        'Onboarding dedicado · soporte 24/7',
      ],
      cta: 'Contactar ventas', popular: false, accentColor: '#f59e0b',
    },
  ]

  return (
    <section id="pricing" className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f0f1f 0%, #1a0a28 50%, #0f0f1f 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <Orb color="#e91e8c" size={650} top="-5%" left="-5%" opacity={0.30} blur={90} />
        <Orb color="#62c4b0" size={700} top="20%" left="calc(50% - 350px)" opacity={0.30} blur={100} />
        <Orb color="#e91e8c" size={550} bottom="-10%" right="-5%" opacity={0.25} blur={90} />
      </div>
      <div ref={ref} className={`relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-28 ${fi(visible)}`}>
        <div className="text-center mb-14">
          <Badge color="#c4b5fd">Precios</Badge>
          <h2 className="font-display font-extrabold text-fluid-3xl mb-5 text-white" style={{ letterSpacing: '-1.5px' }}>
            El plan correcto para{' '}
            <span style={gradientText}>tu volumen</span>
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: '#94a3b8' }}>
            Cada plan incluye créditos mensuales para generación IA. Sin contratos. Cancelá cuando quieras.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-5 items-start">
          {plans.map(({ name, price, credits, creditLabel, desc, features, cta, popular, accentColor }) => (
            <div key={name} className="rounded-2xl relative transition-all duration-200"
              style={{
                ...(popular
                  ? {
                      background: 'rgba(255,255,255,0.10)',
                      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                      border: `1.5px solid ${accentColor}60`,
                      boxShadow: `0 0 56px ${accentColor}28, 0 20px 48px rgba(0,0,0,0.50)`,
                    }
                  : { ...glass }),
                padding: popular ? '40px 28px 28px' : '28px',
                marginTop: popular ? 0 : 12,
              }}
              onMouseEnter={e => { if (!popular) glassHover.enter(e.currentTarget as HTMLElement) }}
              onMouseLeave={e => { if (!popular) glassHover.leave(e.currentTarget as HTMLElement) }}>
              {popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg,#e91e8c,#c5006a)', color: '#fff', boxShadow: '0 4px 20px rgba(233,30,140,0.50)' }}>
                  ⭐ Más popular
                </div>
              )}
              {/* Top border accent for popular */}
              {popular && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1, borderRadius: '16px 16px 0 0',
                  background: 'linear-gradient(90deg, transparent, rgba(233,30,140,0.70), rgba(98,196,176,0.40), transparent)',
                  pointerEvents: 'none',
                }} />
              )}
              <h3 className="font-bold text-xl text-white mb-1">{name}</h3>
              <p className="text-xs mb-5 leading-relaxed" style={{ color: '#8892b0' }}>{desc}</p>

              {/* Price */}
              <div className="flex items-end gap-1 mb-5">
                {price === 0 ? (
                  <span className="font-display font-extrabold text-4xl text-white">Gratis</span>
                ) : (
                  <>
                    <span style={{ fontSize: 13, color: '#8892b0', paddingBottom: 6 }}>USD</span>
                    <span className="font-display font-extrabold text-5xl text-white" style={{ letterSpacing: '-2px' }}>{price}</span>
                    <span className="text-sm pb-2" style={{ color: '#8892b0' }}>/mes</span>
                  </>
                )}
              </div>

              {/* Credits highlight */}
              <div className="rounded-xl px-3 py-2.5 mb-5" style={{
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}28`,
              }}>
                <span className="font-extrabold text-lg" style={{ color: accentColor, letterSpacing: '-0.03em' }}>{credits}</span>
                <span className="text-xs ml-1.5" style={{ color: '#8892b0' }}>créditos IA / mes</span>
                <p className="text-[10px] mt-0.5" style={{ color: '#8892b0' }}>
                  {credits === 10 ? 'Para explorar la plataforma' :
                   credits === 100 ? 'Para uso frecuente y recurrente' :
                   credits === 400 ? 'Para mayor volumen de creación' :
                   'Para operaciones de alto volumen'}
                </p>
              </div>

              <ul className="space-y-2.5 mb-7">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-xs" style={{ color: '#94a3b8' }}>
                    <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login"
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-150"
                style={popular
                  ? { background: 'linear-gradient(135deg,#e91e8c,#c5006a)', color: '#fff', boxShadow: '0 0 24px rgba(233,30,140,0.40)', minHeight: 44 }
                  : { background: 'rgba(255,255,255,0.07)', border: `1px solid ${accentColor}33`, color: accentColor, minHeight: 44 }}>
                {cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs mt-8" style={{ color: '#8892b0' }}>
          Los créditos se renuevan el primer día de cada mes · Sin contrato de permanencia · Podés cambiar de plan en cualquier momento
        </p>
      </div>
    </section>
  )
}

// ─── 9. FAQ (OSCURO) ──────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const { ref, visible } = useFadeIn()
  const faqs = [
    { q: '¿Necesito experiencia en publicidad para usar AdFlow?', a: 'No. AdFlow fue diseñado para que cualquier dueño de negocio pueda crear campañas profesionales sin conocimientos previos de marketing digital. La IA se encarga de toda la estrategia y configuración técnica.' },
    { q: '¿Cómo se conecta con mi cuenta de Facebook Ads?', a: 'A través de la API oficial de Meta. El proceso es seguro y tarda menos de 2 minutos. Solo necesitás autorizar AdFlow desde tu cuenta de Facebook Business Manager usando el login estándar de Facebook.' },
    { q: '¿Los copies generados por IA son de buena calidad?', a: 'Sí. Usamos modelos de IA avanzados entrenados específicamente para publicidad en redes sociales. Nuestros clientes reportan un CTR promedio 3 veces superior al de sus copies manuales.' },
    { q: '¿Puedo cancelar cuando quiera?', a: 'Absolutamente. No hay contratos de permanencia. Podés cancelar desde la configuración de tu cuenta en cualquier momento y no se realizarán cargos adicionales. Tus campañas en Meta permanecen intactas.' },
    { q: '¿Qué pasa con mi cuenta de Meta si cancelo?', a: 'Tus campañas y datos en Meta quedan completamente intactos. AdFlow solo gestiona la creación y optimización; tu cuenta de Meta Ads es tuya y siempre tenés control total sobre ella.' },
    { q: '¿Cuántas cuentas de Facebook Ads puedo conectar?', a: 'Podés conectar tu cuenta publicitaria de Meta desde Configuración. El número de cuentas depende de tu estructura de Business Manager. Si gestionás múltiples cuentas de distintos clientes, el plan Agencia es el más adecuado para tu operación.' },
    { q: '¿Hay un plan gratuito?', a: 'Sí. El plan Free incluye 10 créditos al mes para que puedas explorar la plataforma y probar la generación IA sin compromiso. No necesitás tarjeta de crédito para crearte una cuenta.' },
    { q: '¿Los reportes son en tiempo real?', a: 'Los datos se sincronizan con Meta cada hora. Además, recibís un reporte completo con análisis de IA y recomendaciones de optimización cada mañana directamente en tu email.' },
  ]

  return (
    <section id="faq" className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f0f1f 0%, #130f22 50%, #0f0f1f 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <Orb color="#62c4b0" size={600} top="10%" left="calc(50% - 300px)" opacity={0.25} blur={90} />
        <Orb color="#e91e8c" size={350} bottom="5%" right="-5%" opacity={0.18} blur={75} />
      </div>
      <div ref={ref} className={`relative z-10 max-w-3xl mx-auto px-5 sm:px-8 py-24 sm:py-28 ${fi(visible)}`}>
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-fluid-3xl text-white mb-4" style={{ letterSpacing: '-1.5px' }}>
            Preguntas frecuentes
          </h2>
          <p className="text-base sm:text-lg" style={{ color: '#94a3b8' }}>¿Tenés dudas? Acá están las respuestas.</p>
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className="rounded-2xl overflow-hidden transition-all duration-150"
              style={{ ...glass, borderColor: open === i ? 'rgba(233,30,140,0.3)' : 'rgba(255,255,255,0.1)' }}>
              <button className="w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}>
                <span className="font-semibold text-sm text-white pr-5">{q}</span>
                <ChevronDown className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
                  style={{ color: '#8892b0', transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {open === i && (
                <div className="px-5 sm:px-6 pb-5">
                  <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 10. Final CTA (gradiente intenso) ────────────────────────────────────────
function FinalCTASection() {
  const { ref, visible } = useFadeIn()
  return (
    <section className="relative py-28 sm:py-36 px-5 overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#6b0f3c 0%,#c2185b 25%,#e91e8c 50%,#62c4b0 75%,#3a9a8a 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <Orb color="#ffffff" size={700} top="-30%" right="-15%" opacity={0.18} blur={70} />
        <Orb color="#ffffff" size={500} bottom="-25%" left="-10%" opacity={0.15} blur={60} />
        <Orb color="#f9a8d4" size={400} top="20%" left="20%" opacity={0.50} blur={55} />
        <Orb color="#c4b5fd" size={350} bottom="15%" right="15%" opacity={0.50} blur={50} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.06) 1px,transparent 1px)',
          backgroundSize: '48px 48px', opacity: 0.5,
        }} />
      </div>
      <div ref={ref} className={`relative max-w-3xl mx-auto text-center ${fi(visible)}`}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-7"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <Rocket className="w-3.5 h-3.5" />
          Plan gratuito disponible · Sin tarjeta de crédito · Cancelá cuando quieras
        </div>
        <h2 className="font-display font-extrabold text-white mb-6 leading-none"
          style={{ fontSize: 'clamp(28px, 5vw, 58px)', letterSpacing: '-2px', textShadow: '0 0 40px rgba(255,255,255,0.15)' }}>
          Empezá hoy y lanzá tu primera campaña en 8 minutos
        </h2>
        <p className="text-white text-base sm:text-lg mb-10" style={{ opacity: 0.9 }}>
          Más de 500 negocios ya usan AdFlow para crecer con Facebook Ads. Ahora es tu turno.
        </p>
        <Link href="/login"
          className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all duration-150"
          style={{ background: 'white', color: '#e91e8c', boxShadow: '0 20px 50px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.2)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 30px 60px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.25)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 50px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.2)' }}>
          <Rocket className="w-5 h-5" />
          Crear mi cuenta gratis
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  )
}

// ─── 11. Footer (OSCURO) ──────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { heading: 'Producto', links: [{ label: 'Características', href: '#features' }, { label: 'Precios', href: '#pricing' }, { label: 'FAQ', href: '#faq' }] },
    { heading: 'Empresa', links: [{ label: 'Contacto', href: 'mailto:logisticaceoon@gmail.com' }] },
    {
      heading: 'Legal', links: [
        { label: 'Términos de uso', href: '/terms' },
        { label: 'Privacidad', href: '/privacy' },
      ]
    },
  ]
  return (
    <footer className="relative overflow-hidden" style={{ background: '#0a0a18', borderTop: '1px solid rgba(233,30,140,0.20)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <Orb color="#62c4b0" size={500} bottom="-20%" left="-5%" opacity={0.20} blur={80} />
        <Orb color="#e91e8c" size={350} top="-10%" right="5%" opacity={0.15} blur={70} />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-14 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#e91e8c,#c5006a)' }}>
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">AdFlow</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#8892b0' }}>
              Plataforma con IA para crear y optimizar campañas de Facebook Ads.
            </p>
          </div>
          {cols.map(({ heading, links }) => (
            <div key={heading}>
              <div className="font-semibold text-white text-sm mb-4">{heading}</div>
              <div className="space-y-3">
                {links.map(({ label, href }) => (
                  <div key={label}>
                    <Link href={href} className="text-sm transition-colors duration-150" style={{ color: '#8892b0', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#a8b0c0')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#8892b0')}>{label}</Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-sm" style={{ color: '#8892b0' }}>© 2026 AdFlow — Logisticaceoon. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-xs transition-colors duration-150" style={{ color: '#8892b0', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#a8b0c0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8892b0')}>Términos</Link>
            <Link href="/privacy" className="text-xs transition-colors duration-150" style={{ color: '#8892b0', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#a8b0c0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8892b0')}>Privacidad</Link>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs" style={{ color: '#8892b0' }}>Todos los sistemas operativos</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <Divider />
        <TrustSection />
        <Divider />
        <ProblemSection />
        <Divider />
        <SolutionSection />
        <Divider />
        <FeaturesSection />
        <Divider />
        <HowItWorksSection />
        <Divider />
        <DemoSection />
        <Divider />
        <TestimonialsSection />
        <Divider />
        <PricingSection />
        <Divider />
        <FAQSection />
        <FinalCTASection />
        <Footer />
      </main>
    </>
  )
}
