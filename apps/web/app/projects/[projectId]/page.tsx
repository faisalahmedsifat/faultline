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
  searchParams: { status?: string; env?: string }
}) {
  let errors = [] as Awaited<ReturnType<typeof getErrors>>["errors"]
  let error: string | null = null

  const status = searchParams.status as "open" | "ignored" | "resolved" | undefined
  const env = searchParams.env

  try {
    const data = await getErrors(params.projectId, { status, env })
    errors = data.errors
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load errors"
  }

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

      <div className="mb-4">
        <Suspense fallback={<div className="h-10" />}>
          <ErrorFilters />
        </Suspense>
      </div>

      {error && <div className="toast toast-error mb-4">{error}</div>}

      <div className="card p-0 overflow-hidden">
        <ErrorTable errors={errors} projectId={params.projectId} />
      </div>
    </div>
  )
}
