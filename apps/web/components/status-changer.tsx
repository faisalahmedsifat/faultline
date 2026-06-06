"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
  const router = useRouter()

  async function changeStatus(status: ErrorStatus) {
    setLoading(status)
    try {
      await updateErrorStatus(errorId, status)
      router.refresh()
      toast.success(`Status changed to ${status}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed")
    } finally {
      setLoading(null)
    }
  }

  return (
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
  )
}
