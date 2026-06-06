import type { AlertDeliveryJob, AlertDeliveryTarget } from "./types"
import { logger } from "./logger"
import { redisConnection } from "./redis"
import { sendDiscordAlert } from "./senders/discord"
import { sendEmailAlert } from "./senders/email"
import { sendSlackAlert } from "./senders/slack"

const IDEMPOTENCY_TTL = 3600 // 1 hour — covers any realistic retry window

function deliveryKey(jobId: string, targetId: string) {
  return `fl:delivered:${jobId}:${targetId}`
}

export async function processAlertDelivery(job: { data: AlertDeliveryJob; id?: string }) {
  const jobId = job.id ?? "unknown"
  const failures: Array<{ target: AlertDeliveryTarget; message: string }> = []

  for (const target of job.data.alertTargets) {
    try {
      // Idempotency: skip if already delivered to this target in a previous attempt
      const key = deliveryKey(jobId, target.id)
      const alreadyDelivered = await redisConnection.get(key)

      if (alreadyDelivered) {
        logger.info("worker.delivery_skipped_duplicate", {
          channel: target.channel,
          alertId: target.id,
          errorId: job.data.errorId
        })
        continue
      }

      await sendTarget(target, job.data)
      await redisConnection.set(key, "1", "EX", IDEMPOTENCY_TTL)

      logger.info("worker.delivery_succeeded", {
        channel: target.channel,
        alertId: target.id,
        errorId: job.data.errorId
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown delivery error"
      failures.push({ target, message })

      logger.error("worker.delivery_failed", {
        channel: target.channel,
        alertId: target.id,
        errorId: job.data.errorId,
        message
      })
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Alert delivery failed for ${failures.length} target(s): ${failures
        .map((f) => `${f.target.channel}:${f.target.id}`)
        .join(", ")}`
    )
  }
}

async function sendTarget(target: AlertDeliveryTarget, job: AlertDeliveryJob) {
  switch (target.channel) {
    case "slack":
      return sendSlackAlert(target, job)
    case "discord":
      return sendDiscordAlert(target, job)
    case "email":
      return sendEmailAlert(target, job)
  }
}
