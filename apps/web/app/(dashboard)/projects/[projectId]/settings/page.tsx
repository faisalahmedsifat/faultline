import Link from "next/link"
import { getAlerts } from "@/lib/api"
import { AlertConfigForm } from "@/components/alert-config-form"
import { Bell, ArrowLeft } from "lucide-react"

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
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 pb-12">
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="size-3.5" />
        Back to Inbox
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bell className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alert Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure notifications when error thresholds are exceeded
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-4 mb-6 flex items-start gap-3">
          <span className="size-2 rounded-full bg-destructive mt-1.5 shrink-0" />
          {error}
        </div>
      )}

      <AlertConfigForm projectId={projectId} existing={alerts} />
    </div>
  )
}
