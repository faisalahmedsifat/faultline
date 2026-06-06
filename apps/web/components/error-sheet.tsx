"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { getError, updateErrorStatus, type ErrorDetailDto, type ErrorStatus } from "@/lib/api"
import { toast } from "sonner"
import {
  ChevronDown, Copy, Check, CheckCircle, EyeOff, RotateCcw,
  FileText, Globe, Calendar, Users, Hash, Layers
} from "lucide-react"

const statusBadgeVariant: Record<string, "destructive" | "warning" | "success"> = {
  open: "destructive",
  ignored: "warning",
  resolved: "success"
}

export function ErrorSheet({ projectId }: { projectId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorId = searchParams.get("error")
  const [error, setError] = useState<ErrorDetailDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!errorId) {
      setError(null)
      return
    }
    setLoading(true)
    getError(errorId)
      .then((data) => setError(data.error))
      .catch(() => toast.error("Failed to load error details"))
      .finally(() => setLoading(false))
  }, [errorId])

  async function changeStatus(status: ErrorStatus) {
    if (!errorId || !error) return
    const prev = error.status
    setError({ ...error, status })
    try {
      await updateErrorStatus(errorId, status)
      router.refresh()
      toast.success(`Marked as ${status}`)
    } catch (err) {
      setError({ ...error, status: prev })
      toast.error(err instanceof Error ? err.message : "Status update failed")
    }
  }

  const copyStack = useCallback(() => {
    if (!error) return
    const text = error.resolvedStack
      ? error.resolvedStack.map((f: any) => `  at ${f.fn} (${f.file}:${f.line}:${f.col})`).join("\n")
      : error.stack || ""
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [error])

  function close() {
    const params = new URLSearchParams(searchParams)
    params.delete("error")
    router.push(`/projects/${projectId}?${params}`, { scroll: false })
  }

  return (
    <Sheet open={!!errorId} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-full sm:max-w-xl p-0 gap-0" side="right" resizable defaultWidth={576} minWidth={380} maxWidth={960}>
        <ScrollArea className="h-screen">
          <div className="flex flex-col min-h-full">
            {loading && (
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {error && (
              <>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
                  <SheetHeader className="mb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <SheetTitle className="text-base truncate">{error.title}</SheetTitle>
                          <Badge variant={statusBadgeVariant[error.status]} className="shrink-0">
                            {error.status}
                          </Badge>
                        </div>
                        {error.message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {error.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </SheetHeader>

                  {/* Quick actions */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {error.status !== "resolved" && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => changeStatus("resolved")}
                        className="gap-1.5"
                      >
                        <CheckCircle className="size-3.5" />
                        Resolve
                      </Button>
                    )}
                    {error.status !== "ignored" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changeStatus("ignored")}
                        className="gap-1.5"
                      >
                        <EyeOff className="size-3.5" />
                        Ignore
                      </Button>
                    )}
                    {error.status !== "open" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changeStatus("open")}
                        className="gap-1.5"
                      >
                        <RotateCcw className="size-3.5" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex-1">
                  {/* Metadata */}
                  <div className="space-y-3 mb-6">
                    {error.release && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-28 shrink-0">
                          <Layers className="size-3.5 text-muted-foreground/50" />
                          <span className="text-xs text-muted-foreground">Release</span>
                        </div>
                        <span className="text-xs font-medium text-primary font-mono">{error.release}</span>
                      </div>
                    )}
                    {error.file && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-28 shrink-0">
                          <FileText className="size-3.5 text-muted-foreground/50" />
                          <span className="text-xs text-muted-foreground">Location</span>
                        </div>
                        <span className="text-xs font-mono truncate">
                          {error.file}{error.line ? `:${error.line}` : ""}
                        </span>
                      </div>
                    )}
                    {error.route && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-28 shrink-0">
                          <Globe className="size-3.5 text-muted-foreground/50" />
                          <span className="text-xs text-muted-foreground">Route</span>
                        </div>
                        <span className="text-xs font-mono truncate">{error.route}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <Globe className="size-3.5 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">Environment</span>
                      </div>
                      <span className="text-xs">{error.env ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <Hash className="size-3.5 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">Occurrences</span>
                      </div>
                      <span className="text-xs font-semibold tabular-nums">{error.count}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <Users className="size-3.5 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">Users</span>
                      </div>
                      <span className="text-xs tabular-nums">{error.userCount}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <Calendar className="size-3.5 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">First seen</span>
                      </div>
                      <span className="text-xs tabular-nums">
                        {new Date(error.firstSeen).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Stack Trace */}
                  {(error.resolvedStack?.length || error.stack) ? (
                    <>
                      <Separator className="mb-4" />
                      <details open>
                        <summary className="flex items-center justify-between cursor-pointer list-none mb-3 group">
                          <div className="flex items-center gap-1.5">
                            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-0 -rotate-90" />
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {error.resolvedStack?.length ? "Resolved Stack Trace" : "Stack Trace"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="gap-1 opacity-60 hover:opacity-100"
                            onClick={(e) => { e.preventDefault(); copyStack() }}
                          >
                            {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                            {copied ? "Copied" : "Copy"}
                          </Button>
                        </summary>
                        {error.resolvedStack?.length ? (
                          <div className="bg-code-bg text-code-fg rounded-lg p-4 overflow-x-auto">
                            {error.resolvedStack.map((frame, i) => {
                              const f = frame as unknown as { file: string; line: number; col: number; fn: string; sourceContext: string | null }
                              return (
                                <div key={i} className="mb-3 last:mb-0">
                                  <p className="text-xs font-mono">
                                    <span className="text-muted-foreground/50 mr-2 tabular-nums select-none">{i + 1}</span>
                                    <span className="text-primary">at {f.fn}</span>
                                    <span className="text-muted-foreground/50"> ({f.file}:{f.line}:{f.col})</span>
                                  </p>
                                  {f.sourceContext && (
                                    <pre className="text-xs font-mono bg-code-bg/80 border border-white/5 text-code-fg/70 rounded mt-1 p-2 overflow-x-auto whitespace-pre-wrap ml-5">
                                      {f.sourceContext}
                                    </pre>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <pre className="text-xs font-mono bg-code-bg text-code-fg rounded-lg p-4 overflow-x-auto whitespace-pre-wrap max-h-72">
                            {error.stack}
                          </pre>
                        )}
                      </details>
                    </>
                  ) : null}

                  {/* Metadata */}
                  {error.metadata && Object.keys(error.metadata).length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <details>
                        <summary className="flex items-center gap-1.5 cursor-pointer list-none mb-3 group">
                          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-0 -rotate-90" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Metadata
                          </p>
                        </summary>
                        <pre className="text-xs font-mono bg-muted rounded-lg p-4 overflow-x-auto max-h-48">
                          {JSON.stringify(error.metadata, null, 2)}
                        </pre>
                      </details>
                    </>
                  )}

                  {/* Users */}
                  {error.users.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <details>
                        <summary className="flex items-center gap-1.5 cursor-pointer list-none mb-3 group">
                          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-0 -rotate-90" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Affected Users ({error.users.length})
                          </p>
                        </summary>
                        <div className="flex flex-wrap gap-1.5">
                          {error.users.map((u) => (
                            <code
                              key={u}
                              className="text-xs bg-muted px-2 py-1 rounded-md font-mono"
                            >
                              {u}
                            </code>
                          ))}
                        </div>
                      </details>
                    </>
                  )}
                </div>
              </>
            )}

            {!loading && !error && (
              <div className="p-6 text-center text-muted-foreground text-sm py-20">
                Error not found
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
