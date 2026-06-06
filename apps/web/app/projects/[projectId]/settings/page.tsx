import Link from "next/link"
import { getAlerts } from "@/lib/api"
import { AlertConfigForm } from "@/components/alert-config-form"

export const dynamic = "force-dynamic"

export default async function AlertSettingsPage({
  params
}: {
  params: { projectId: string }
}) {
  let alerts = [] as Awaited<ReturnType<typeof getAlerts>>["alerts"]
  let error: string | null = null

  try {
    const data = await getAlerts(params.projectId)
    alerts = data.alerts
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load alerts"
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link
        href={`/projects/${params.projectId}`}
        className="text-sm text-white/50 hover:text-white/80 transition-colors"
      >
        &larr; Back to Inbox
      </Link>

      <h1 className="text-2xl font-bold mt-1 mb-6">Alert Settings</h1>

      {error && <div className="toast toast-error mb-4">{error}</div>}

      <div className="card">
        <AlertConfigForm projectId={params.projectId} existing={alerts} />
      </div>
    </div>
  )
}
