# AdFlow — Arquitectura del Growth OS

Plataforma Next.js 14 que permite a usuarios sin conocimiento de Meta Ads Manager crear, publicar, escalar y optimizar campañas en Meta Ads con IA.

---

## Stack

- **Frontend / backend**: Next.js 14 (App Router)
- **Base de datos / auth**: Supabase (Postgres + RLS)
- **IA**: Anthropic Claude (haiku-4-5-20251001 para flujos core, sonnet para análisis)
- **Meta Ads**: Graph API v20.0
- **Email**: Resend
- **Charts**: recharts
- **Iconos**: lucide-react
- **Tipografía**: Syne (titulares) + DM Sans (body)

---

## Módulos core (implementados)

| Módulo | Archivo | Rol |
|---|---|---|
| **Pixel Analyzer** | `src/lib/pixel-analyzer.ts` | Lee eventos del pixel de Meta y determina nivel (0-8) + capabilities |
| **Level Engine** | (dentro de pixel-analyzer + strategy-engine) | 9 niveles con capabilities gating (TOFU/MOFU/BOFU, audiencias por nivel) |
| **Audience Engine** | `src/lib/audience-engine.ts` | Búsqueda de intereses en Meta, custom audiences, lookalikes |
| **Budget Engine** | `src/lib/budget-engine.ts` | Distribución por fases según nivel |
| **Recommendation Engine** | `src/lib/recommendation-engine.ts` | Acciones priorizadas basadas en métricas reales |
| **Growth Engine** | `src/lib/growth-engine.ts` | Progreso hacia el próximo nivel, estimaciones |
| **Strategy Engine** | `src/lib/strategy-engine.ts` | Decisión CBO/ABO, validación pre-publicación |
| **Meta Sync Engine** | `src/lib/meta-sync-engine.ts` | Sincronización diaria de métricas reales → `campaign_metrics_daily` |
| **Monthly Report Engine** | `src/lib/monthly-report-engine.ts` | Reportes mensuales consolidados con análisis IA |
| **Achievement Engine** | `src/lib/achievement-engine.ts` | 24 logros persistentes con evaluación automática + toast |
| **Notification Engine** | `src/lib/notification-engine.ts` | Eventos persistentes del sistema (13 tipos) |
| **Onboarding Engine** | `src/lib/onboarding-engine.ts` | Detección y guía de setup (6 pasos) |

## Módulos de UI clave

- `OnboardingWizard.tsx` + `OnboardingChecklist.tsx` + página `/dashboard/onboarding`
- `CampaignsListView.tsx` + página `/dashboard/campaigns/[id]` (7 secciones)
- `AchievementsBadges.tsx` + `AchievementsWall.tsx` + `AchievementToast.tsx`
- `HeroLevel.tsx` + `GrowthProfile.tsx` + `PhaseSummary.tsx`
- `CampaignActions.tsx` (activar/pausar/escalar/duplicar)
- `CampaignPublishFlow.tsx` (publicación a Meta)
- `SyncButton.tsx` (manual sync)
- `TopBar.tsx` (notifications dropdown real)
- `Sidebar.tsx` (level widget + setup widget + credits widget)
- `ui/Skeleton.tsx` + `EmptyState.tsx` + `ErrorState.tsx` + `Spinner.tsx` + `ToastProvider.tsx`

---

## Tablas principales

### Core datos de usuario
- `profiles` — info del usuario (plan, créditos, preferencias de reporte)
- `business_profiles` — perfil del negocio (nombre, currency, pixel_id, selected_ad_account_id)
- `facebook_connections` — OAuth token con Meta

### Campañas y métricas
- `campaigns` — campañas creadas (con `campaign_structure`, `ai_copies`, `meta_campaign_id`, etc.)
- `campaign_metrics_daily` — snapshot diario por campaña (spend, impressions, roas, purchases, etc.)
- `adset_metrics_daily` — snapshot diario por ad set
- `campaign_actions` — historial de activate/pause/scale/duplicate

### Pixel y nivel
- `pixel_analysis` — análisis más reciente del pixel (events_data, level, capabilities)
- `level_history` — transiciones de nivel (old → new)

### Presupuesto y reportes
- `monthly_budgets` — presupuesto planificado por mes (con `phase_budgets`)
- `monthly_reports` — reportes mensuales con análisis IA
- `sync_logs` — historial de sincronizaciones con Meta

### Gamificación y UX
- `achievement_definitions` — catálogo de 24 logros
- `user_achievements` — logros desbloqueados por usuario (con fecha)
- `notifications` — feed persistente de eventos del sistema

### Phase 4 (creadas, engines stubbed)
- `scaling_rules` + `scaling_rule_logs` — reglas de auto-scaling
- `forecasts` — proyecciones mensuales
- `ai_conversations` — memoria del chatbot estratega
- `creative_analysis` — scoring de creativos con IA
- `industry_benchmarks` — benchmarks por nicho (datos agregados)

---

## Flujo de datos end-to-end

```
1. Usuario registra → profiles + business_profiles
2. Usuario conecta Meta → facebook_connections (OAuth token)
3. Usuario configura pixel → pixel_analyzer lee eventos → pixel_analysis (level 0-8)
4. Onboarding engine detecta estado → guía hacia próximo paso
5. Usuario crea campaña:
   a. Wizard gateado por nivel (capabilities del pixel)
   b. IA genera copies/audiencias respetando el nivel
   c. Audience engine crea audiencias reales en Meta
   d. Strategy engine decide CBO vs ABO
   e. Publish campaign route → Meta API → campaigns.meta_campaign_id
   f. Notification: "🚀 Campaña publicada"
6. Cron diario:
   a. Meta sync engine → campaign_metrics_daily (por día, por ad set)
   b. Refresca pixel_analysis → puede disparar level_up
   c. Si es día 1 del mes: genera monthly_report
   d. Evaluate achievements → unlocks + notificaciones
   e. Notification: "Métricas sincronizadas"
7. Dashboards:
   a. HeroLevel muestra nivel + próximo objetivo
   b. PhaseSummary lee métricas reales agrupadas por fase
   c. Recommendation engine sugiere acciones
   d. AchievementsBadges muestra logros desbloqueados
8. Usuario opera campañas:
   a. Activate/pause/scale/duplicate desde UI
   b. Cada acción → campaign_actions + notification
9. Monthly report → email + análisis IA + notification
10. Loop se repite con cada nivel que desbloquea más capacidades
```

---

## Próximos módulos (arquitectura preparada, stubs en código)

| Módulo | Tabla(s) | Stub | Estado |
|---|---|---|---|
| **Autoscaling** | `scaling_rules`, `scaling_rule_logs` | `src/lib/autoscaling-engine.ts` | Esperando UI de reglas + trigger en cron |
| **Forecast** | `forecasts` | `src/lib/forecast-engine.ts` | Esperando 3+ meses de data histórica |
| **AI Strategist** | `ai_conversations` | `src/lib/ai-strategist.ts` | Esperando UI de chat + carga de contexto |
| **Creative Analysis** | `creative_analysis` | — | Esperando integración con Claude Vision |
| **Industry Benchmarks** | `industry_benchmarks` | — | Esperando pipeline de agregación anónima |

Cada stub está en `src/lib/` con `console.log` descriptivo y comentarios del flujo futuro planeado. Los tipos viven en `src/types/advanced.ts`.

---

## Cron jobs

| Endpoint | Schedule | Responsabilidad |
|---|---|---|
| `/api/cron/daily-report` | `0 11 * * *` (8 AM AR) | Sync metrics → pixel refresh → evaluate achievements → generar monthly report el día 1 → enviar email diario |

---

## Estándares de UI

- **Tipografía**: Syne para headers/métricas, DM Sans para body
- **Paleta**: `#e91e8c` fucsia primario, `#62c4b0` teal secundario, `#a855f7` púrpura (estratega), `#22c55e`/`#f59e0b`/`#ef4444` estados
- **Cards**: glassmorphism con `backdrop-filter: blur(20px)`, borde sutil, gradiente interno
- **Animaciones**: `dash-anim-1..8` en cascada (entrance), `glowPulse` (badges), `skeletonShimmer` (loading)
- **Empty states**: siempre motivadores con CTA claro, nunca "No hay datos" seco
- **Errors**: nunca stack traces, siempre mensaje amigable + reintentar/volver/contacto
- **Responsive**: sidebar colapsable en mobile, grids con `auto-fit minmax`
