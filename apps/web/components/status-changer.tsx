"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateErrorStatus, type ErrorStatus } from "@/lib/api"

const STATUSES: { value: ErrorStatus; label: string }[] = [
  { value: "open", label: "Reopen" },
  { value: "ignored", label: "Ignore" },
  { value: "resolved", label: "Resolve" }
]

export function StatusChanger({
  errorId,
  currentStatus
}: {
  errorId: string
  currentStatus: ErrorStatus
}) {
  const [loading, setLoading] = useState<ErrorStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function changeStatus(status: ErrorStatus) {
    setLoading(status)
    setError(null)
    try {
      await updateErrorStatus(errorId, status)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      {error && <div className="toast toast-error mb-3">{error}</div>}
      <div className="flex gap-2">
        {STATUSES.map(({ value, label }) => {
          const isCurrent = currentStatus === value
          const isLoading = loading === value

          return (
            <button
              key={value}
              className={`btn btn-sm ${isCurrent ? "opacity-40 cursor-default" : ""}`}
              onClick={() => !isCurrent && changeStatus(value)}
              disabled={isLoading || isCurrent}
            >
              {isLoading ? "..." : label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
