import Link from "next/link"
import { getError } from "@/lib/api"
import { StatusBadge } from "@/components/status-badge"
import { StatusChanger } from "@/components/status-changer"
import { StackTrace } from "@/components/stack-trace"
import { MetadataViewer } from "@/components/metadata-viewer"

export const dynamic = "force-dynamic"

export default async function ErrorDetailPage({
  params
}: {
  params: { projectId: string; errorId: string }
}) {
  let err: Awaited<ReturnType<typeof getError>>["error"] | null = null
  let error: string | null = null

  try {
    const data = await getError(params.errorId)
    err = data.error
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load error"
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="toast toast-error">{error}</div>
      </div>
    )
  }

  if (!err) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 text-white/60">
        <h3 className="text-lg font-medium text-white/80 mb-2">Error not found</h3>
      </div>
    )
  }

  const metaItems = [
    { label: "File", value: err.file ? `${err.file}${err.line ? `:${err.line}` : ""}${err.col ? `:${err.col}` : ""}` : "—" },
    { label: "Route", value: err.route ?? "—" },
    { label: "Environment", value: err.env ?? "—" },
    { label: "Level", value: err.level ?? "—" },
    { label: "Fingerprint", value: err.fingerprint },
    { label: "First Seen", value: new Date(err.firstSeen).toLocaleString() },
    { label: "Last Seen", value: new Date(err.lastSeen).toLocaleString() },
    { label: "Occurrences", value: String(err.count) },
    { label: "Affected Users", value: String(err.userCount) }
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/projects/${params.projectId}`}
        className="text-sm text-white/50 hover:text-white/80 transition-colors"
      >
        &larr; Back to Inbox
      </Link>

      <div className="mt-3">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <h1 className="text-2xl font-bold">{err.title}</h1>
          <StatusBadge status={err.status} />
        </div>

        {err.message && (
          <p className="text-white/70 mb-6">{err.message}</p>
        )}

        <div className="card mb-6">
          <div className="detail-grid">
            {metaItems.map((item) => (
              <div key={item.label} className="detail-item">
                <span className="detail-label">{item.label}</span>
                <span className="detail-value text-sm break-all">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card mb-6">
          <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
            Status
          </h3>
          <StatusChanger errorId={err.id} currentStatus={err.status} />
        </div>

        {err.users.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">
              Affected Users
            </h3>
            <div className="flex flex-wrap gap-1">
              {err.users.map((user) => (
                <code key={user} className="text-xs bg-black/30 border border-white/10 rounded px-2 py-1 font-mono">
                  {user}
                </code>
              ))}
            </div>
          </div>
        )}

        <div className="card mb-6">
          <StackTrace stack={err.stack} />
        </div>

        <div className="card">
          <MetadataViewer metadata={err.metadata} />
        </div>
      </div>
    </div>
  )
}
