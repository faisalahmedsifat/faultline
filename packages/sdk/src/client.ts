import type { CaptureContext, FaultlineOptions, IngestPayload } from "./types"

type NormalizedError = {
  title: string
  message?: string
  stack?: string
  file?: string
  line?: number
  col?: number
}

export class FaultlineClient {
  readonly options: {
    dsn: string | undefined
    baseUrl: string | undefined
    env: string
    release: string | undefined
    enabled: boolean
    debug: boolean
    fetch: typeof fetch | undefined
    onBeforeCapture: ((payload: IngestPayload) => IngestPayload | void) | undefined
    onAfterCapture: ((payload: IngestPayload) => void) | undefined
    onCaptureError: ((error: Error, payload: IngestPayload) => void) | undefined
  }

  constructor(options: FaultlineOptions = {}) {
    this.options = {
      dsn: options.dsn ?? process.env.FAULTLINE_DSN,
      baseUrl: options.baseUrl ?? process.env.FAULTLINE_BASE_URL ?? "https://faultline.dev",
      env: options.env ?? process.env.NODE_ENV ?? "production",
      release: options.release ?? process.env.FAULTLINE_RELEASE,
      enabled: options.enabled ?? true,
      debug: options.debug ?? false,
      fetch: options.fetch,
      onBeforeCapture: options.onBeforeCapture,
      onAfterCapture: options.onAfterCapture,
      onCaptureError: options.onCaptureError
    }
  }

  capture(error: unknown, context: CaptureContext = {}) {
    if (!this.options.enabled) {
      return Promise.resolve()
    }

    if (!this.options.dsn) {
      this.warn("FAULTLINE_DSN is not set")
      return Promise.resolve()
    }

    let payload = buildPayload(error, {
      ...context,
      env: this.options.env,
      release: context.release ?? this.options.release
    })

    if (this.options.onBeforeCapture) {
      const modified = this.options.onBeforeCapture(payload)
      if (modified) payload = modified
    }

    return this.send(payload)
  }

  private buildIngestUrl(): string {
    return `${this.options.baseUrl}/ingest/${this.options.dsn}`
  }

  private async send(payload: IngestPayload) {
    const fetchImpl = this.options.fetch ?? globalThis.fetch

    if (typeof fetchImpl !== "function") {
      this.warn("Global fetch is not available in this runtime")
      return
    }

    try {
      await fetchImpl(this.buildIngestUrl(), {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      this.options.onAfterCapture?.(payload)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.options.onCaptureError?.(err, payload)
      this.warn(`Faultline capture failed: ${err.message}`)
    }
  }

  private warn(message: string) {
    if (this.options.debug) {
      console.warn(message)
    }
  }
}

function buildPayload(
  error: unknown,
  context: CaptureContext & { env: string; release?: string }
): IngestPayload {
  const normalized = normalizeError(error)

  return {
    title: normalized.title,
    message: normalized.message,
    stack: normalized.stack,
    file: normalized.file,
    line: normalized.line,
    col: normalized.col,
    route: context.route,
    env: context.env,
    level: context.level ?? "error",
    userId: context.userId,
    metadata: context.metadata,
    release: context.release
  }
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    const stackLocation = parseStackLocation(error.stack)

    return {
      title: error.name || "Error",
      message: error.message,
      stack: error.stack,
      file: stackLocation?.file,
      line: stackLocation?.line,
      col: stackLocation?.col
    }
  }

  if (typeof error === "string") {
    return {
      title: "Error",
      message: error
    }
  }

  return {
    title: "UnknownError",
    message: safeJson(error)
  }
}

function parseStackLocation(stack?: string) {
  if (!stack) {
    return undefined
  }

  const lines = stack.split("\n")

  for (const line of lines) {
    const match = line.match(/\(?([^\s()]+):(\d+):(\d+)\)?$/)

    if (match) {
      return {
        file: match[1],
        line: Number(match[2]),
        col: Number(match[3])
      }
    }
  }

  return undefined
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

