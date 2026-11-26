// src/app/dashboard/phases/page.tsx — Redirect to Reportes
import { redirect } from 'next/navigation'

export default function PhasesPage() {
  redirect('/dashboard/reports')
}
