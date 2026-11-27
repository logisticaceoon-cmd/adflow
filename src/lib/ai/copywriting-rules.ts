// src/lib/ai/copywriting-rules.ts
// Distilled copywriting rules injected into the AI prompt for every generation.
// Based on the professional Meta Ads copywriting & creative direction manual.

export const COPYWRITING_SYSTEM_RULES = `
SISTEMA DE COPYWRITING PROFESIONAL — REGLAS OBLIGATORIAS:

1. INVESTIGACIÓN ANTES DE ESCRIBIR
Antes de generar cualquier copy, analizá internamente:
- Avatar: quién compra este producto
- Dolor superficial: el problema que dice tener
- Dolor profundo: lo que emocionalmente representa ese problema
- Deseo funcional: lo que quiere conseguir
- Deseo emocional: cómo quiere sentirse
- Objeciones: qué le impide comprar
- Mecanismo: por qué funciona esta solución
- Diferencial: por qué debería elegirnos

2. NIVELES DE CONSCIENCIA (Eugene Schwartz)
Adaptá el copy según el nivel del consumidor:
- TOFU = Inconsciente/Consciente del problema → curiosidad, identificación, dolor
- MOFU = Consciente de la solución → mecanismo, diferenciación, demostración
- BOFU = Consciente del producto → pruebas, oferta, garantía, CTA directo

3. REGLA DE UNA SOLA IDEA
Cada anuncio = Un público + Un ángulo + Una promesa + Un argumento + Una acción.
INCORRECTO: "Nuestra mochila es resistente, económica, moderna, impermeable y cómoda"
CORRECTO: "Tu oficina entera, en una mochila que no parece una valija"

4. ESTRUCTURA DE COPY PARA META ADS
- Texto principal: Gancho + beneficio + argumento (máx 125 chars)
- Headline: Condensa la promesa (máx 40 chars)
- Descripción: Complementa la oferta (máx 30 chars)
- CTA: Indica la acción específica
NO repitas lo mismo en todos los elementos. Cada uno tiene una función distinta.

5. ÁNGULOS DE VENTA (elegí UNO dominante por anuncio)
- Dolor → frustración: "Otro cable roto. Otro gasto innecesario."
- Deseo → aspiración: "Un escritorio al que da gusto sentarse."
- Conveniencia → comodidad: "Prepará el café sin ensuciar media cocina."
- Ahorro → economía: "Un filtro reutilizable en lugar de cientos descartables."
- Tiempo → rapidez: "Tu desayuno listo en cinco minutos."
- Identidad → pertenencia: "Para quienes prefieren viajar liviano."
- Curiosidad → necesidad de saber: "El detalle que cambia cómo se siente esta zapatilla."
- Demostración → credibilidad: "Mirá cuánto entra realmente."
- Comparación → contraste: "Mismo espacio. El doble de organización."
- Objeción → reducción de resistencia: "No necesitás herramientas para instalarlo."

6. FRAMEWORKS DE COPY (usá el más apropiado)
- PAS: Problema → Agitación → Solución
- BAB: Before → After → Bridge (producto como puente)
- AIDA: Atención → Interés → Deseo → Acción
- FAB: Feature → Advantage → Benefit

7. REGLAS DE LENGUAJE
La especificidad genera imágenes mentales. Los adjetivos genéricos NO venden.
EVITAR → REEMPLAZAR POR:
- "Máxima calidad" → "Acero inoxidable de 2 mm"
- "Súper cómodo" → "Suela flexible que acompaña cada paso"
- "Gran capacidad" → "Espacio para una notebook de 15 pulgadas"
- "Fácil de usar" → "Tres pasos y está listo"
- "Resultados increíbles" → datos concretos y demostrables

8. DISPARADORES PSICOLÓGICOS (usá los que apliquen, sin engañar)
- Prueba social: reseñas y experiencias reales
- Escasez: solo si es real
- Urgencia: solo si hay fecha real
- Especificidad: datos concretos generan credibilidad
- Contraste: diferencias fáciles de comprender
- Anticipación: visualización de la experiencia futura

9. GANCHOS (primera frase que detiene el scroll)
Tipos efectivos:
- Contraintuitivo: "No necesitás más X, necesitás Y"
- Identificación: "Otra vez [situación frustrante]"
- Curiosidad: "Mirá lo que pasa cuando..."
- Demostración: "Así funciona realmente"
- Deseo: "Imaginá abrir la puerta y encontrar..."
- Objeción: "No necesitás experiencia previa"
- Comparación: "La diferencia entre X e Y"

10. LO QUE NUNCA DEBES HACER
- Hablar demasiado de la marca en vez del consumidor
- Usar ganchos genéricos sin relación con el producto
- Mezclar demasiadas promesas en un solo anuncio
- Vender características aisladas sin traducir a beneficios
- Inventar autoridad, urgencia falsa o testimonios
- Generar clickbait que atrae tráfico sin intención de compra
- Prometer resultados que el producto no puede dar
- Usar lenguaje que atribuya condiciones al espectador (políticas de Meta)

11. VARIANTE B — REGLA DE CONTRASTE
Cuando generes la variante B de un copy, NO cambies solo palabras.
Cambiá el ÁNGULO o el FRAMEWORK:
- Si A usa dolor → B usa deseo
- Si A usa PAS → B usa BAB
- Si A es urgente → B es social proof
- Si A habla del problema → B habla de la transformación

12. COHERENCIA COPY-IMAGEN
El copy y la imagen deben defender la misma tesis:
- Si el copy habla de ahorro de tiempo → la imagen muestra rapidez
- Si el copy habla de comodidad → la imagen muestra uso cotidiano
- Si el copy habla de resistencia → la imagen muestra prueba física
En el campo "creative_suggestion", describí qué tipo de imagen complementa este copy.
`

// Rules specifically for image generation (for future use)
export const IMAGE_GENERATION_RULES = `
REGLAS DE GENERACIÓN DE IMÁGENES PUBLICITARIAS:

1. PRINCIPIO FUNDAMENTAL
Una imagen publicitaria es un argumento comercial visual, no decoración.
Debe responder: qué se vende, qué beneficio comunica, por qué merece atención.

2. 15 REGLAS DE DISEÑO
- Punto focal: un elemento visual dominante
- Jerarquía: orden claro de lectura
- Contraste: separación entre producto, texto y fondo
- Legibilidad: texto comprensible desde el celular
- Simplicidad: eliminar elementos sin función comercial
- Protagonismo: producto reconocible y visible
- Coherencia: imagen y copy venden el mismo argumento
- Contexto: mostrar cómo se utiliza el producto
- Espacio negativo: reservar aire para texto y composición
- Identidad: mantener códigos reconocibles de marca
- Autenticidad: evitar apariencias artificiales injustificadas

3. FORMATOS VISUALES
- Hero Product: producto protagonista, fondo controlado
- Lifestyle: producto en situación de uso
- Antes y después: contraste entre dos situaciones
- Demostración: producto ejecutando su función
- Beneficios señalizados: indicaciones sobre características
- UGC visual: estética cotidiana, espontánea
- Testimonio: producto con reseña auténtica
- Oferta/bundle: precio, descuento visible
- Mecanismo diferencial: cortes técnicos, despieces
- Macro sensorial: primeros planos de texturas

4. PROMPT DE IMAGEN (estructura)
- Producto: forma, material, color, tamaño
- Ángulo comercial: beneficio dominante
- Escenario: dónde ocurre la escena
- Composición: ubicación del producto y elementos
- Iluminación: coherente con el mensaje
- Estética: editorial, comercial, UGC, minimalista
- Espacio negativo: lugar para copy
- Formato: relación de aspecto (1:1, 4:5, 9:16)
- Restricciones: no alterar producto real

5. REGLA DE FIDELIDAD
Nunca alterar forma, etiqueta, logo, color, proporciones ni textura del producto real.
No inventar funciones o características que no existen.
`
