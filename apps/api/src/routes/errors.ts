import { and, desc, eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

import { db } from "../db/client"
import { errors, projects } from "../db/schema"
import { AppError } from "../lib/errors"
import { jsonOk } from "../lib/http"

const errorStatusSchema = z.enum(["open", "ignored", "resolved"])

const listErrorsQuerySchema = z.object({
  projectId: z.string().min(1),
  status: errorStatusSchema.optional(),
  env: z.string().min(1).optional()
})

const errorParamsSchema = z.object({
  id: z.string().min(1)
})

const patchErrorSchema = z.object({
  status: errorStatusSchema
})

type ErrorListItemDto = {
  id: string
  projectId: string
  title: string
  message: string | null
  route: string | null
  file: string | null
  line: number | null
  env: string | null
  level: string | null
  status: "open" | "ignored" | "resolved"
  count: number
  userCount: number
  firstSeen: string
  lastSeen: string
}

type ErrorDetailDto = ErrorListItemDto & {
  fingerprint: string
  stack: string | null
  col: number | null
  metadata: Record<string, unknown> | null
  users: string[]
}

export const errorsRouter = new Hono()

errorsRouter.get("/api/errors", async (c) => {
  const query = listErrorsQuerySchema.safeParse(c.req.query())

  if (!query.success) {
    throw new AppError({
      code: "invalid_errors_query",
      message: "projectId is required",
      statusCode: 400,
      details: query.error.flatten()
    })
  }

  await assertProjectExists(query.data.projectId)

  const filters = [eq(errors.projectId, query.data.projectId)]

  if (query.data.status) {
    filters.push(eq(errors.status, query.data.status))
  }

  if (query.data.env) {
    filters.push(eq(errors.env, query.data.env))
  }

  const rows = await db
    .select({
      id: errors.id,
      projectId: errors.projectId,
      title: errors.title,
      message: errors.message,
      route: errors.route,
      file: errors.file,
      line: errors.line,
      env: errors.env,
      level: errors.level,
      status: errors.status,
      count: errors.count,
      userCount: errors.userCount,
      firstSeen: errors.firstSeen,
      lastSeen: errors.lastSeen
    })
    .from(errors)
    .where(and(...filters))
    .orderBy(desc(errors.lastSeen))

  return jsonOk(c, {
    projectId: query.data.projectId,
    filters: {
      status: query.data.status ?? null,
      env: query.data.env ?? null
    },
    errors: rows.map((row) => ({
      ...row,
      status: row.status as ErrorListItemDto["status"],
      firstSeen: row.firstSeen.toISOString(),
      lastSeen: row.lastSeen.toISOString()
    }))
  })
})

errorsRouter.get("/api/errors/:id", async (c) => {
  const params = errorParamsSchema.parse(c.req.param())

  const [row] = await db
    .select({
      id: errors.id,
      projectId: errors.projectId,
      fingerprint: errors.fingerprint,
      title: errors.title,
      message: errors.message,
      stack: errors.stack,
      route: errors.route,
      file: errors.file,
      line: errors.line,
      col: errors.col,
      env: errors.env,
      level: errors.level,
      status: errors.status,
      count: errors.count,
      userCount: errors.userCount,
      firstSeen: errors.firstSeen,
      lastSeen: errors.lastSeen,
      metadata: errors.metadata,
      users: errors.users
    })
    .from(errors)
    .where(eq(errors.id, params.id))
    .limit(1)

  if (!row) {
    throw new AppError({
      code: "error_not_found",
      message: "Error not found",
      statusCode: 404
    })
  }

  const errorDetail: ErrorDetailDto = {
    ...row,
    status: row.status as ErrorDetailDto["status"],
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    firstSeen: row.firstSeen.toISOString(),
    lastSeen: row.lastSeen.toISOString()
  }

  return jsonOk(c, {
    error: errorDetail
  })
})

errorsRouter.patch("/api/errors/:id", async (c) => {
  const params = errorParamsSchema.parse(c.req.param())

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

  const payload = patchErrorSchema.parse(rawBody)

  const [row] = await db
    .update(errors)
    .set({
      status: payload.status
    })
    .where(eq(errors.id, params.id))
    .returning({
      id: errors.id,
      projectId: errors.projectId,
      title: errors.title,
      message: errors.message,
      route: errors.route,
      file: errors.file,
      line: errors.line,
      env: errors.env,
      level: errors.level,
      status: errors.status,
      count: errors.count,
      userCount: errors.userCount,
      firstSeen: errors.firstSeen,
      lastSeen: errors.lastSeen
    })

  if (!row) {
    throw new AppError({
      code: "error_not_found",
      message: "Error not found",
      statusCode: 404
    })
  }

  return jsonOk(c, {
    error: {
      ...row,
      status: row.status as ErrorListItemDto["status"],
      firstSeen: row.firstSeen.toISOString(),
      lastSeen: row.lastSeen.toISOString()
    }
  })
})

async function assertProjectExists(projectId: string) {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)

  if (!project) {
    throw new AppError({
      code: "project_not_found",
      message: "Project not found",
      statusCode: 404
    })
  }
}

