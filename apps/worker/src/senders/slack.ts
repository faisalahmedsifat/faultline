import type { AlertDeliveryJob, AlertDeliveryTarget } from "../types"
import { buildErrorUrl } from "../links"

export async function sendSlackAlert(target: AlertDeliveryTarget, job: AlertDeliveryJob) {
  const response = await fetch(target.destination, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      text: `faultline: ${job.errorTitle} (${job.count} occurrences)`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${job.errorTitle}*\nOccurrences: *${job.count}*\nEnvironment: \`${job.env ?? "unknown"}\`\nRoute: \`${job.route ?? "unknown"}\``
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View in faultline"
              },
              url: buildErrorUrl(job.projectId, job.errorId)
            }
          ]
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Slack delivery failed with status ${response.status}`)
  }
}

