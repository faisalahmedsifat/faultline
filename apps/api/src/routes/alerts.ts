import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

import { db } from "../db/client"
import { alerts, projects } from "../db/schema"
import { AppError } from "../lib/errors"
import { jsonOk } from "../lib/http"
import { createId } from "../lib/id"

const channelSchema = z.enum(["slack", "email", "discord"])

const projectQuerySchema = z.object({
  projectId: z.string().min(1)
})

const alertInputSchema = z
  .object({
    channel: channelSchema,
    destination: z.string().trim().min(1),
    threshold: z.number().int().positive().max(100000),
    enabled: z.boolean().default(true)
  })
  .superRefine((value, ctx) => {
    if ((value.channel === "slack" || value.channel === "discord") && !isValidWebhookUrl(value.destination)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination"],
        message: "Webhook destination must be a valid HTTPS URL"
      })
    }

    if (value.channel === "email" && !z.string().email().safeParse(value.destination).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination"],
        message: "Email destination must be a valid email address"
      })
    }
  })

const replaceAlertsSchema = z.object({
  projectId: z.string().min(1),
  alerts: z.array(alertInputSchema).max(3)
}).superRefine((value, ctx) => {
  const seen = new Set<string>()

  for (const [index, alert] of value.alerts.entries()) {
    if (seen.has(alert.channel)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["alerts", index, "channel"],
        message: "Each channel may only be configured once per project"
      })
    }

    seen.add(alert.channel)
  }
})

type AlertDto = {
  id: string
  channel: "slack" | "email" | "discord"
  destination: string
  threshold: number
  enabled: boolean
}

export const alertsRouter = new Hono()

alertsRouter.get("/api/alerts", async (c) => {
  const query = projectQuerySchema.safeParse(c.req.query())

  if (!query.success) {
    throw new AppError({
      code: "invalid_project_id",
      message: "projectId is required",
      statusCode: 400,
      details: query.error.flatten()
    })
  }

  await assertProjectExists(query.data.projectId)

  const rows = await db
    .select({
      id: alerts.id,
      channel: alerts.channel,
      destination: alerts.destination,
      threshold: alerts.threshold,
      enabled: alerts.enabled
    })
    .from(alerts)
    .where(eq(alerts.projectId, query.data.projectId))

  return jsonOk(c, {
    projectId: query.data.projectId,
    alerts: rows as AlertDto[]
  })
})

alertsRouter.put("/api/alerts", async (c) => {
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

  const payload = replaceAlertsSchema.parse(rawBody)

  await assertProjectExists(payload.projectId)

  const result = await db.transaction(async (tx) => {
    await tx.delete(alerts).where(eq(alerts.projectId, payload.projectId))

    if (payload.alerts.length === 0) {
      return []
    }

    return tx
      .insert(alerts)
      .values(
        payload.alerts.map((alert) => ({
          id: createId("alr"),
          projectId: payload.projectId,
          channel: alert.channel,
          destination: alert.destination,
          threshold: alert.threshold,
          enabled: alert.enabled
        }))
      )
      .returning({
        id: alerts.id,
        channel: alerts.channel,
        destination: alerts.destination,
        threshold: alerts.threshold,
        enabled: alerts.enabled
      })
  })

  return jsonOk(c, {
    projectId: payload.projectId,
    alerts: result as AlertDto[]
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

function isValidWebhookUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:"
  } catch {
    return false
  }
}
