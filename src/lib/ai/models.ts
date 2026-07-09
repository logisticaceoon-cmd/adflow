// src/lib/ai/models.ts
// Punto ÚNICO de configuración de modelos de Claude usados por la app.
//
// Un modelo desactualizado ('claude-sonnet-4-20250514') hizo que el cron de
// reportes fallara con 404 durante días. Centralizar aquí evita que un string
// obsoleto quede disperso por el código: si Anthropic actualiza un modelo,
// se cambia en un solo lugar.
//
// Permite override por variable de entorno para poder rotar el modelo sin deploy.

export const AI_MODELS = {
  /** Tareas rápidas y de alto volumen: generación de copies. */
  fast: process.env.ANTHROPIC_MODEL_FAST || 'claude-haiku-4-5-20251001',
  /** Razonamiento / análisis estratégico: reportes, recomendaciones. */
  reasoning: process.env.ANTHROPIC_MODEL_REASONING || 'claude-sonnet-5',
} as const

export type AiModelTier = keyof typeof AI_MODELS
