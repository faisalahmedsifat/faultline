import Link from "next/link"
import { StatusBadge } from "@/components/status-badge"
import type { ErrorListItemDto } from "@/lib/api"

export function ErrorTable({
  errors,
  projectId
}: {
  errors: ErrorListItemDto[]
  projectId: string
}) {
  if (errors.length === 0) {
    return (
      <div className="text-center py-16 text-white/60">
        <h3 className="text-lg font-medium text-white/80 mb-2">No errors yet</h3>
        <p className="text-sm">
          Send your first error by configuring the SDK with this project&apos;s DSN.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Error</th>
            <th>Route</th>
            <th>Env</th>
            <th className="text-right">Count</th>
            <th className="text-right">Users</th>
            <th>Last Seen</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((err) => (
            <tr key={err.id} className="clickable">
              <td>
                <Link
                  href={`/projects/${projectId}/errors/${err.id}`}
                  className="block"
                >
                  <span className="font-medium text-sm">{err.title}</span>
                  {err.message && (
                    <span className="block text-xs text-white/50 truncate max-w-[320px] mt-0.5">
                      {err.message}
                    </span>
                  )}
                </Link>
              </td>
              <td className="text-sm text-white/60 max-w-[180px] truncate">
                {err.route ?? "—"}
              </td>
              <td className="text-sm text-white/60">{err.env ?? "—"}</td>
              <td className="text-sm text-right tabular-nums">{err.count}</td>
              <td className="text-sm text-right tabular-nums">{err.userCount}</td>
              <td className="text-sm text-white/60 whitespace-nowrap">
                {new Date(err.lastSeen).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </td>
              <td>
                <StatusBadge status={err.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
