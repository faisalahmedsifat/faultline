"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { toast } from "sonner"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

function wsUrl(projectId: string): string {
  const base = API_BASE.replace(/^http/, "ws")
  return `${base}/ws/${projectId}`
}

type NewErrorEvent = {
  type: "new_error"
  errorId: string
  title: string
  count: number
}

type ConnectionState = "connecting" | "connected" | "disconnected"

interface ErrorLiveFeedProps {
  projectId: string
  className?: string
}

export function ErrorLiveFeed({ projectId, className }: ErrorLiveFeedProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [liveCount, setLiveCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionState("connecting")

    try {
      const socket = new WebSocket(wsUrl(projectId))
      wsRef.current = socket

      socket.onopen = () => {
        if (!mountedRef.current) return
        setConnectionState("connected")
        retriesRef.current = 0
      }

      socket.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(event.data) as NewErrorEvent
          if (data.type === "new_error" && data.title) {
            setLiveCount((prev) => prev + 1)
            toast(data.title, {
              description: data.count
                ? `This error has occurred ${data.count} ${data.count === 1 ? "time" : "times"}`
                : "New error received",
              duration: 5000
            })
          }
        } catch {
          // Ignore malformed messages
        }
      }

      socket.onclose = () => {
        if (!mountedRef.current) return
        setConnectionState("disconnected")
        wsRef.current = null

        const delay = Math.min(1000 * 2 ** retriesRef.current, 30000)
        retriesRef.current += 1
        timerRef.current = setTimeout(connect, delay)
      }

      socket.onerror = () => {
        // onclose will fire after onerror, reconnection handled there
      }
    } catch {
      // WebSocket constructor failed (e.g., invalid URL)
      if (mountedRef.current) {
        setConnectionState("disconnected")
        const delay = Math.min(1000 * 2 ** retriesRef.current, 30000)
        retriesRef.current += 1
        timerRef.current = setTimeout(connect, delay)
      }
    }
  }, [projectId])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      clearTimers()
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.onmessage = null
        wsRef.current.onerror = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect, clearTimers])

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        connectionState === "connected"
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600"
          : connectionState === "connecting"
            ? "border-amber-500/30 bg-amber-500/5 text-amber-600"
            : "border-border bg-muted/50 text-muted-foreground",
        className
      )}
      title={
        connectionState === "connected"
          ? "Live — receiving real-time updates"
          : connectionState === "connecting"
            ? "Connecting..."
            : "Disconnected — no real-time updates"
      }
    >
      {connectionState === "connected" ? (
        <>
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <Wifi className="size-3" />
        </>
      ) : connectionState === "connecting" ? (
        <>
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
          </span>
          <Wifi className="size-3" />
        </>
      ) : (
        <>
          <span className="size-2 rounded-full bg-muted-foreground/40" />
          <WifiOff className="size-3" />
        </>
      )}
      {liveCount > 0 && (
        <span className="tabular-nums">
          {liveCount} new
        </span>
      )}
    </div>
  )
}
