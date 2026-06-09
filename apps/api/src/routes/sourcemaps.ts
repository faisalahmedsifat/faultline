import { Hono } from "hono"
import { z } from "zod"

import { db } from "../db/client"
import { projects } from "../db/schema"
import { eq } from "drizzle-orm"
import { AppError } from "../lib/errors"
import { jsonOk } from "../lib/http"
import { getSourceMapStore } from "../lib/sourcemap-store"
import { logger } from "../lib/logger"

export const sourcemapsRouter = new Hono()

const MAX_SOURCEMAP_BODY_SIZE = 52_428_800 // 50MB

sourcemapsRouter.post("/api/projects/:id/sourcemaps", async (c) => {
  const contentLength = parseInt(c.req.header("content-length") ?? "0", 10)
  if (contentLength > MAX_SOURCEMAP_BODY_SIZE) {
    throw new AppError({
      code: "payload_too_large",
      message: "Request body exceeds 50MB limit",
      statusCode: 413
    })
  }

  const projectId = c.req.param("id")

  // Verify project exists
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

  const formData = await c.req.formData()
  const release = formData.get("release")

  if (!release || typeof release !== "string") {
    throw new AppError({
      code: "missing_release",
      message: "Release field is required",
      statusCode: 400
    })
  }

  const files = formData.getAll("files")
  if (files.length === 0) {
    throw new AppError({
      code: "missing_files",
      message: "At least one source map file is required",
      statusCode: 400
    })
  }

  const store = getSourceMapStore()
  let uploaded = 0

  for (const file of files) {
    if (!(file instanceof File)) continue

    const name = file.name
    const content = Buffer.from(await file.arrayBuffer())

    await store.save(projectId, release, name, content)
    uploaded++
  }

  logger.info("sourcemaps.uploaded", { projectId, release, count: uploaded })

  return jsonOk(c, {
    uploaded,
    release,
    projectId
  })
})
