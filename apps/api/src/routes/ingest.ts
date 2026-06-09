import { eq, sql } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

import { db } from "../db/client"
import { errors, projects } from "../db/schema"
import { AppError } from "../lib/errors"
import { fingerprint } from "../lib/fingerprint"
import { handleAlertSideEffects } from "../lib/ingest"
import { createId } from "../lib/id"
import { jsonOk } from "../lib/http"

const paramsSchema = z.object({
  dsnKey: z.string().min(1)
})

const ingestPayloadSchema = z.object({
  title: z.string().min(1),
  message: z.string().optional(),
  stack: z.string().optional(),
  route: z.string().optional(),
  file: z.string().optional(),
  line: z.number().int().optional(),
  col: z.number().int().optional(),
  env: z.string().optional(),
  level: z.enum(["error", "warning", "info"]).optional(),
  userId: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  release: z.string().optional()
})

type IngestPayload = z.infer<typeof ingestPayloadSchema>

export const ingestRouter = new Hono()

ingestRouter.post("/ingest/:dsnKey", async (c) => {
  const parsedParams = paramsSchema.safeParse(c.req.param())

  if (!parsedParams.success) {
    throw new AppError({
      code: "invalid_dsn_key",
      message: "Invalid DSN key",
      statusCode: 400,
      details: parsedParams.error.flatten()
    })
  }

  let rawBody: unknown

  try {
    rawBody = await c.req.json()
  } catch {
    throw new AppError({
      code: "invalid_json",
      message: "Request body must be valid JSON",
      statusCode: 400
    })
  }

  const parsedBody = ingestPayloadSchema.safeParse(rawBody)

  if (!parsedBody.success) {
    throw new AppError({
      code: "invalid_ingest_payload",
      message: "Invalid ingest payload",
      statusCode: 400,
      details: parsedBody.error.flatten()
    })
  }

  const [project] = await db
    .select({
      id: projects.id
    })
    .from(projects)
    .where(eq(projects.dsnKey, parsedParams.data.dsnKey))
    .limit(1)

  if (!project) {
    throw new AppError({
      code: "project_not_found",
      message: "Project not found",
      statusCode: 404
    })
  }

  const payload = parsedBody.data
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
      level: payload.level ?? "error",
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
        stack: payload.stack ?? undefined,
        route: payload.route ?? undefined,
        file: payload.file ?? undefined,
        line: payload.line ?? undefined,
        col: payload.col ?? undefined,
        env: payload.env ?? undefined,
        level: payload.level ?? undefined,
        metadata: payload.metadata ?? undefined,
        release: payload.release ?? undefined,
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

  await handleAlertSideEffects(project.id, errorRecord, "ingest")

  return jsonOk(c, { accepted: true, errorId: errorRecord.id }, 202)
})
