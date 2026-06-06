"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { deleteProject, rotateDsn, type ProjectDto } from "@/lib/api"
import { ConfirmModal } from "@/components/confirm-modal"

export function ProjectCard({ project }: { project: ProjectDto }) {
  const [dsn, setDsn] = useState(project.dsn)
  const [dsnKey, setDsnKey] = useState(project.dsnKey)
  const [rotating, setRotating] = useState(false)
  const [copied, setCopied] = useState(false)
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

  async function handleCopy() {
    await navigator.clipboard.writeText(dsn)
    setCopied(true)
    toast.success("DSN copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
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

  const created = new Date(project.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })

  const ingestBase = dsn.substring(0, dsn.lastIndexOf("/ingest/"))
  const sdkSnippet = `import { Faultline } from "faultline"

Faultline.init({
  dsn: "${dsnKey}",
  baseUrl: "${ingestBase}"
})`

  return (
    <div className="card">
      <ConfirmModal
        open={confirmOpen}
        title={`Delete "${project.name}"?`}
        message="All errors and alert configs for this project will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold">
            <Link href={`/projects/${project.id}`} className="hover:text-[#ffb36b] transition-colors">
              {project.name}
            </Link>
          </h3>
          <p className="text-sm text-white/60 mt-0.5">Created {created}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={handleRotate} disabled={rotating}>
            {rotating ? "Rotating..." : "Rotate DSN"}
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => setConfirmOpen(true)} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="dsn flex items-center justify-between gap-2 mb-4">
        <code className="text-sm text-[#ffb36b] break-all">{dsn}</code>
        <button className="btn btn-sm" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <details className="group">
        <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60 transition-colors select-none">
          SDK Setup
        </summary>
        <pre className="code-block mt-2 text-xs">{sdkSnippet}</pre>
      </details>
    </div>
  )
}
