"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createProject } from "@/lib/api"

export function CreateProjectForm() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)

    try {
      await createProject(trimmed)
      setName("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="toast toast-error mb-4">{error}</div>}
      <div className="flex gap-2 items-end">
        <input
          className="input flex-1"
          placeholder="My SaaS App"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create Project"}
        </button>
      </div>
    </form>
  )
}
