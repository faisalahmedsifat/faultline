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
  readonly options: Required<Pick<FaultlineOptions, "enabled" | "debug" | "env">> &
    Pick<FaultlineOptions, "dsn" | "fetch">

  constructor(options: FaultlineOptions = {}) {
    this.options = {
      dsn: options.dsn,
      env: options.env ?? "production",
      enabled: options.enabled ?? true,
      debug: options.debug ?? false,
      fetch: options.fetch
    }
  }

  capture(error: unknown, context: CaptureContext = {}) {
    if (!this.options.enabled) {
      return Promise.resolve()
    }

    if (!this.options.dsn) {
      this.warn("Faultline DSN is not configured")
      return Promise.resolve()
    }

    const payload = buildPayload(error, {
      ...context,
      env: this.options.env
    })

    return this.send(payload)
  }

  private async send(payload: IngestPayload) {
    const fetchImpl = this.options.fetch ?? globalThis.fetch

    if (typeof fetchImpl !== "function") {
      this.warn("Global fetch is not available in this runtime")
      return
    }

    try {
      await fetchImpl(this.options.dsn as string, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      this.warn(
        `Faultline capture failed: ${error instanceof Error ? error.message : "unknown error"}`
      )
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
  context: CaptureContext & { env: string }
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
    metadata: context.metadata
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

