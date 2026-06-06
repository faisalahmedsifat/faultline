import { Suspense } from "react"
import Link from "next/link"
import { getErrors } from "@/lib/api"
import { ErrorTable } from "@/components/error-table"
import { ErrorFilters } from "@/components/error-filters"

export const dynamic = "force-dynamic"

export default async function ErrorInboxPage({
  params,
  searchParams
}: {
  params: { projectId: string }
  searchParams: { status?: string; env?: string; page?: string }
}) {
  let data: Awaited<ReturnType<typeof getErrors>> | null = null
  let error: string | null = null

  const status = searchParams.status as "open" | "ignored" | "resolved" | undefined
  const env = searchParams.env
  const page = Number(searchParams.page) || 1

  try {
    data = await getErrors(params.projectId, { status, env, page, pageSize: 20 })
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load errors"
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="toast toast-error mb-4">{error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 text-white/60">
        <h3 className="text-lg font-medium text-white/80 mb-2">Something went wrong</h3>
      </div>
    )
  }

  const { errors, pagination } = data
  const openCount = errors.filter((e) => e.status === "open").length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link
            href="/projects"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            &larr; Projects
          </Link>
          <h1 className="text-2xl font-bold mt-1">Error Inbox</h1>
        </div>
        <Link href={`/projects/${params.projectId}/settings`} className="btn">
          Alert Settings
        </Link>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="card py-3 px-5 flex-1 min-w-[120px]">
          <div className="text-2xl font-bold tabular-nums">{pagination.total}</div>
          <div className="text-xs text-white/50 uppercase tracking-wider mt-0.5">Total Errors</div>
        </div>
        <div className="card py-3 px-5 flex-1 min-w-[120px]">
          <div className="text-2xl font-bold tabular-nums text-red-400">
            {pagination.total - errors.filter((e) => e.status !== "open").length}
          </div>
          <div className="text-xs text-white/50 uppercase tracking-wider mt-0.5">Open</div>
        </div>
        <div className="card py-3 px-5 flex-1 min-w-[120px]">
          <div className="text-2xl font-bold tabular-nums text-green-400">
            {errors.filter((e) => e.status === "resolved").length}
          </div>
          <div className="text-xs text-white/50 uppercase tracking-wider mt-0.5">Resolved</div>
        </div>
      </div>

      <div className="mb-4">
        <Suspense fallback={<div className="h-10" />}>
          <ErrorFilters page={pagination.page} totalPages={pagination.totalPages} />
        </Suspense>
      </div>

      <div className="card p-0 overflow-hidden">
        <ErrorTable errors={errors} projectId={params.projectId} />
      </div>
    </div>
  )
}
