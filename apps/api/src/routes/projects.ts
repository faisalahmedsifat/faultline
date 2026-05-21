import { desc, eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

import { db } from "../db/client"
import { alerts, projects } from "../db/schema"
import { AppError } from "../lib/errors"
import { jsonOk } from "../lib/http"
import { createId } from "../lib/id"
import { buildDsnUrl } from "../lib/project"
import { createToken } from "../lib/tokens"

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

projectsRouter.delete("/api/projects/:id", async (c) => {
  const params = projectParamsSchema.parse(c.req.param())

  const deleted = await db.transaction(async (tx) => {
    await tx.delete(alerts).where(eq(alerts.projectId, params.id))

    const [project] = await tx
      .delete(projects)
      .where(eq(projects.id, params.id))
      .returning({ id: projects.id })

    return project
  })

  if (!deleted) {
    throw new AppError({
      code: "project_not_found",
      message: "Project not found",
      statusCode: 404
    })
  }

  return c.body(null, 204)
})

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
    createdAt: project.createdAt.toISOString()
  }
}
