import { FaultlineClient } from "./client"
import type { CaptureContext, FaultlineEvents, FaultlineOptions } from "./types"

type EventHandler<E extends keyof FaultlineEvents> = (payload: FaultlineEvents[E]) => void

/**
 * # Pattern: Singleton + Observer
 * # Problem: Error capture must work from anywhere without passing an instance,
 *   and consumers need hooks to filter/enrich/log events.
 * # Solution: Faultline.init() creates a global singleton; Faultline.on() registers
 *   typed observers; Faultline.capture() delegates to the singleton.
 * # Trade-off: Global mutable state — justified because error tracking is
 *   a cross-cutting concern like logging. Multiple instances still work via constructor.
 */
export class Faultline {
  private static client: FaultlineClient | null = null
  private static listeners = new Map<keyof FaultlineEvents, Set<EventHandler<any>>>()

  // ── Singleton ──

  static init(options: FaultlineOptions = {}): typeof Faultline {
    Faultline.client = new FaultlineClient({
      ...options,
      onBeforeCapture: (payload) => {
        Faultline.emit("beforeCapture", payload)
        return payload
      },
      onAfterCapture: (payload) => {
        Faultline.emit("afterCapture", payload)
      },
      onCaptureError: (error, payload) => {
        Faultline.emit("captureError", { error: error.message, ...payload })
      }
    })
    return Faultline
  }

  static capture(error: unknown, context: CaptureContext = {}) {
    if (!Faultline.client) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        console.warn("Faultline not initialized — call Faultline.init() first")
      }
      return Promise.resolve()
    }
    return Faultline.client.capture(error, context)
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
    return async (
      error: unknown,
      req: { originalUrl?: string; url?: string; route?: { path?: string } },
      _res: unknown,
      next: (error?: unknown) => void
    ) => {
      await Faultline.capture(error, {
        route: req.originalUrl ?? req.route?.path ?? req.url
      })
      next(error)
    }
  }

  // ── Observer ──

  static on<E extends keyof FaultlineEvents>(
    event: E,
    handler: EventHandler<E>
  ): () => void {
    if (!Faultline.listeners.has(event)) {
      Faultline.listeners.set(event, new Set())
    }
    Faultline.listeners.get(event)!.add(handler)
    return () => Faultline.off(event, handler)
  }

  static off<E extends keyof FaultlineEvents>(
    event: E,
    handler: EventHandler<E>
  ) {
    Faultline.listeners.get(event)?.delete(handler)
  }

  private static emit<E extends keyof FaultlineEvents>(
    event: E,
    payload: FaultlineEvents[E]
  ) {
    Faultline.listeners.get(event)?.forEach((fn) => {
      try { fn(payload) } catch { /* observer errors must never propagate */ }
    })
  }

  // ── Instance (isolated, for testing or multi-project use) ──

  private client: FaultlineClient

  constructor(options: FaultlineOptions = {}) {
    this.client = new FaultlineClient(options)
  }

  capture(error: unknown, context: CaptureContext = {}) {
    return this.client.capture(error, context)
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

export type { CaptureContext, FaultlineOptions }
export type { IngestPayload, FaultlineEvents } from "./types"
export { FaultlineClient } from "./client"
