export type CaptureContext = {
  userId?: string
  route?: string
  metadata?: Record<string, unknown>
  level?: "error" | "warning" | "info"
  release?: string
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
  release?: string
}

export type FaultlineOptions = {
  baseUrl?: string
  dsn?: string
  env?: string
  release?: string
  enabled?: boolean
  debug?: boolean
  fetch?: typeof fetch
  onBeforeCapture?: (payload: IngestPayload) => IngestPayload | void
  onAfterCapture?: (payload: IngestPayload) => void
  onCaptureError?: (error: Error, payload: IngestPayload) => void
}

export type FaultlineEvents = {
  beforeCapture: IngestPayload
  afterCapture: IngestPayload
  captureError: IngestPayload & { error: string }
}

export type ExpressLikeRequest = {
  originalUrl?: string
  url?: string
  route?: { path?: string }
}
export type ExpressLikeNext = (error?: unknown) => void
