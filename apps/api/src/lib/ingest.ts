import { and, eq, lte } from "drizzle-orm"

import { db } from "../db/client"
import { alerts } from "../db/schema"
import { logger } from "./logger"
import { enqueueAlertDelivery } from "./queue"
import { redisConnection } from "./redis"

export function dailyCountKey(projectId: string, date = new Date()) {
  const isoDate = date.toISOString().slice(0, 10)
  return `fl:counts:${projectId}:${isoDate}`
}

export function rateCountKey(projectId: string) {
  return `fl:rate:${projectId}`
}

export const DAILY_COUNT_TTL_SECONDS = 60 * 60 * 24 * 90
export const RATE_COUNT_TTL_SECONDS = 60 * 15

type StoredError = {
  id: string
  title: string
  count: number
  env: string | null
  route: string | null
}

export async function handleAlertSideEffects(
  projectId: string,
  errorRecord: StoredError,
  source: "ingest" | "sentry" = "ingest"
) {
  try {
    const dailyKey = dailyCountKey(projectId)
    const dailyCount = await redisConnection.incr(dailyKey)

    if (dailyCount === 1) {
      await redisConnection.expire(dailyKey, DAILY_COUNT_TTL_SECONDS)
    }

    const rateKey = rateCountKey(projectId)
    const rateCount = await redisConnection.incr(rateKey)

    if (rateCount === 1) {
      await redisConnection.expire(rateKey, RATE_COUNT_TTL_SECONDS)
    }

    const matchedAlerts = await db
      .select({
        id: alerts.id,
        channel: alerts.channel,
        destination: alerts.destination
      })
      .from(alerts)
      .where(
        and(eq(alerts.projectId, projectId), eq(alerts.enabled, true), lte(alerts.threshold, rateCount))
      )

    if (matchedAlerts.length === 0) {
      return
    }

    try {
      await enqueueAlertDelivery({
        projectId,
        alertTargets: matchedAlerts.map((alert) => ({
          id: alert.id,
          channel: alert.channel as "slack" | "email" | "discord",
          destination: alert.destination
        })),
        errorId: errorRecord.id,
        errorTitle: errorRecord.title,
        count: errorRecord.count,
        env: errorRecord.env,
        route: errorRecord.route
      })
    } catch (error) {
      logger.error(`${source}.alert_enqueue_failed`, {
        projectId,
        errorId: errorRecord.id,
        message: error instanceof Error ? error.message : "Unknown queue error"
      })
    }
  } catch (error) {
    logger.error(`${source}.side_effects_failed`, {
      projectId,
      errorId: errorRecord.id,
      message: error instanceof Error ? error.message : "Unknown redis side-effect error"
    })
  }
}

