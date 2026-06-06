"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { deleteProject, rotateDsn, type ProjectDto } from "@/lib/api"

export function ProjectCard({ project }: { project: ProjectDto }) {
  const [dsn, setDsn] = useState(project.dsn)
  const [dsnKey, setDsnKey] = useState(project.dsnKey)
  const [rotating, setRotating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

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

  async function handleCopy(text: string, label: string) {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
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
  const sentryDsn = `https://${dsnKey}@${ingestBase.replace(/https?:\/\//, "")}/1`

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
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">
                <Link href={`/projects/${project.id}`} className="hover:text-primary transition-colors">
                  {project.name}
                </Link>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Created {created}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRotate} disabled={rotating}>
                {rotating ? "Rotating..." : "Rotate DSN"}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)} disabled={deleting}>
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Faultline DSN */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Faultline SDK</p>
            <div className="dsn flex items-center justify-between gap-2">
              <code className="text-xs text-primary break-all">{dsn}</code>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-7 text-xs"
                onClick={() => handleCopy(dsn, "DSN")}
              >
                Copy
              </Button>
            </div>
          </div>

          {/* Sentry DSN */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Sentry SDK (any language)</p>
            <div className="dsn flex items-center justify-between gap-2">
              <code className="text-xs text-primary break-all">{sentryDsn}</code>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-7 text-xs"
                onClick={() => handleCopy(sentryDsn, "Sentry DSN")}
              >
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
