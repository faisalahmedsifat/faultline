import type { AlertDeliveryJob, AlertDeliveryTarget } from "./types"
import { logger } from "./logger"
import { sendDiscordAlert } from "./senders/discord"
import { sendEmailAlert } from "./senders/email"
import { sendSlackAlert } from "./senders/slack"

export async function processAlertDelivery(job: AlertDeliveryJob) {
  const failures: Array<{ target: AlertDeliveryTarget; message: string }> = []

  for (const target of job.alertTargets) {
    try {
      await sendTarget(target, job)
      logger.info("worker.delivery_succeeded", {
        channel: target.channel,
        alertId: target.id,
        errorId: job.errorId
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown delivery error"

      failures.push({ target, message })

      logger.error("worker.delivery_failed", {
        channel: target.channel,
        alertId: target.id,
        errorId: job.errorId,
        message
      })
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Alert delivery failed for ${failures.length} target(s): ${failures
        .map((failure) => `${failure.target.channel}:${failure.target.id}`)
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

