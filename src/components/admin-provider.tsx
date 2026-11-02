"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  DEFAULT_ADMIN_SETTINGS,
  normalizeAdminSettings,
  readAdminSettings,
  writeAdminSettings,
  type AdminSettings,
} from "@/lib/admin-settings"

type AdminContextValue = {
  ready: boolean
  settings: AdminSettings
  saveSettings: (next: AdminSettings) => AdminSettings
  resetSettings: () => AdminSettings
  refresh: () => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS)

  const refresh = useCallback(() => {
    setSettings(readAdminSettings())
  }, [])

  useEffect(() => {
    refresh()
    setReady(true)
  }, [refresh])

  const value = useMemo<AdminContextValue>(
    () => ({
      ready,
      settings,
      saveSettings: (next) => {
        const saved = writeAdminSettings(normalizeAdminSettings(next))
        setSettings(saved)
        return saved
      },
      resetSettings: () => {
        const saved = writeAdminSettings(DEFAULT_ADMIN_SETTINGS)
        setSettings(saved)
        return saved
      },
      refresh,
    }),
    [ready, refresh, settings]
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdminSettings() {
  const ctx = useContext(AdminContext)
  if (!ctx) {
    throw new Error("useAdminSettings harus dipakai di dalam AdminProvider")
  }
  return ctx
}
