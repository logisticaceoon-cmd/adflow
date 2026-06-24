# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AdFlow is a SaaS platform for creating and managing Facebook Ads campaigns with AI. Built in Spanish (UI and documentation). It integrates Claude AI for copy generation, Meta/Facebook Ads API for campaign management, Supabase for database/auth/storage, and Resend for emails.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint with Next.js config
```

No test framework is configured.

## Architecture

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase + Claude AI SDK

**Path alias:** `@/*` maps to `./src/*`

### Routing Structure

- `/` — Public landing page
- `/login`, `/register` — Auth pages (redirect if already logged in)
- `/dashboard/*` — Protected user area (campaigns, reports, billing, settings, etc.)
- `/admin/*` — Role-gated admin panel (users, campaigns, AI usage, events)
- `/api/*` — 42+ API routes
- `/auth/callback` — Supabase auth callback

**Middleware** (`src/middleware.ts`) handles auth checks and role-based routing for `/dashboard/*` and `/admin/*`.

### Key Directories

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — UI components organized by domain (`dashboard/`, `campaign/`, `admin/`, `ui/`, `labs/`)
- `src/lib/` — Business logic engines and utilities (~25 files)
- `src/types/index.ts` — All TypeScript interfaces (Profile, Campaign, AIStrategy, etc.)
- `src/hooks/` — React hooks (useCurrency)

### Business Logic Engines (`src/lib/`)

The core logic lives in specialized "engines" — large modules (10-25KB each) that encapsulate domain logic:

- `automation-engine.ts` — Rules for auto-scaling, pausing, budget allocation
- `decision-engine.ts` — AI-driven campaign decisions
- `campaign-intelligence.ts` — Campaign metric analysis
- `forecast-engine.ts` — Performance forecasting
- `budget-engine.ts` — Budget allocation logic
- `recommendation-engine.ts` — Action recommendations
- `meta-sync-engine.ts` — Facebook/Meta API data sync
- `achievement-engine.ts` — Gamification (badges, levels)
- `monthly-report-engine.ts` — Report generation with insights

### Authentication & Data Access

- **Supabase clients** in `src/lib/supabase/`:
  - `client.ts` — Browser client (`createBrowserClient`)
  - `server.ts` — Server client (`createServerClient`) + admin client (`createAdminClient`, bypasses RLS)
- **RLS policies** enforce user-level data isolation; admin operations use the service-role key
- **Facebook OAuth** flow: `/api/auth/facebook` → `/api/auth/facebook/callback`

### Database (Supabase PostgreSQL)

Schema in `supabase-schema.sql`. Core tables:
- `profiles` — Extends auth.users (plan, company, report settings)
- `fb_accounts` — Facebook ad account connections with tokens
- `campaigns` — Ad campaigns with JSONB fields for `ai_copies` and `metrics`
- `daily_reports` — Auto-generated report snapshots

### AI Integration

- API route: `/api/ai/generate-copies` (60s timeout, 1GB memory via Vercel config)
- Uses `@anthropic-ai/sdk` to generate campaign copies, headlines, ad sets, audience targeting
- Credit-based system: costs per action defined in `src/lib/credit-costs.ts`, plans in `src/lib/plans.ts`

### Campaign Creation

6-step wizard in `/dashboard/create`: Intención → Diagnóstico → Estrategia → Contenido → Revisión IA → Listo. Strategy types follow funnel stages: TOFU, MOFU, BOFU.

## Styling

- Tailwind CSS with custom design tokens in `tailwind.config.js` (brand colors, fluid typography, custom fonts)
- Fonts: Syne (display/headings), DM Sans (body text) — loaded via Next.js font system in root layout
- Space theme: dark glassmorphism aesthetic with `bg-space.png` background
- Large custom CSS file at `src/app/styles.css` (69KB)

## Environment Variables

Required in `.env.local` (see `.env.local.example`):
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- AI: `ANTHROPIC_API_KEY`
- Email: `RESEND_API_KEY`
- Meta: `NEXT_PUBLIC_META_APP_ID`, `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
- App: `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`

## Deployment

Deployed on Vercel. `vercel.json` configures:
- Cron job: `/api/cron/daily-report` at `0 11 * * *` (11 AM UTC)
- Extended timeout/memory for AI copy generation endpoint

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
