"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { updateErrorStatus, type ErrorListItemDto } from "@/lib/api"
import { toast } from "sonner"
import { FileText, Globe, Clock, CheckCircle, Eye, EyeOff, RotateCcw } from "lucide-react"

const statusDot: Record<string, string> = {
  open: "bg-destructive",
  ignored: "bg-warning",
  resolved: "bg-success"
}

const statusBadgeVariant: Record<string, "destructive" | "warning" | "success"> = {
  open: "destructive",
  ignored: "warning",
  resolved: "success"
}

const envColors: Record<string, string> = {
  production: "text-destructive bg-destructive/10",
  staging: "text-warning bg-warning/10",
  development: "text-muted-foreground bg-muted",
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
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)

  const displayStatus = optimisticStatus || error.status

  async function changeStatus(newStatus: "open" | "ignored" | "resolved") {
    try {
      setOptimisticStatus(newStatus)
      if (newStatus === "resolved") {
        setFlash(true)
        setTimeout(() => setFlash(false), 1200)
      }
      await updateErrorStatus(error.id, newStatus)
      router.refresh()
      toast.success(`Marked as ${newStatus}`)
    } catch (err) {
      setOptimisticStatus(null)
      toast.error(err instanceof Error ? err.message : "Status update failed")
    }
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150",
        "hover:bg-accent/50",
        isSelected && "bg-primary/5 hover:bg-primary/8",
        displayStatus === "resolved" && !flash && "opacity-60",
        displayStatus === "ignored" && "opacity-50",
        flash && "bg-success/5"
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
      {/* Status indicator */}
      <span className={cn(
        "size-2 rounded-full shrink-0 transition-colors",
        flash ? "bg-success" : statusDot[displayStatus]
      )} />

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium text-sm truncate",
            displayStatus === "resolved" && "line-through text-muted-foreground"
          )}>
            {error.title}
          </span>

          {error.env && (
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
              envColors[error.env] || "text-muted-foreground bg-muted"
            )}>
              {error.env}
            </span>
          )}
        </div>

        {error.message && (
          <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-lg">
            {error.message}
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        {error.file && (
          <span className="flex items-center gap-1 font-mono text-[11px] max-w-[140px] truncate">
            <FileText className="size-3 shrink-0 opacity-50" />
            {error.file}{error.line ? `:${error.line}` : ""}
          </span>
        )}
        {error.route && (
          <span className="flex items-center gap-1 max-w-[120px] truncate">
            <Globe className="size-3 shrink-0 opacity-50" />
            {error.route}
          </span>
        )}
      </div>

      {/* Count + Time */}
      <div className="flex items-center gap-3 shrink-0">
        <span className={cn(
          "text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-md bg-muted transition-colors",
          flash && "bg-success/20 text-success"
        )}>
          {flash && <CheckCircle className="size-3 inline mr-0.5 -mt-0.5" />}
          {error.count}
        </span>

        <span className="text-[11px] text-muted-foreground/60 tabular-nums w-14 text-right flex items-center gap-1 justify-end" suppressHydrationWarning>
          <Clock className="size-3 opacity-50" />
          {relativeTime(error.lastSeen)}
        </span>
      </div>

      {/* Hover actions */}
      <div
        className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {displayStatus !== "resolved" && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => changeStatus("resolved")}
            aria-label="Resolve"
            className="text-success hover:bg-success/10"
          >
            <CheckCircle className="size-3.5" />
          </Button>
        )}
        {displayStatus !== "ignored" && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => changeStatus("ignored")}
            aria-label="Ignore"
          >
            <EyeOff className="size-3.5" />
          </Button>
        )}
        {displayStatus !== "open" && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => changeStatus("open")}
            aria-label="Reopen"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
