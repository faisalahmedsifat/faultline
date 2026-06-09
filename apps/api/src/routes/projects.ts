import { and, desc, eq, sql } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

import { db } from "../db/client"
import { alerts, errors, projects } from "../db/schema"
import { AppError } from "../lib/errors"
import { jsonOk } from "../lib/http"
import { createId } from "../lib/id"
import { dailyCountKey } from "../lib/ingest"
import { logger } from "../lib/logger"
import { assertProjectExists, buildDsnUrl, buildSentryDsnUrl } from "../lib/project"
import { redisConnection } from "../lib/redis"
import { createToken } from "../lib/tokens"
import { parseJsonBody } from "../middleware/parse-json"

const projectParamsSchema = z.object({
  id: z.string().min(1)
})

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120)
})

type ProjectDto = {
  id: string
  name: string
  dsnKey: string
  dsn: string
  sentryDsn: string
  createdAt: string
}

export const projectsRouter = new Hono()

projectsRouter.get("/api/projects", async (c) => {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      dsnKey: projects.dsnKey,
      createdAt: projects.createdAt
    })
    .from(projects)
    .orderBy(desc(projects.createdAt))

  return jsonOk(c, {
    projects: rows.map(serializeProject)
  })
})

projectsRouter.post("/api/projects", async (c) => {
  const rawBody = await parseJsonBody(c)
  const payload = createProjectSchema.parse(rawBody)

  const [project] = await db
    .insert(projects)
    .values({
      id: createId("prj"),
      name: payload.name,
      dsnKey: createToken(24)
    })
    .returning({
      id: projects.id,
      name: projects.name,
      dsnKey: projects.dsnKey,
      createdAt: projects.createdAt
    })

  return jsonOk(
    c,
    {
      project: serializeProject(project)
    },
    201
  )
})

projectsRouter.put("/api/projects/:id/rotate-dsn", async (c) => {
  const params = projectParamsSchema.parse(c.req.param())

  const [project] = await db
    .update(projects)
    .set({
      dsnKey: createToken(24)
    })
    .where(eq(projects.id, params.id))
    .returning({
      id: projects.id,
      name: projects.name,
      dsnKey: projects.dsnKey,
      createdAt: projects.createdAt
    })

  if (!project) {
    throw new AppError({
      code: "project_not_found",
      message: "Project not found",
      statusCode: 404
    })
  }

  return jsonOk(c, {
    project: serializeProject(project)
  })
})

projectsRouter.get("/api/projects/:id", async (c) => {
  const params = projectParamsSchema.parse(c.req.param())

  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      dsnKey: projects.dsnKey,
      createdAt: projects.createdAt
    })
    .from(projects)
    .where(eq(projects.id, params.id))
    .limit(1)

  if (!project) {
    throw new AppError({
      code: "project_not_found",
      message: "Project not found",
      statusCode: 404
    })
  }

  return jsonOk(c, {
    project: serializeProject(project)
  })
})

projectsRouter.delete("/api/projects/:id", async (c) => {
  const params = projectParamsSchema.parse(c.req.param())

  const deleted = await db.transaction(async (tx) => {
    await tx.delete(alerts).where(eq(alerts.projectId, params.id))

    const [project] = await tx
      .delete(projects)
      .where(eq(projects.id, params.id))
      .returning({ id: projects.id, dsnKey: projects.dsnKey })

    return project
  })

  if (!deleted) {
    throw new AppError({
      code: "project_not_found",
      message: "Project not found",
      statusCode: 404
    })
  }

  // Fire-and-forget Redis cleanup — must not block the 204 response
  void cleanupProjectRedisKeys(params.id, deleted.dsnKey)
    .catch(() => {
      // Already handled inside cleanupProjectRedisKeys
    })

  return c.body(null, 204)
})

projectsRouter.get("/api/projects/:id/stats", async (c) => {
  const params = projectParamsSchema.parse(c.req.param())

  await assertProjectExists(params.id)

  // Build Redis keys for the last 30 days
  const now = new Date()
  const dailyKeys: { key: string; date: string }[] = []
  for (let i = 0; i < 30; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    dailyKeys.push({
      key: dailyCountKey(params.id, date),
      date: date.toISOString().slice(0, 10)
    })
  }

  const redisValues = await redisConnection.mget(...dailyKeys.map((d) => d.key))

  const dailyCounts = dailyKeys.map(({ date }, i) => ({
    date,
    count: redisValues[i] ? Number(redisValues[i]) : 0
  }))

  // Fetch Postgres aggregates and top errors in parallel
  const [totalRow, openRow, resolvedRow, ignoredRow, topErrors] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(errors)
      .where(eq(errors.projectId, params.id)),
    db
      .select({ total: sql<number>`count(*)` })
      .from(errors)
      .where(and(eq(errors.projectId, params.id), eq(errors.status, "open"))),
    db
      .select({ total: sql<number>`count(*)` })
      .from(errors)
      .where(and(eq(errors.projectId, params.id), eq(errors.status, "resolved"))),
    db
      .select({ total: sql<number>`count(*)` })
      .from(errors)
      .where(and(eq(errors.projectId, params.id), eq(errors.status, "ignored"))),
    db
      .select({
        id: errors.id,
        title: errors.title,
        message: errors.message,
        count: errors.count,
        status: errors.status
      })
      .from(errors)
      .where(eq(errors.projectId, params.id))
      .orderBy(desc(errors.count))
      .limit(5)
  ])

  return jsonOk(c, {
    projectId: params.id,
    dailyCounts,
    totals: {
      total: Number(totalRow.total),
      open: Number(openRow.total),
      resolved: Number(resolvedRow.total),
      ignored: Number(ignoredRow.total)
    },
    topErrors: topErrors.map((e) => ({
      ...e,
      status: e.status as string
    }))
  })
})

async function cleanupProjectRedisKeys(projectId: string, dsnKey: string) {
  try {
    await redisConnection.del(`fl:rate:${projectId}`, `fl:rl:${dsnKey}`)

    // Delete daily count keys for the last 90 days
    const now = new Date()
    const keys: string[] = []
    for (let i = 0; i < 90; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      keys.push(dailyCountKey(projectId, date))
    }
    await redisConnection.del(...keys)
  } catch (error) {
    logger.error("project_delete.redis_cleanup_failed", {
      projectId,
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

function serializeProject(project: {
  id: string
  name: string
  dsnKey: string
  createdAt: Date
}): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    dsnKey: project.dsnKey,
    dsn: buildDsnUrl(project.dsnKey),
    sentryDsn: buildSentryDsnUrl(project.dsnKey, project.id),
    createdAt: project.createdAt.toISOString()
  }
}
