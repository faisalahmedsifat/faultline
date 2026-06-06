"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { deleteProject, rotateDsn, type ProjectDto } from "@/lib/api"
import { Check, Copy, MoreHorizontal, RefreshCw, Trash2, ChevronDown, ArrowRight } from "lucide-react"

function projectColor(projectId: string): string {
  let hash = 0
  for (let i = 0; i < projectId.length; i++) {
    hash = projectId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 55% 55%)`
}

export function ProjectCard({ project }: { project: ProjectDto }) {
  const [dsn, setDsn] = useState(project.dsn)
  const [dsnKey, setDsnKey] = useState(project.dsnKey)
  const [rotating, setRotating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [dsnExpanded, setDsnExpanded] = useState(false)
  const [copiedFaultline, setCopiedFaultline] = useState(false)
  const [copiedSentry, setCopiedSentry] = useState(false)
  const router = useRouter()

  const color = projectColor(project.id)

  async function handleRotate() {
    setRotating(true)
    try {
      const result = await rotateDsn(project.id)
      setDsn(result.project.dsn)
      setDsnKey(result.project.dsnKey)
      toast.success("DSN rotated — update your SDK config")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rotation failed")
    } finally {
      setRotating(false)
    }
  }

  async function handleCopy(text: string, which: "faultline" | "sentry") {
    await navigator.clipboard.writeText(text)
    if (which === "faultline") {
      setCopiedFaultline(true)
      setTimeout(() => setCopiedFaultline(false), 1500)
    } else {
      setCopiedSentry(true)
      setTimeout(() => setCopiedSentry(false), 1500)
    }
    toast.success("DSN copied")
  }

  async function handleDelete() {
    setDeleting(true)
    setConfirmOpen(false)
    try {
      await deleteProject(project.id)
      router.refresh()
      toast.success(`"${project.name}" deleted`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
      setDeleting(false)
    }
  }

  const ingestBase = dsn.substring(0, dsn.lastIndexOf("/ingest/"))
  const sentryDsn = `https://${dsnKey}@${ingestBase.replace(/https?:\/\//, "")}/${project.id}`

  const created = new Date(project.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })

  return (
    <>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{project.name}&quot;?</DialogTitle>
            <DialogDescription>
              All errors and alert configs for this project will be permanently deleted.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:shadow-black/5 hover:border-border">
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
          style={{ backgroundColor: color }}
        />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-base">
                <Link
                  href={`/projects/${project.id}`}
                  className="hover:text-primary transition-colors inline-flex items-center gap-1.5 group/link"
                >
                  {project.name}
                  <ArrowRight className="size-3.5 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                </Link>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Created {created}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex shrink-0 items-center justify-center rounded-lg size-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Project actions"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                <DropdownMenuItem onClick={handleRotate} disabled={rotating}>
                  <RefreshCw className="size-3.5" />
                  {rotating ? "Rotating..." : "Rotate DSN"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmOpen(true)}
                  disabled={deleting}
                >
                  <Trash2 className="size-3.5" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <button
            onClick={() => setDsnExpanded(!dsnExpanded)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 mb-2"
          >
            <ChevronDown className={`size-3 transition-transform ${dsnExpanded ? "rotate-0" : "-rotate-90"}`} />
            DSN Configuration
          </button>

          {dsnExpanded && (
            <div className="space-y-2.5 animate-fade-in">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Faultline SDK</p>
                <div className="dsn">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-primary break-all flex-1">{dsn}</code>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0"
                      onClick={() => handleCopy(dsn, "faultline")}
                      aria-label="Copy Faultline DSN"
                    >
                      {copiedFaultline ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Sentry SDK (any language)</p>
                <div className="dsn">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-primary break-all flex-1">{sentryDsn}</code>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0"
                      onClick={() => handleCopy(sentryDsn, "sentry")}
                      aria-label="Copy Sentry DSN"
                    >
                      {copiedSentry ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
