'use client'
import { createContext, useContext, useState, useCallback } from 'react'

interface SidebarContextValue {
  mobileOpen: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  mobileOpen: false,
  toggle: () => {},
  close: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggle = useCallback(() => setMobileOpen(v => !v), [])
  const close = useCallback(() => setMobileOpen(false), [])

  return (
    <SidebarContext.Provider value={{ mobileOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
