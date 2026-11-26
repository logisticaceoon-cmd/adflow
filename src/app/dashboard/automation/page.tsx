// src/app/dashboard/automation/page.tsx — Redirect to dashboard
import { redirect } from 'next/navigation'

export default function AutomationPage() {
  redirect('/dashboard')
}
