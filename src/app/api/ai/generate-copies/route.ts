// src/app/api/ai/generate-copies/route.ts
// Esta es la ruta que llama a Claude para generar los copies publicitarios
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const OBJ_MAP: Record<string, string> = {
  CONVERSIONS: 'generar ventas directas',
  TRAFFIC: 'llevar tráfico al sitio web',
  REACH: 'generar reconocimiento de marca',
  LEAD_GENERATION: 'capturar leads y datos de contacto',
}

export async function POST(req: NextRequest) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Verificar que el usuario esté autenticado
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { name, objective, daily_budget, product_description, product_url, target_audience } = body

    if (!product_description?.trim()) {
      return NextResponse.json({ error: 'Se requiere descripción del producto' }, { status: 400 })
    }

    // ── PROMPT PARA CLAUDE ──
    // Este prompt está específicamente diseñado para Facebook Ads
    const prompt = `Eres un experto en publicidad digital con 10 años de experiencia creando campañas de Facebook Ads de alto rendimiento para negocios en LATAM.

Tu tarea es crear los textos publicitarios completos para una campaña de Facebook Ads basándote en la información del negocio.

## DATOS DE LA CAMPAÑA
- **Nombre de la campaña**: ${name}
- **Objetivo**: ${OBJ_MAP[objective] || objective}
- **Presupuesto diario**: $${daily_budget} USD
- **URL del producto**: ${product_url || 'No especificada'}
- **Público objetivo indicado por el cliente**: ${target_audience || 'No especificado — definir basado en el producto'}

## DESCRIPCIÓN DEL PRODUCTO/SERVICIO
${product_description}

## INSTRUCCIONES
Generá los copies siguiendo ESTRICTAMENTE las mejores prácticas de Facebook Ads:
1. Headlines: máximo 40 caracteres, impactantes, que capturen atención en el feed
2. Texto principal: máximo 125 caracteres para versión corta (Facebook lo trunca después)
3. Usá copywriting emocional + beneficio claro
4. Adaptá el tono al producto y al público LATAM
5. Incluí emojis estratégicamente (no más de 2 en headlines)
6. Para el CTA type, usar uno de estos valores exactos: SHOP_NOW, LEARN_MORE, SIGN_UP, GET_QUOTE, CONTACT_US, DOWNLOAD, BOOK_TRAVEL, APPLY_NOW, GET_OFFER

## RESPUESTA
Respondé ÚNICAMENTE con un JSON válido, sin texto adicional antes o después, sin backticks, sin markdown. Exactamente este formato:

{
  "headlines": ["headline 1 max 40 chars", "headline 2 max 40 chars", "headline 3 max 40 chars"],
  "primary_text": "Texto principal del anuncio. Máximo 125 caracteres. Claro, beneficio directo, llamada a la emoción.",
  "description": "Descripción más larga (para anuncios de conversión y carrusel). Hasta 30 palabras. Detalla el beneficio principal.",
  "call_to_action": "Texto del botón en español. Ej: Comprar ahora, Ver más, Obtener oferta",
  "cta_type": "SHOP_NOW",
  "audience_suggestion": "Descripción detallada de la audiencia ideal: demografía, intereses, comportamientos, edad, género, países/ciudades para Argentina y LATAM",
  "positioning": "Análisis del posicionamiento: propuesta de valor, tono recomendado, diferenciadores clave vs competencia, por qué esta campaña va a funcionar",
  "tone": "tono identificado: profesional/emocional/urgente/aspiracional/educativo/etc"
}`

    // Llamada a Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parsear el JSON que devuelve Claude
    let copies
    try {
      // Limpiar por si Claude agrega algo extra
      const clean = responseText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
      copies = JSON.parse(clean)
    } catch {
      console.error('Error parseando respuesta de Claude:', responseText)
      return NextResponse.json({ error: 'Error al procesar la respuesta de IA. Intentá de nuevo.' }, { status: 500 })
    }

    return NextResponse.json({ copies })

  } catch (error: any) {
    console.error('Error en generate-copies:', error)
    return NextResponse.json({
      error: error.message || String(error),
      stack: error.stack,
    }, { status: 500 })
  }
}
