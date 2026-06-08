import { eq } from "drizzle-orm"

import { db } from "../db/client"
import { projects } from "../db/schema"
import { AppError } from "./errors"
import { env } from "./env"

export function buildDsnUrl(dsnKey: string) {
  const base = env.INGEST_BASE_URL ?? env.APP_BASE_URL
  return new URL(`/ingest/${dsnKey}`, base).toString()
}

export function buildSentryDsnUrl(dsnKey: string, projectId: string) {
  const base = env.INGEST_BASE_URL ?? env.APP_BASE_URL
  const host = new URL(base).host
  return `https://${dsnKey}@${host}/${projectId}`
}

export async function assertProjectExists(projectId: string) {
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

