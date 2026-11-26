// src/app/dashboard/billing/page.tsx — Redirect to Configuración
import { redirect } from 'next/navigation'

export default function BillingPage() {
  redirect('/dashboard/settings')
}
