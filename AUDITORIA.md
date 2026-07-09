# Auditoría completa de ADFLOW

**Fecha:** 8 de julio de 2026
**Realizada con:** Claude Fable 5 (acceso a código local, Vercel y Supabase producción)
**Alcance:** 210 archivos TS/TSX · 34 rutas API · 67 tablas Supabase · deploys Vercel · logs de producción

---

## Resumen ejecutivo

ADFLOW es un SaaS sólido en su núcleo (wizard de creación con IA, publicación real a Meta, sync de métricas, automation rules, gamificación) con buena base de auth: casi todas las rutas verifican sesión y filtran por `user_id`, y el consumo de créditos es atómico. **Pero hay 4 problemas críticos que deben arreglarse ya**, dos de ellos verificados directamente contra la base de producción.

Prioridad absoluta:

1. **Escalada de privilegios vía RLS** — cualquier usuario puede volverse admin y darse créditos infinitos. *(verificado en prod)*
2. **Bug de moneda ×100** — presupuestos publicados 100× mayores para CLP/COP/PYG (tu mercado). Dinero real.
3. **Cron de IA roto hace ≥7 días** — modelo Claude inexistente; los reportes automáticos fallan cada día. *(verificado en logs)*
4. **Endpoints de email sin auth** — relay abierto de spam/phishing.

---

## 🔴 CRÍTICOS

### C-1. Escalada de privilegios y créditos infinitos (RLS `profiles`) — VERIFICADO EN PROD
La policy de UPDATE de `profiles` es `USING (auth.uid() = id)` **sin `WITH CHECK` y sin restricción de columnas**. Como el navegador usa la anon key con la sesión del usuario, cualquiera puede ejecutar:

```js
supabase.from('profiles').update({ role: 'super_admin', credits_total: 999999 }).eq('id', miId)
```

→ acceso total al panel `/admin` y bypass completo del sistema de créditos/facturación. Confirmado: la única policy UPDATE existente no tiene `with_check`.

**Además** (advisors Supabase): la policy SELECT `Admins can view all profiles` lee el rol desde `user_metadata`, que **el propio usuario puede editar** → otra vía de escalada. Y `admin_set_plan`, `consume_user_credits`, `increment_credits_used` son `SECURITY DEFINER` ejecutables por `anon`/`authenticated` y **no verifican rol admin internamente** (confirmado: `checks_admin=false`, grants a anon/authenticated).

**Fix:** trigger que rechace cambios a `role/plan/credits_*` salvo service_role; reconstruir la policy de admin leyendo rol desde `app_metadata` (no `user_metadata`); revocar EXECUTE de esas 3 funciones a `anon`/`authenticated` y validar rol dentro de `admin_set_plan`.

### C-2. Bug de moneda ×100 en presupuestos (monedas sin decimales)
`campaign-builder.ts:78`, `scale-budget/route.ts:62`, `automation-engine.ts:204,236` hacen `Math.round(budget*100)` para todos. Meta usa "offset 100" solo para monedas con centavos; **CLP, COP, PYG, CRC van en unidades enteras**. Un usuario chileno con $50.000 CLP/día publica ad sets de **$5.000.000 CLP/día**.

**Fix:** helper único con lista de monedas zero-decimal (`CLP,COP,PYG,CRC,HUF,ISK,JPY,KRW,TWD,VND` → ×1; resto ×100). Centralizar (hoy está duplicado en 4 lugares).

### C-3. Cron de reportes IA caído hace ≥7 días — VERIFICADO EN LOGS
Runtime errors de Vercel: cada día a las 11:43 UTC, `/api/cron/process-user-report` falla con `404 model: claude-sonnet-4-20250514` (modelo inexistente). Los reportes diarios con IA **no se generan desde al menos el 2 de julio**. Combinado con el bug C-5 (Resend no lanza), el usuario ni se entera.

**Fix:** actualizar el string de modelo a uno válido y añadir alerta cuando el cron falle.

### C-4. `/api/email/send` y `/api/email/test` sin autenticación
`email/send` acepta `{to, subject, html}` de cualquiera y envía vía Resend → **relay abierto de spam/phishing** y agotamiento de cuota. `email/test` dispara emails sin auth. Ninguno tiene callers en el frontend.

**Fix:** eliminar ambas rutas (no se usan) o exigir rol admin + rate limit.

---

## 🟠 ALTOS

- **A-1. Tokens de Facebook en texto plano** (`facebook_connections.access_token`). Token con `ads_management` = control total del gasto publicitario. Cifrar en reposo (AES-256-GCM o Supabase Vault).
- **A-2. Secretos de prod en `.env.local` y `CRON_SECRET` débil** (`adflow2026seguro`). No están commiteados (bien), pero quedaron expuestos. Rotar los 5 (service_role, Anthropic, Resend, Meta, CRON) y generar CRON aleatorio.
- **A-3. Rutas de IA sin rate limit.** El limiter existe pero solo lo usa `publish-campaign`. `generate-copies` (hasta 8000 tokens + imágenes) no. Añadir `checkRateLimit(user.id,'ai')`.
- **A-4. Sync reporta "éxito" con token expirado** (`meta-sync-engine.ts:66-80`): `fetchInsights` traga el error 190, cuenta la campaña como sincronizada y notifica "Métricas actualizadas". El usuario ve datos viejos creyéndolos frescos.
- **A-5. Doble ejecución al aprobar automatización** (`automation-engine.ts:485` + botones sin disable): sin claim atómico → doble click escala presupuesto dos veces. Añadir `UPDATE ... WHERE status='pending'` con verificación de filas + disable en cliente.
- **A-6. Carrera cron vs botón manual en automation rules** (cooldown se escribe después de ejecutar): +15% aplicado dos veces. Claim optimista antes de ejecutar.
- **A-7. `scale-budget` persiste presupuesto aunque Meta lo rechace** (`:90` antes del check de `failed`). Todo lo que lee `daily_budget` opera sobre un valor falso.
- **A-8. Resend nunca lanza → emails fallidos marcados `sent`** (`process-user-report`). Chequear `{error}` del SDK.
- **A-9. Sin recuperación de contraseña.** No existe `resetPasswordForEmail` ni link en login. Churn evitable.
- **A-10. Métricas del dashboard incoherentes**: `campaigns.metrics` cambia de ventana (1/7/30 días) según el último sync; "gasto del mes" solo cuenta campañas creadas este mes. Recomputar desde `campaign_metrics_daily` con ventana fija.

---

## 🟡 MEDIOS (selección)

- **M-1. Sin pagos reales.** Billing es un link de WhatsApp; upgrades manuales por admin. Las columnas `stripe_customer_id`/`billing_history` ya existen. Implementar Stripe Checkout + webhook.
- **M-2. Automatización solo 1×/día** (único cron 11 UTC). La promesa central de "auto-scaling" reacciona con 24h de retraso. Cron cada 1-3h.
- **M-3. `generate-copies` no valida con zod** pese a existir el schema; `bodySizeLimit: 50mb` global. Riesgo de abuso de costo/memoria.
- **M-4. Timezone**: filtros en UTC vs fechas de Meta (TZ de la cuenta) → off-by-one en ventanas "por N días" y reportes.
- **M-5. Proyecciones de `budget-engine` en CPM/CTR USD** aplicadas a presupuesto local ("62 millones de personas"). Normalizar a USD.
- **M-6. Emails inconsistentes**: remitente `onboarding@resend.dev` (sandbox) vs `reportes@adflow.ai`. Faltan welcome, aviso de créditos, aviso de token Meta expirado.
- **M-7. Inconsistencia de planes**: código acepta `starter`, el CHECK del schema solo `free/pro/agency`.
- **M-8. Mobile débil**: solo 4 `@media` en 69KB de CSS; grids con px fijos. Auditar responsive.
- **M-9. RLS incompletas (advisors)**: 7 tablas con RLS activo sin policies, `industry_benchmarks` con RLS **desactivado** (expuesta a anon), buckets públicos con listado abierto, protección de contraseñas filtradas desactivada en Auth.

---

## 🧹 CÓDIGO Y DATOS QUE SOBRAN

**Eliminables seguros (0 referencias verificadas):**
- **16 componentes** huérfanos (wizard viejo: StepEssential/Content/Strategy/Review/Diagnosis; SpendChart, AchievementsBadges, RecommendationsList, AlertsOpportunities, PhaseSummary, PixelLevelCard, GrowthProfile, ForecastWidget, MetricCard, etc.)
- **10 rutas API** sin caller (`email/send`, `email/test`, `automation/evaluate`, `facebook/status`, `growth/status`, `intelligence/campaign`, `metrics/campaign`, `metrics/phases`, `reports/monthly`, `recommendations`)
- **8 libs/engines** muertos (`ai-strategist`, `autoscaling-engine`, `forecast-engine`, `growth-engine`, `strategy-engine`, `currency.ts`, `useCurrency.ts`, `types/advanced.ts`)
- **3 dependencias** sin uso (`clsx`, `pg`, `@types/pg`); **Sentry** configurado pero nunca cableado en `next.config.js`
- **Archivo basura** `--force` en la raíz + 4 directorios con llaves literales
- **~37 de 210 archivos (17%) y ~180 KB** de código eliminable

**Base de datos:** solo **24 de 67 tablas** se usan en el código. Hasta **43 tablas eliminables**: 35 vacías + sin código (`contracts, payroll, forecasts, scaling_rules, kpis, objectives, meetings, recordings, docs, audits, invoices, minutes, transactions...`) y 8 de **otra app "agency OS"** con datos (`workspaces, clients, projects, tasks, finance_clients...`) que conviven en el mismo proyecto Supabase. Confirmar antes de dropear. Además: FKs sin índice, ~40 índices sin uso, policies RLS duplicadas (`multiple_permissive_policies`) — limpieza de performance.

**Disco recuperable en `C:\proyectos\`: ~1.9 GB** en zips y export (`adflow - Copy.zip` 282MB, `adflow-source.zip`×2 173MB, `adflow-export/` 735MB) + 302MB de `.next`.

---

## ➕ QUÉ FALTA (producto)

**Features fantasma / a medias:** Estratega IA (stub "próximamente"), auto-scaling autónomo (motor sin ejecutar), forecast (stubs), video tutorial (botón sin handler), "Notificarme" de Labs (solo localStorage, nunca avisa), admin AI-usage/events ("tabla pendiente de migration"). FAQ y README contradicen lo ya implementado.

**El producto intenta ser dos cosas:** herramienta de Ads (100% del código, bien ejecutada) + gestión de agencia (35 tablas vacías sin UI). **Recomendación: eliminar el producto de agencia** y doblar la apuesta al ads-tool self-service para LATAM. La única pieza a rescatar: multi-cuenta/multi-cliente dentro del flujo de ads (justifica el plan Agencia que ya se cobra).

**Top mejoras (impacto/esfuerzo):**
1. Stripe Checkout → revenue (crítico, medio)
2. Reset de contraseña (alto, bajo)
3. Dominio Resend verificado + emails clave (alto, bajo)
4. Cron de automatización cada 1-3h + alertas de gasto anómalo (alto, medio)
5. Multi-cuenta de anuncios para plan Agencia (alto, alto)
6. Paridad competitiva: export CSV/PDF, A/B testing de copies (la IA ya genera 3 variantes; falta trackear la ganadora)

---

## Plan de acción sugerido (orden)

**Semana 1 — parar sangrado:**
1. Fix RLS `profiles` + funciones SECURITY DEFINER (C-1)
2. Fix moneda ×100 (C-2)
3. Corregir modelo del cron (C-3)
4. Eliminar/proteger endpoints de email (C-4)
5. Rotar secretos (A-2)

**Semana 2 — robustez:**
6. Cifrar tokens Meta (A-1), rate limit IA (A-3), errores silenciosos sync/Resend/scale (A-4, A-7, A-8), carreras de automatización (A-5, A-6)

**Semana 3 — producto y limpieza:**
7. Reset password (A-9), coherencia de métricas (A-10)
8. Borrar código y tablas muertas (con backup)
9. Stripe + cron frecuente + emails

---

*Nota: la tabla `industry_benchmarks` tiene RLS desactivado. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` la bloquea entera si no se agregan policies — definir políticas primero, o dropearla si no se usa.*
