"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { useAuth } from "@/components/auth-provider"
import {
  createClientEvent,
  emptyClientWorkspace,
  previewFlagKeyFor,
  readClientViewMode,
  readClientWorkspace,
  sampleClientWorkspace,
  workspaceIsEmpty,
  writeClientViewMode,
  writeClientWorkspace,
  type ClientBookingStatus,
  type ClientEvent,
  type ClientNeedId,
  type ClientViewMode,
  type ClientWorkspace,
} from "@/lib/client-workspace"
import { canCloudSync, pullClientCloud, pushClientCloud } from "@/lib/cloud-sync"

type ClientContextValue = {
  ready: boolean
  notice: string | null
  dismissNotice: () => void
  viewMode: ClientViewMode
  showDemo: () => void
  showReal: () => void
  workspace: ClientWorkspace
  activeEvent: ClientEvent | null
  toggleShortlist: (partnerId: string) => void
  isShortlisted: (partnerId: string) => boolean
  addEvent: (input: {
    title: string
    date: string
    location: string
    city: string
  }) => ClientEvent
  setActiveEvent: (eventId: string | null) => void
  assignVendor: (
    eventId: string,
    needId: ClientNeedId,
    partnerId: string | null,
    status?: ClientBookingStatus
  ) => void
  setSlotStatus: (
    eventId: string,
    needId: ClientNeedId,
    status: ClientBookingStatus
  ) => void
}

const ClientContext = createContext<ClientContextValue | null>(null)

export function ClientProvider({ children }: { children: ReactNode }) {
  const { ready: authReady, user } = useAuth()
  const [ready, setReady] = useState(false)
  const [viewMode, setViewMode] = useState<ClientViewMode>("real")
  const [notice, setNotice] = useState<string | null>(null)
  const [workspace, setWorkspace] = useState<ClientWorkspace>(emptyClientWorkspace())
  const skipPersist = useRef(false)
  const viewModeRef = useRef<ClientViewMode>("real")
  const workspaceRef = useRef<ClientWorkspace>(emptyClientWorkspace())

  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  useEffect(() => {
    workspaceRef.current = workspace
  }, [workspace])

  useEffect(() => {
    if (!authReady) return
    let cancelled = false

    async function boot() {
      if (!user || user.role !== "client") {
        skipPersist.current = true
        setWorkspace(emptyClientWorkspace())
        workspaceRef.current = emptyClientWorkspace()
        setViewMode("real")
        viewModeRef.current = "real"
        setNotice(null)
        setReady(true)
        window.setTimeout(() => {
          skipPersist.current = false
        }, 0)
        return
      }

      let stored = readClientWorkspace(user.email)
      if (workspaceIsEmpty(stored) && canCloudSync(user.email)) {
        const cloud = await pullClientCloud(user.id)
        if (cloud && !workspaceIsEmpty(cloud)) {
          stored = cloud
          writeClientWorkspace(user.email, cloud)
        }
      }

      if (cancelled) return
      const city = user.city || "Bandung"
      // Jangan ganti mode otomatis — hanya ikut pilihan terakhir pengguna.
      const savedMode = readClientViewMode(user.email)

      skipPersist.current = true
      if (savedMode === "demo") {
        const demo = sampleClientWorkspace(city)
        setViewMode("demo")
        viewModeRef.current = "demo"
        setWorkspace(demo)
        workspaceRef.current = demo
        setNotice(null)
      } else {
        setViewMode("real")
        viewModeRef.current = "real"
        setWorkspace(stored)
        workspaceRef.current = stored
        setNotice(null)
      }
      setReady(true)
      window.setTimeout(() => {
        skipPersist.current = false
      }, 0)
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [authReady, user])

  useEffect(() => {
    if (!ready || !user || user.role !== "client") return
    if (skipPersist.current) return
    if (viewMode !== "real") return
    writeClientWorkspace(user.email, workspace)
    if (canCloudSync(user.email)) {
      void pushClientCloud(user, workspace)
    }
  }, [ready, user, viewMode, workspace])

  const value = useMemo<ClientContextValue>(() => {
    const activeEvent =
      workspace.events.find((event) => event.id === workspace.activeEventId) ||
      workspace.events[0] ||
      null

    function withActiveBase(updater: (base: ClientWorkspace) => ClientWorkspace) {
      const next = updater(workspaceRef.current)
      workspaceRef.current = next
      setWorkspace(next)
      return next
    }

    function showDemo() {
      if (!user) return
      if (viewModeRef.current === "real") {
        writeClientWorkspace(user.email, workspaceRef.current)
      }
      const demo = sampleClientWorkspace(user.city || "Bandung")
      skipPersist.current = true
      viewModeRef.current = "demo"
      writeClientViewMode(user.email, "demo")
      setViewMode("demo")
      setWorkspace(demo)
      workspaceRef.current = demo
      setNotice(
        "Menampilkan data contoh. Data real Anda tetap aman — mode hanya berubah jika Anda memilihnya."
      )
      window.setTimeout(() => {
        skipPersist.current = false
      }, 0)
    }

    function showReal() {
      if (!user) return
      const stored = readClientWorkspace(user.email)
      skipPersist.current = true
      viewModeRef.current = "real"
      writeClientViewMode(user.email, "real")
      setViewMode("real")
      setWorkspace(stored)
      workspaceRef.current = stored
      localStorage.setItem(previewFlagKeyFor(user.email), "1")
      setNotice(
        workspaceIsEmpty(stored)
          ? "Ini Data Saya — masih kosong. Buat acara atau cari vendor untuk mulai."
          : null
      )
      window.setTimeout(() => {
        skipPersist.current = false
      }, 0)
    }

    return {
      ready,
      notice,
      dismissNotice: () => setNotice(null),
      viewMode,
      showDemo,
      showReal,
      workspace,
      activeEvent,
      toggleShortlist: (partnerId) => {
        withActiveBase((current) => {
          const exists = current.shortlist.includes(partnerId)
          return {
            ...current,
            shortlist: exists
              ? current.shortlist.filter((id) => id !== partnerId)
              : [partnerId, ...current.shortlist],
          }
        })
      },
      isShortlisted: (partnerId) => workspace.shortlist.includes(partnerId),
      addEvent: (input) => {
        const event = createClientEvent(input)
        withActiveBase((current) => ({
          ...current,
          events: [event, ...current.events],
          activeEventId: event.id,
        }))
        return event
      },
      setActiveEvent: (eventId) => {
        withActiveBase((current) => ({ ...current, activeEventId: eventId }))
      },
      assignVendor: (eventId, needId, partnerId, status) => {
        withActiveBase((current) => ({
          ...current,
          events: current.events.map((event) => {
            if (event.id !== eventId) return event
            return {
              ...event,
              slots: event.slots.map((slot) =>
                slot.needId === needId
                  ? {
                      ...slot,
                      partnerId,
                      status:
                        status ??
                        (partnerId ? "menunggu_konfirmasi" : "belum_booking"),
                    }
                  : slot
              ),
            }
          }),
        }))
      },
      setSlotStatus: (eventId, needId, status) => {
        withActiveBase((current) => ({
          ...current,
          events: current.events.map((event) => {
            if (event.id !== eventId) return event
            return {
              ...event,
              slots: event.slots.map((slot) =>
                slot.needId === needId ? { ...slot, status } : slot
              ),
            }
          }),
        }))
      },
    }
  }, [ready, notice, viewMode, workspace, user])

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
}

export function useClientWorkspace() {
  const value = useContext(ClientContext)
  if (!value) {
    throw new Error("useClientWorkspace harus dipakai di dalam ClientProvider")
  }
  return value
}
