export type CaptureContext = {
  userId?: string
  route?: string
  metadata?: Record<string, unknown>
  level?: "error" | "warning" | "info"
}

export type IngestPayload = {
  title: string
  message?: string
  stack?: string
  route?: string
  file?: string
  line?: number
  col?: number
  env?: string
  level?: "error" | "warning" | "info"
  userId?: string
  metadata?: Record<string, unknown>
}

export type FaultlineOptions = {
  dsn?: string
  env?: string
  enabled?: boolean
  debug?: boolean
  fetch?: typeof fetch
}

export type ExpressLikeRequest = {
  originalUrl?: string
  url?: string
  route?: { path?: string }
}

export type ExpressLikeNext = (error?: unknown) => void

