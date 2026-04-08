// src/lib/client-message-engine.ts
// The 12 message templates from the V1_0 workbook (TEMPLATES sheet).
// Tone is deliberately human/professional: directive, not vague; specific,
// not generic. Each template maps to exactly one diagnostic rule (or a set of
// rules) so the message the client sees always matches the expert reasoning.

export type MessageTone = 'positive' | 'cautious' | 'alert' | 'neutral'

export interface ClientMessage {
  templateId: string
  subject: string
  body: string
  tone: MessageTone
}

const TEMPLATES: Record<string, Omit<ClientMessage, 'templateId'>> = {
  // ── T01 — No hay datos aún ─────────────────────────────────────
  T01: {
    subject: 'Aún estamos recolectando datos',
    body: `Revisamos tus campañas y por ahora no hay suficientes datos para tomar decisiones.

Esto es normal cuando una campaña recién empieza.

👉 Recomendación:
• Dejala correr sin hacer cambios.
• No pausar ni escalar todavía.

Te avisaremos cuando haya señales claras.`,
    tone: 'neutral',
  },

  // ── T02 — Oportunidad para escalar ─────────────────────────────
  T02: {
    subject: 'Oportunidad para escalar tu campaña',
    body: `Detectamos una campaña con muy buen rendimiento.

👉 Qué está pasando:
Está generando ventas consistentes con retorno saludable.

👉 Recomendación:
• Escalar presupuesto de forma controlada (10–20%).
• Mantener los anuncios actuales sin cambios.

Buen momento para crecer sin riesgo innecesario.`,
    tone: 'positive',
  },

  // ── T03 — Campaña no rentable ──────────────────────────────────
  T03: {
    subject: 'Campaña no rentable detectada',
    body: `Esta campaña está generando gasto sin retorno suficiente.

👉 Recomendación:
• Considerar pausar para no seguir perdiendo presupuesto.
• Evaluar cambiar creativos, oferta o audiencia antes de reactivar.`,
    tone: 'alert',
  },

  // ── T06 — La gente entra pero no compra ───────────────────────
  T06: {
    subject: 'La gente entra pero no compra',
    body: `Tus anuncios están generando clicks pero no se convierten en ventas.

👉 Posibles causas:
• La landing page no convence.
• El precio o la oferta no son atractivos.
• Falta información o confianza.

👉 Recomendación:
• Revisar la página de destino.
• Probar otra oferta o incentivo.`,
    tone: 'cautious',
  },

  // ── T07 — Carritos sin checkout ────────────────────────────────
  T07: {
    subject: 'Quieren comprar pero algo los frena',
    body: `Hay carritos pero pocos inician el pago.

👉 Posibles causas:
• Costos de envío sorpresivos.
• Proceso de checkout largo.
• Falta de métodos de pago.

👉 Recomendación:
• Simplificar el checkout.
• Mostrar costos totales desde el inicio.`,
    tone: 'cautious',
  },

  // ── T08 — Checkouts sin compras ────────────────────────────────
  T08: {
    subject: 'El problema no es el anuncio, es el cierre',
    body: `Las personas inician el pago pero no lo completan.

👉 Posibles causas:
• Error en el procesador de pagos.
• Falta de opciones de pago.
• Fricción en el último paso.

👉 Recomendación:
• Verificar que el checkout funcione bien.
• Agregar más opciones de pago si es posible.`,
    tone: 'alert',
  },

  // ── T09 — CPA alto con ROAS ok ─────────────────────────────────
  T09: {
    subject: 'El CPA está alto pero el ROAS todavía cierra',
    body: `Cada venta está saliendo cara pero el retorno todavía es rentable.

👉 Qué significa:
Estás vendiendo caro. Si el margen aguanta, está bien, pero hay que optimizar.

👉 Recomendación:
• Revisar el targeting.
• Probar creativos con mejor conversión.
• Si podés bajar el CPA, el ROAS explota.`,
    tone: 'cautious',
  },

  // ── T10 — CPM alto con CTR bajo ────────────────────────────────
  T10: {
    subject: 'Estás pagando caro por mostrar el anuncio',
    body: `El CPM (costo por mil impresiones) está alto y el CTR (clicks) no acompaña.

👉 Qué significa:
Meta te está cobrando caro y el anuncio no llama la atención.

👉 Recomendación:
• Cambiar creativos.
• Probar otro ángulo o mensaje.
• Ampliar la audiencia puede bajar el CPM.`,
    tone: 'cautious',
  },

  // ── T11 — Frecuencia alta con ROAS medio ──────────────────────
  T11: {
    subject: 'Funciona pero se está cansando',
    body: `La campaña genera resultados pero la frecuencia está subiendo.

👉 Qué significa:
La misma audiencia ve tus anuncios muchas veces → fatiga publicitaria.

👉 Recomendación:
• Renovar creativos.
• Ampliar la audiencia.
• Considerar pausar y relanzar con nuevos anuncios.`,
    tone: 'cautious',
  },

  // ── T12 — ROAS intermedio ──────────────────────────────────────
  T12: {
    subject: 'Rendimiento intermedio — hay margen de mejora',
    body: `La campaña está rentable pero todavía no llega a ser excelente.

👉 Recomendación:
• Optimizar creativos para mejorar CTR.
• Afinar audiencias.
• No escalar hasta llegar a ROAS 6x o más.`,
    tone: 'neutral',
  },

  // ── T13 — Mucho gasto, pocas compras ──────────────────────────
  T13: {
    subject: 'Frenemos esto antes de perder más plata',
    body: `Hay gasto considerable sin resultados de ventas.

👉 Recomendación urgente:
• Pausar la campaña inmediatamente.
• Analizar por qué no convierte antes de reactivar.
• No aumentar presupuesto.`,
    tone: 'alert',
  },

  // ── T14 — Carritos + fricción ──────────────────────────────────
  T14: {
    subject: 'Hay interés pero algo frena la compra',
    body: `Hay actividad en el embudo (carritos, visitas) pero las compras no se concretan.

👉 Recomendación:
• Revisar la oferta.
• Probar remarketing.
• Mejorar la urgencia en los anuncios.`,
    tone: 'cautious',
  },

  // ── T14B — Todo bien pero poca señal ──────────────────────────
  T14B: {
    subject: 'Todo va bien, pero no la escalaría todavía',
    body: `Los números son buenos pero con frecuencia baja — aún no hay suficiente señal para escalar con confianza.

👉 Recomendación:
• Mantener presupuesto actual.
• Esperar más datos antes de aumentar.`,
    tone: 'neutral',
  },

  // ── T15 — CPM bajo con ROAS bajo ──────────────────────────────
  T15: {
    subject: 'Llegás barato pero no convertís',
    body: `El CPM es bajo (Meta te muestra barato) pero el ROAS no cierra.

👉 Qué significa:
No es problema de costo. Es problema de oferta, creativo o landing.

👉 Recomendación:
• Revisar la promesa del anuncio.
• Mejorar la landing.
• Probar ofertas más agresivas.`,
    tone: 'cautious',
  },

  // ── T16 — CTR muy bajo con gasto medio ────────────────────────
  T16: {
    subject: 'El anuncio no está llamando la atención',
    body: `CTR muy bajo (<0.5%) con gasto considerable.

👉 Qué significa:
El anuncio no engancha. Meta te muestra pero nadie hace click.

👉 Recomendación:
• Pausar y cambiar creativos antes de gastar más.
• Probar videos o formatos nuevos.`,
    tone: 'alert',
  },

  // ── T17 — ROAS bueno pero pocas compras ───────────────────────
  T17: {
    subject: 'Va bien, pero todavía no la aceleraría',
    body: `El ROAS es bueno pero con pocas compras todavía. Necesitamos más volumen para confirmar que el rendimiento es sostenible.

👉 Recomendación:
• No escalar aún.
• Dejar que acumule más datos.`,
    tone: 'neutral',
  },

  // ── T21 — ROAS alto pero frecuencia alta ──────────────────────
  T21: {
    subject: 'La campaña funciona pero empieza a desgastarse',
    body: `El rendimiento es bueno pero la frecuencia ya está alta.

👉 Recomendación:
• Renovar creativos antes de que baje el rendimiento.
• Considerar ampliar audiencia.
• No escalar presupuesto hasta renovar.`,
    tone: 'cautious',
  },
}

export function getClientMessage(templateId: string): ClientMessage | null {
  const tpl = TEMPLATES[templateId]
  if (!tpl) return null
  return { templateId, ...tpl }
}

/** Appends a live metrics line to the template body so the message feels
 *  grounded in the user's actual numbers. */
export function generatePersonalizedMessage(
  templateId: string,
  metrics: { roas: number; frequency: number; purchases: number; spend: number },
): ClientMessage | null {
  const base = getClientMessage(templateId)
  if (!base) return null

  const roasStr = metrics.roas > 0 ? `${metrics.roas.toFixed(1)}x` : '—'
  const freqStr = metrics.frequency > 0 ? metrics.frequency.toFixed(1) : '—'
  const metricsLine = `\n\n📊 Datos actuales: ROAS ${roasStr} · Frecuencia ${freqStr} · Compras ${metrics.purchases} · Gasto $${metrics.spend.toLocaleString('es')}`

  return { ...base, body: base.body + metricsLine }
}

/** Expose the template catalog for tooling / docs without duplicating it. */
export function listTemplates(): ClientMessage[] {
  return Object.entries(TEMPLATES).map(([id, tpl]) => ({ templateId: id, ...tpl }))
}
