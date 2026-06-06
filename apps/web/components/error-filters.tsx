"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function ErrorFilters({
  page,
  totalPages
}: {
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when filters change
    if (key !== "page") params.delete("page")
    router.push(`${pathname}?${params}`)
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams)
    if (p <= 1) {
      params.delete("page")
    } else {
      params.set("page", String(p))
    }
    router.push(`${pathname}?${params}`)
  }

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex gap-3 items-center">
        <select
          className="select"
          value={searchParams.get("status") ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="ignored">Ignored</option>
          <option value="resolved">Resolved</option>
        </select>

        <input
          className="input max-w-[140px]"
          placeholder="Filter env..."
          value={searchParams.get("env") ?? ""}
          onChange={(e) => setParam("env", e.target.value)}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Prev
          </button>
          <span className="text-white/60 tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            className="btn btn-sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
