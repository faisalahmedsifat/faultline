"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createProject } from "@/lib/api"

export function CreateProjectForm() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setLoading(true)
    try {
      const result = await createProject(trimmed)
      setName("")
      router.refresh()
      toast.success(`"${result.project.name}" created`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="My SaaS App"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={120}
        required
        className="flex-1"
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create"}
      </Button>
    </form>
  )
}
