"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { getError, updateErrorStatus, type ErrorDetailDto, type ErrorStatus } from "@/lib/api"
import { toast } from "sonner"

const statusVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  open: "destructive",
  ignored: "outline",
  resolved: "secondary"
}

export function ErrorSheet({ projectId }: { projectId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorId = searchParams.get("error")
  const [error, setError] = useState<ErrorDetailDto | null>(null)
  const [loading, setLoading] = useState(false)

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
    if (!errorId) return
    try {
      await updateErrorStatus(errorId, status)
      router.refresh()
      toast.success(`Marked as ${status}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed")
    }
  }

  function close() {
    const params = new URLSearchParams(searchParams)
    params.delete("error")
    router.push(`/projects/${projectId}?${params}`, { scroll: false })
  }

  return (
    <Sheet open={!!errorId} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-full sm:max-w-lg p-0 gap-0">
        <ScrollArea className="h-screen">
          {loading && (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {error && (
            <div className="p-6">
              <SheetHeader className="mb-4">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-lg">{error.title}</SheetTitle>
                  <Badge variant={statusVariant[error.status]}>
                    {error.status}
                  </Badge>
                </div>
                {error.message && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {error.message}
                  </p>
                )}
              </SheetHeader>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {error.file && (
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-mono text-xs">
                        {error.file}{error.line ? `:${error.line}` : ""}
                      </p>
                    </div>
                  )}
                  {error.route && (
                    <div>
                      <p className="text-xs text-muted-foreground">Route</p>
                      <p className="font-mono text-xs">{error.route}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Environment</p>
                    <p>{error.env ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Occurrences</p>
                    <p>{error.count}×</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Users affected</p>
                    <p>{error.userCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">First seen</p>
                    <p className="text-xs">
                      {new Date(error.firstSeen).toLocaleString()}
                    </p>
                  </div>
                </div>

                {error.stack && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Stack Trace
                      </p>
                      <pre className="text-xs font-mono bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64">
                        {error.stack}
                      </pre>
                    </div>
                  </>
                )}

                {error.metadata && Object.keys(error.metadata).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Metadata
                      </p>
                      <pre className="text-xs font-mono bg-black/30 rounded-lg p-3 overflow-x-auto max-h-48">
                        {JSON.stringify(error.metadata, null, 2)}
                      </pre>
                    </div>
                  </>
                )}

                {error.users.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Users
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {error.users.map((u) => (
                          <code
                            key={u}
                            className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
                          >
                            {u}
                          </code>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex gap-2">
                  {error.status !== "ignored" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeStatus("ignored")}
                    >
                      Ignore
                    </Button>
                  )}
                  {error.status !== "resolved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeStatus("resolved")}
                    >
                      Resolve
                    </Button>
                  )}
                  {error.status !== "open" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeStatus("open")}
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Error not found
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
