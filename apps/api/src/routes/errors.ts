import { and, desc, eq, sql } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

import { db } from "../db/client"
import { resolveStack } from "../lib/sourcemap"
import { errors, projects } from "../db/schema"
import { AppError } from "../lib/errors"
import { jsonOk } from "../lib/http"
import { parseJsonBody } from "../middleware/parse-json"
import { assertProjectExists } from "../lib/project"

const errorStatusSchema = z.enum(["open", "ignored", "resolved"])

const listErrorsQuerySchema = z.object({
  projectId: z.string().min(1),
  status: errorStatusSchema.optional(),
  env: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).optional()
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
  release: string | null
}

type ErrorDetailDto = ErrorListItemDto & {
  fingerprint: string
  stack: string | null
  col: number | null
  metadata: Record<string, unknown> | null
  users: string[]
  resolvedStack: Record<string, unknown>[] | null
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

  if (query.data.search) {
    const sanitized = query.data.search.replace(/%/g, '\\%').replace(/_/g, '\\_')
    const pattern = `%${sanitized}%`
    filters.push(
      sql`(${errors.title} ILIKE ${pattern} ESCAPE '\\' OR ${errors.message} ILIKE ${pattern} ESCAPE '\\')`
    )
  }

  const where = and(...filters)
  const { page, pageSize } = query.data

  const [rows, [totalRow]] = await Promise.all([
    db
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
        lastSeen: errors.lastSeen,
        release: errors.release
      })
      .from(errors)
      .where(where)
      .orderBy(desc(errors.lastSeen))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: sql<number>`count(*)` }).from(errors).where(where)
  ])

  const total = Number(totalRow.total)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return jsonOk(c, {
    projectId: query.data.projectId,
    filters: {
      status: query.data.status ?? null,
      env: query.data.env ?? null,
      search: query.data.search ?? null
    },
    pagination: { page, pageSize, total, totalPages },
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
      release: errors.release,
      resolvedStack: errors.resolvedStack,
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

  // Resolve source maps if we have a release and stack but no cached resolution
  let resolvedStack: Record<string, unknown>[] | null =
    (row.resolvedStack as Record<string, unknown>[] | null) ?? null

  if (!resolvedStack && row.release && row.stack) {
    try {
      const frames = await resolveStack(row.id, row.projectId, row.stack, row.release)
      if (frames.length > 0) {
        resolvedStack = frames as unknown as Record<string, unknown>[]
      }
    } catch {
      // Resolution failure shouldn't block the detail response
    }
  }

  const errorDetail: ErrorDetailDto = {
    ...row,
    status: row.status as ErrorDetailDto["status"],
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    resolvedStack,
    firstSeen: row.firstSeen.toISOString(),
    lastSeen: row.lastSeen.toISOString()
  }

  return jsonOk(c, {
    error: errorDetail
  })
})

errorsRouter.patch("/api/errors/:id", async (c) => {
  const params = errorParamsSchema.parse(c.req.param())

  const rawBody = await parseJsonBody(c)
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
