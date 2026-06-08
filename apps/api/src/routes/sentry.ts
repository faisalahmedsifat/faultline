import { Hono } from "hono"
import { sql, eq } from "drizzle-orm"

import { db } from "../db/client"
import { errors, projects } from "../db/schema"
import { AppError } from "../lib/errors"
import { fingerprint } from "../lib/fingerprint"
import { handleAlertSideEffects } from "../lib/ingest"
import { createId } from "../lib/id"
import { jsonOk } from "../lib/http"
import { logger } from "../lib/logger"

// ── Sentry-compatible ingest ──
// Accepts POST /api/{dsn_key}/store/ from any Sentry SDK
// The dsn_key maps to faultline's dsn_key on the projects table
// Sentry DSN format: https://{anything}@{host}/{dsn_key}

type SentryEvent = {
  event_id?: string
  level?: string
  environment?: string
  transaction?: string
  request?: { url?: string; method?: string }
  user?: { id?: string; email?: string; username?: string }
  exception?: {
    values?: Array<{
      type?: string
      value?: string
      stacktrace?: {
        frames?: Array<{
          filename?: string
          function?: string
          lineno?: number
          colno?: number
          abs_path?: string
          context_line?: string
        }>
      }
    }>
  }
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  breadcrumbs?: unknown[]
  modules?: Record<string, string>
}

function parseEnvelope(body: string): SentryEvent | null {
  const lines = body.split("\n").filter((l) => l.trim())

  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = JSON.parse(lines[i])
      // The envelope header and item header are metadata
      // The actual event JSON has exception, event_id, etc.
      if (parsed.exception || parsed.event_id || parsed.message || parsed.logentry) {
        return parsed as SentryEvent
      }
    } catch {
      continue
    }
  }

  return null
}

type SentryFrame = {
  filename?: string
  function?: string
  lineno?: number
  colno?: number
  abs_path?: string
  context_line?: string
}

function buildStackTrace(frames?: SentryFrame[]): string {
  if (!frames || frames.length === 0) return ""

  return frames
    .map((f: SentryFrame) => {
      const file = f.abs_path ?? f.filename ?? "<unknown>"
      const fn = f.function ?? "<anonymous>"
      const line = f.lineno ?? "?"
      const col = f.colno ?? ""
      const context = f.context_line ? `\n    ${f.context_line.trim()}` : ""
      return `  at ${fn} (${file}:${line}:${col})${context}`
    })
    .join("\n")
}

function mapSentryToIngest(event: SentryEvent): {
  title: string
  message?: string
  stack?: string
  route?: string
  file?: string
  line?: number
  col?: number
  env?: string
  level: string
  userId?: string
  metadata?: Record<string, unknown>
  release?: string
} {
  const exc = event.exception?.values?.[0]
  const topFrame = exc?.stacktrace?.frames?.[0]

  return {
    title: exc?.type ?? event.event_id ?? "Error",
    message: exc?.value,
    stack: exc?.stacktrace?.frames
      ? buildStackTrace(exc.stacktrace.frames)
      : undefined,
    route: event.request?.url
      ? new URL(event.request.url, "http://localhost").pathname
      : event.transaction,
    file: topFrame?.filename ?? topFrame?.abs_path,
    line: topFrame?.lineno,
    col: topFrame?.colno,
    env: event.environment,
    level: mapLevel(event.level),
    userId: event.user?.id ?? event.user?.email ?? event.user?.username,
    metadata: {
      ...event.tags,
      ...event.extra,
      sentry_event_id: event.event_id
    },
    release: event.tags?.release ?? event.extra?.release as string
  }
}

function mapLevel(level?: string): "error" | "warning" | "info" {
  switch (level) {
    case "fatal":
    case "error":
      return "error"
    case "warning":
      return "warning"
    case "info":
    case "debug":
      return "info"
    default:
      return "error"
  }
}

export const sentryRouter = new Hono()

sentryRouter.post("/api/:projectId/store", async (c) => {
  // Sentry DSN format: https://{dsn_key}@{host}/{project_id}
  // The dsn_key is sent as sentry_key in the X-Sentry-Auth header
  const urlProjectId = c.req.param("projectId")
  const authHeader = c.req.header("x-sentry-auth") ?? ""
  const keyMatch = authHeader.match(/sentry_key=([^,]+)/)
  const dsnKey = keyMatch ? keyMatch[1] : null

  if (!dsnKey) {
    throw new AppError({
      code: "invalid_dsn_key",
      message: "Missing sentry_key in X-Sentry-Auth header",
      statusCode: 400
    })
  }

  // Sentry sends the body as raw text (envelope format)
  const contentType = c.req.header("content-type") ?? ""
  let body: string

  try {
    body = await c.req.text()
  } catch {
    throw new AppError({
      code: "invalid_body",
      message: "Request body is required",
      statusCode: 400
    })
  }

  // Parse envelope — extract the event JSON
  const event = parseEnvelope(body)

  if (!event) {
    logger.warn("sentry.invalid_envelope", { dsnKey, body: body.slice(0, 500) })
    throw new AppError({
      code: "invalid_envelope",
      message: "Could not parse Sentry envelope",
      statusCode: 400
    })
  }

  // Lookup project
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.dsnKey, dsnKey))
    .limit(1)

  if (!project) {
    throw new AppError({
      code: "project_not_found",
      message: "Project not found",
      statusCode: 404
    })
  }

  // Validate the project ID in the URL matches the project bound to this DSN key
  if (project.id !== urlProjectId) {
    throw new AppError({
      code: "project_id_mismatch",
      message: "Project ID in DSN path does not match the DSN key",
      statusCode: 400
    })
  }

  // Map to faultline format and ingest
  const payload = mapSentryToIngest(event)
  const errorId = createId("err")
  const digest = fingerprint(payload)
  const now = new Date()

  const [errorRecord] = await db
    .insert(errors)
    .values({
      id: errorId,
      projectId: project.id,
      fingerprint: digest,
      title: payload.title,
      message: payload.message,
      stack: payload.stack,
      route: payload.route,
      file: payload.file,
      line: payload.line,
      col: payload.col,
      env: payload.env,
      level: payload.level,
      status: "open",
      count: 1,
      userCount: payload.userId ? 1 : 0,
      firstSeen: now,
      lastSeen: now,
      metadata: payload.metadata ?? null,
      release: payload.release ?? null,
      users: payload.userId ? [payload.userId] : []
    })
    .onConflictDoUpdate({
      target: [errors.projectId, errors.fingerprint],
      set: {
        count: sql`${errors.count} + 1`,
        lastSeen: now,
        message: payload.message ?? undefined,
        release: payload.release ?? undefined,
        stack: payload.stack ?? undefined,
        route: payload.route ?? undefined,
        file: payload.file ?? undefined,
        line: payload.line ?? undefined,
        col: payload.col ?? undefined,
        env: payload.env ?? undefined,
        level: payload.level ?? undefined,
        metadata: payload.metadata ?? undefined,
        users: payload.userId
          ? sql`CASE
              WHEN ${payload.userId} = ANY(${errors.users}) THEN ${errors.users}
              ELSE array_append(${errors.users}, ${payload.userId})
            END`
          : undefined,
        userCount: payload.userId
          ? sql`CASE
              WHEN ${payload.userId} = ANY(${errors.users}) THEN ${errors.userCount}
              ELSE ${errors.userCount} + 1
            END`
          : undefined
      }
    })
    .returning({
      id: errors.id,
      title: errors.title,
      count: errors.count,
      env: errors.env,
      route: errors.route
    })

  await handleAlertSideEffects(project.id, errorRecord, "sentry")

  // Sentry expects 200, not 202
  return jsonOk(c, { id: event.event_id ?? errorRecord.id }, 200)
})
