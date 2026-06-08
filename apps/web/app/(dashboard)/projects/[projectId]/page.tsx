import { Suspense } from "react"
import Link from "next/link"
import { getErrors, getProject } from "@/lib/api"
import { ErrorCard } from "@/components/error-card"
import { ErrorSheet } from "@/components/error-sheet"
import { ErrorFilters } from "@/components/error-filters"
import { GettingStartedBanner } from "@/components/getting-started-banner"
import { ErrorLiveFeed } from "@/components/error-live-feed"
import { Skeleton } from "@/components/ui/skeleton"
import { Inbox, Settings, AlertCircle, CheckCircle2, BarChart3 } from "lucide-react"

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
  let projectDsn: string | null = null
  let projectName: string | null = null
  let error: string | null = null

  const status = sp.status as "open" | "ignored" | "resolved" | undefined
  const env = sp.env
  const page = Number(sp.page) || 1

  try {
    data = await getErrors(projectId, { status, env, page, pageSize: 20 })
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load errors"
  }

  try {
    const project = await getProject(projectId)
    projectDsn = project.project.dsn
    projectName = project.project.name
  } catch {
    // Not critical
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const { errors, pagination } = data
  const openCount = errors.filter((e) => e.status === "open").length
  const resolvedCount = errors.filter((e) => e.status === "resolved").length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link
              href="/projects"
              className="hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <span className="text-muted-foreground/40">/</span>
            {projectName && <span className="text-foreground font-medium">{projectName}</span>}
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Error Inbox</h1>
            <ErrorLiveFeed projectId={projectId} />
          </div>
        </div>
        <Link
          href={`/projects/${projectId}/settings`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
          <Settings className="size-3.5" />
          Settings
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="relative overflow-hidden bg-card border border-border rounded-xl p-4 group">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-6 rounded-md bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="size-3 text-destructive" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Open</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-destructive">
            {openCount}
          </div>
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-destructive/60 rounded-full transition-all duration-500"
              style={{
                width: `${pagination.total > 0 ? (openCount / pagination.total) * 100 : 0}%`
              }}
            />
          </div>
        </div>

        <div className="relative overflow-hidden bg-card border border-border rounded-xl p-4 group">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-6 rounded-md bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="size-3 text-success" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Resolved</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-success">
            {resolvedCount}
          </div>
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-success/60 rounded-full transition-all duration-500"
              style={{
                width: `${pagination.total > 0 ? (resolvedCount / pagination.total) * 100 : 0}%`
              }}
            />
          </div>
        </div>

        <div className="relative overflow-hidden bg-card border border-border rounded-xl p-4 group">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-6 rounded-md bg-muted flex items-center justify-center">
              <BarChart3 className="size-3 text-muted-foreground" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">
            {pagination.total}
          </div>
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground/20 rounded-full transition-all"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <Suspense fallback={<Skeleton className="h-10 w-full rounded-lg" />}>
          <ErrorFilters
            page={pagination.page}
            totalPages={pagination.totalPages}
          />
        </Suspense>
      </div>

      {/* Error list */}
      {errors.length === 0 ? (
        <div>
          {projectDsn && (
            <GettingStartedBanner projectId={projectId} dsn={projectDsn} />
          )}
          <div className="text-center py-20 border border-border rounded-xl bg-card/50">
            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Inbox className="size-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium mb-1.5">No errors yet</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Configure the SDK with this project&apos;s DSN and deploy to start tracking errors.
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card divide-y divide-border">
          {errors.map((err, i) => (
            <div
              key={err.id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <ErrorCard
                error={err}
                projectId={projectId}
              />
            </div>
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <ErrorSheet projectId={projectId} />
    </div>
  )
}
