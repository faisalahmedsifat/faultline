import { FaultlineClient } from "./client"
import type { CaptureContext, FaultlineOptions } from "./types"

type FaultlineEvent = "beforeCapture" | "afterCapture" | "captureError"
type EventHandler = (payload: Record<string, unknown>) => void

// ── Faultline (singleton + observer) ──

export class Faultline {
  private static client: FaultlineClient | null = null
  private static listeners = new Map<FaultlineEvent, Set<EventHandler>>()

  static init(options: FaultlineOptions = {}) {
    if (Faultline.client) {
      if (options.debug) {
        console.warn("Faultline already initialized — re-initializing with new options")
      }
    }

    Faultline.client = new FaultlineClient({
      ...options,
      onBeforeCapture: (payload) => {
        Faultline.emit("beforeCapture", { ...payload })
        return payload
      },
      onAfterCapture: (payload) => {
        Faultline.emit("afterCapture", { ...payload })
      },
      onCaptureError: (error, payload) => {
        Faultline.emit("captureError", { error: error.message, ...payload })
      }
    })

    return Faultline
  }

  static capture(error: unknown, context: CaptureContext = {}) {
    const client = Faultline.client
    if (!client) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        console.warn("Faultline not initialized — call Faultline.init() first")
      }
      return Promise.resolve()
    }
    return client.capture(error, context)
  }

  static withCapture<TArgs extends unknown[], TResult>(
    handler: (...args: TArgs) => TResult | Promise<TResult>,
    getContext?: (error: unknown, args: TArgs) => CaptureContext
  ) {
    return async (...args: TArgs): Promise<TResult> => {
      try {
        return await handler(...args)
      } catch (error) {
        const context = getContext ? getContext(error, args) : inferContext(args)
        await Faultline.capture(error, context)
        throw error
      }
    }
  }

  static expressHandler() {
    return async (error: unknown, req: ExpressLikeRequest, _res: unknown, next: ExpressLikeNext) => {
      await Faultline.capture(error, {
        route: req.originalUrl ?? req.route?.path ?? req.url
      })
      next(error)
    }
  }

  static on(event: FaultlineEvent, handler: EventHandler) {
    if (!Faultline.listeners.has(event)) {
      Faultline.listeners.set(event, new Set())
    }
    Faultline.listeners.get(event)!.add(handler)
    return () => Faultline.off(event, handler)
  }

  static off(event: FaultlineEvent, handler: EventHandler) {
    Faultline.listeners.get(event)?.delete(handler)
  }

  static emit(event: FaultlineEvent, payload: Record<string, unknown>) {
    Faultline.listeners.get(event)?.forEach((fn) => {
      try {
        fn(payload)
      } catch {
        // observer errors must never propagate
      }
    })
  }

  private client: FaultlineClient | null = null

  constructor(options: FaultlineOptions = {}) {
    this.client = new FaultlineClient(options)
  }

  capture(error: unknown, context: CaptureContext = {}) {
    return this.client!.capture(error, context)
  }

  withCapture = Faultline.withCapture
  expressHandler = Faultline.expressHandler
}

// ── Helpers ──

function inferContext(args: unknown[]): CaptureContext {
  const [first] = args
  if (first && typeof first === "object" && "url" in first && typeof first.url === "string") {
    try {
      return { route: new URL(first.url).pathname }
    } catch {
      return { route: first.url }
    }
  }
  return {}
}

type ExpressLikeRequest = {
  originalUrl?: string
  url?: string
  route?: { path?: string }
}
type ExpressLikeNext = (error?: unknown) => void

export type { CaptureContext, FaultlineOptions }
export { FaultlineClient } from "./client"
export type { IngestPayload } from "./types"
