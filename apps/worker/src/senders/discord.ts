import type { AlertDeliveryJob, AlertDeliveryTarget } from "../types"
import { buildErrorUrl } from "../links"

export async function sendDiscordAlert(target: AlertDeliveryTarget, job: AlertDeliveryJob) {
  const response = await fetch(target.destination, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      embeds: [
        {
          title: job.errorTitle,
          description: `Occurrences: ${job.count}`,
          color: 15158332,
          fields: [
            { name: "Environment", value: job.env ?? "unknown", inline: true },
            { name: "Route", value: job.route ?? "unknown", inline: true }
          ],
          url: buildErrorUrl(job.projectId, job.errorId)
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Discord delivery failed with status ${response.status}`)
  }
}

