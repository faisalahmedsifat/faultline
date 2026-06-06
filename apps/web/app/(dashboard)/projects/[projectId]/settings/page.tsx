import Link from "next/link"
import { getAlerts } from "@/lib/api"
import { AlertConfigForm } from "@/components/alert-config-form"

export const dynamic = "force-dynamic"

export default async function AlertSettingsPage({
  params
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  let alerts = [] as Awaited<ReturnType<typeof getAlerts>>["alerts"]
  let error: string | null = null

  try {
    const data = await getAlerts(projectId)
    alerts = data.alerts
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load alerts"
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6 pb-12">
      <Link
        href={`/projects/${projectId}`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to Inbox
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mt-1 mb-6">Alert Settings</h1>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <AlertConfigForm projectId={projectId} existing={alerts} />
    </div>
  )
}
