// src/app/dashboard/pixel/page.tsx — Redirect to settings (pixel config lives there)
import { redirect } from 'next/navigation'

export default function PixelPage() {
  redirect('/dashboard/settings')
}
