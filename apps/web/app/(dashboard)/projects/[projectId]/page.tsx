import { Suspense } from "react"
import Link from "next/link"
import { getErrors } from "@/lib/api"
import { ErrorCard } from "@/components/error-card"
import { ErrorSheet } from "@/components/error-sheet"
import { ErrorFilters } from "@/components/error-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default async function ErrorInboxPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ status?: string; env?: string; page?: string; search?: string }>
}) {
  const { projectId } = await params
  const sp = await searchParams
  let data: Awaited<ReturnType<typeof getErrors>> | null = null
  let error: string | null = null

  const status = sp.status as "open" | "ignored" | "resolved" | undefined
  const env = sp.env
  const page = Number(sp.page) || 1

  try {
    data = await getErrors(projectId, { status, env, page, pageSize: 20 })
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load errors"
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
          {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  const { errors, pagination } = data

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/projects"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Projects
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">Error Inbox</h1>
        </div>
        <Link
          href={`/projects/${projectId}/settings`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Settings
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-2xl font-bold tabular-nums">{pagination.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-2xl font-bold tabular-nums text-destructive">
            {pagination.total - errors.filter((e) => e.status !== "open").length}
          </div>
          <div className="text-xs text-muted-foreground">Open</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-2xl font-bold tabular-nums text-emerald-500">
            {errors.filter((e) => e.status === "resolved").length}
          </div>
          <div className="text-xs text-muted-foreground">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <ErrorFilters
            page={pagination.page}
            totalPages={pagination.totalPages}
          />
        </Suspense>
      </div>

      {/* Error cards */}
      {errors.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-2">No errors yet</p>
          <p className="text-sm text-muted-foreground">
            Configure the SDK with this project&apos;s DSN and deploy to start tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {errors.map((err) => (
            <ErrorCard
              key={err.id}
              error={err}
              projectId={projectId}
            />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <ErrorSheet projectId={projectId} />
    </div>
  )
}
