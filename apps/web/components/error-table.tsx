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
      <div className="text-center py-16 px-6">
        <h3 className="text-lg font-medium text-white/80 mb-2">No errors yet</h3>
        <p className="text-sm text-white/50 mb-4">
          Configure the SDK with this project&apos;s DSN and deploy to start tracking.
        </p>
        <pre className="code-block max-w-lg mx-auto text-left text-xs">
{`import { Faultline } from "faultline"

Faultline.init({
  dsn: process.env.FAULTLINE_DSN,
  baseUrl: process.env.FAULTLINE_BASE_URL
})`}
        </pre>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="overflow-x-auto hidden md:block">
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

      {/* Mobile cards */}
      <div className="md:hidden">
        {errors.map((err) => (
          <Link
            key={err.id}
            href={`/projects/${projectId}/errors/${err.id}`}
            className="block p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-sm truncate">{err.title}</span>
              <StatusBadge status={err.status} />
            </div>
            {err.message && (
              <p className="text-xs text-white/40 truncate mb-2">{err.message}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-white/50">
              <span>{err.count}x</span>
              {err.env && <span>{err.env}</span>}
              <span>
                {new Date(err.lastSeen).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                })}
              </span>
              {err.route && <span className="truncate">{err.route}</span>}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
