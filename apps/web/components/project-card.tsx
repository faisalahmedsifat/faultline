"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { deleteProject, rotateDsn, type ProjectDto } from "@/lib/api"

export function ProjectCard({ project }: { project: ProjectDto }) {
  const [dsn, setDsn] = useState(project.dsn)
  const [dsnKey, setDsnKey] = useState(project.dsnKey)
  const [rotating, setRotating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleRotate() {
    setRotating(true)
    setError(null)
    try {
      const result = await rotateDsn(project.id)
      setDsn(result.project.dsn)
      setDsnKey(result.project.dsnKey)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rotation failed")
    } finally {
      setRotating(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(dsn)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${project.name}" and all its errors? This cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteProject(project.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
      setDeleting(false)
    }
  }

  const created = new Date(project.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })

  return (
    <div className="card">
      {error && <div className="toast toast-error mb-4">{error}</div>}

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
          <button className="btn btn-sm btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="dsn flex items-center justify-between gap-2">
        <code className="text-sm text-[#ffb36b] break-all">{dsn}</code>
        <button className="btn btn-sm" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  )
}
