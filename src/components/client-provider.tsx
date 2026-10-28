"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { useAuth } from "@/components/auth-provider"
import {
  createClientEvent,
  readClientWorkspace,
  writeClientWorkspace,
  type ClientBookingStatus,
  type ClientEvent,
  type ClientNeedId,
  type ClientWorkspace,
} from "@/lib/client-workspace"

type ClientContextValue = {
  ready: boolean
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
  const [workspace, setWorkspace] = useState<ClientWorkspace>({
    shortlist: [],
    events: [],
    activeEventId: null,
  })

  useEffect(() => {
    if (!authReady) return
    if (!user || user.role !== "client") {
      setWorkspace({ shortlist: [], events: [], activeEventId: null })
      setReady(true)
      return
    }
    setWorkspace(readClientWorkspace(user.email))
    setReady(true)
  }, [authReady, user])

  useEffect(() => {
    if (!ready || !user || user.role !== "client") return
    writeClientWorkspace(user.email, workspace)
  }, [ready, user, workspace])

  const value = useMemo<ClientContextValue>(() => {
    const activeEvent =
      workspace.events.find((event) => event.id === workspace.activeEventId) ||
      workspace.events[0] ||
      null

    return {
      ready,
      workspace,
      activeEvent,
      toggleShortlist: (partnerId) => {
        setWorkspace((current) => {
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
        setWorkspace((current) => ({
          ...current,
          events: [event, ...current.events],
          activeEventId: event.id,
        }))
        return event
      },
      setActiveEvent: (eventId) => {
        setWorkspace((current) => ({ ...current, activeEventId: eventId }))
      },
      assignVendor: (eventId, needId, partnerId, status) => {
        setWorkspace((current) => ({
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
        setWorkspace((current) => ({
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
  }, [ready, workspace])

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
}

export function useClientWorkspace() {
  const value = useContext(ClientContext)
  if (!value) {
    throw new Error("useClientWorkspace harus dipakai di dalam ClientProvider")
  }
  return value
}
