"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function ErrorFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params}`)
  }

  return (
    <div className="flex gap-3 flex-wrap items-center">
      <select
        className="select"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => setFilter("status", e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="ignored">Ignored</option>
        <option value="resolved">Resolved</option>
      </select>

      <input
        className="input max-w-[160px]"
        placeholder="Filter env..."
        value={searchParams.get("env") ?? ""}
        onChange={(e) => setFilter("env", e.target.value)}
      />
    </div>
  )
}
