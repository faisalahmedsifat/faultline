import { env } from "../env"
import { buildErrorUrl } from "../links"
import type { AlertDeliveryJob, AlertDeliveryTarget } from "../types"

export async function sendEmailAlert(target: AlertDeliveryTarget, job: AlertDeliveryJob) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    throw new Error("Resend is not configured")
  }

  const errorUrl = buildErrorUrl(job.projectId, job.errorId)

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [target.destination],
      subject: `faultline alert: ${job.errorTitle}`,
      text: [
        `Error: ${job.errorTitle}`,
        `Occurrences: ${job.count}`,
        `Environment: ${job.env ?? "unknown"}`,
        `Route: ${job.route ?? "unknown"}`,
        `View: ${errorUrl}`
      ].join("\n"),
      html: [
        `<h1>${escapeHtml(job.errorTitle)}</h1>`,
        `<p><strong>Occurrences:</strong> ${job.count}</p>`,
        `<p><strong>Environment:</strong> ${escapeHtml(job.env ?? "unknown")}</p>`,
        `<p><strong>Route:</strong> ${escapeHtml(job.route ?? "unknown")}</p>`,
        `<p><a href="${errorUrl}">View in faultline</a></p>`
      ].join("")
    })
  })

  if (!response.ok) {
    throw new Error(`Resend delivery failed with status ${response.status}`)
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

