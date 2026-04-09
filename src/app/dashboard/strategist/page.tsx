// src/app/dashboard/strategist/page.tsx
// Legacy route — the Estratega IA "coming soon" page is now consolidated
// under /dashboard/labs (AI Strategist is feature #1). Redirecting here so
// any existing bookmarks / notification links keep working.
import { redirect } from 'next/navigation'

export default function StrategistPage() {
  redirect('/dashboard/labs')
}
