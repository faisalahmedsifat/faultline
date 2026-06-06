"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { updateErrorStatus, type ErrorListItemDto } from "@/lib/api"
import { toast } from "sonner"

const statusVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  open: "destructive",
  ignored: "outline",
  resolved: "secondary"
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function ErrorCard({
  error,
  projectId
}: {
  error: ErrorListItemDto
  projectId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSelected = searchParams.get("error") === error.id

  async function changeStatus(newStatus: "open" | "ignored" | "resolved") {
    try {
      await updateErrorStatus(error.id, newStatus)
      router.refresh()
      toast.success(`Marked as ${newStatus}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed")
    }
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50",
        isSelected && "border-primary ring-1 ring-primary",
        error.status === "resolved" && "opacity-60",
        error.status === "ignored" && "opacity-50"
      )}
      onClick={() => {
        const params = new URLSearchParams(searchParams)
        if (isSelected) {
          params.delete("error")
        } else {
          params.set("error", error.id)
        }
        router.push(`/projects/${projectId}?${params}`, { scroll: false })
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{error.title}</span>
              <Badge variant={statusVariant[error.status]} className="shrink-0 text-[10px] h-4 px-1.5">
                {error.status}
              </Badge>
            </div>
            {error.message && (
              <p className="text-xs text-muted-foreground truncate mb-2">
                {error.message}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {error.file && (
                <span className="truncate max-w-[180px]">
                  {error.file}{error.line ? `:${error.line}` : ""}
                </span>
              )}
              {error.route && <span className="truncate max-w-[160px]">{error.route}</span>}
              <span className="tabular-nums">{error.count}×</span>
              {error.userCount > 0 && (
                <span className="tabular-nums">{error.userCount} users</span>
              )}
              <span className="tabular-nums ml-auto shrink-0" suppressHydrationWarning>
                {relativeTime(error.lastSeen)}
              </span>
            </div>
          </div>

          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {error.status !== "ignored" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => changeStatus("ignored")}
              >
                Ignore
              </Button>
            )}
            {error.status !== "resolved" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => changeStatus("resolved")}
              >
                Resolve
              </Button>
            )}
            {error.status !== "open" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => changeStatus("open")}
              >
                Reopen
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
